"use strict";
const {query,getPool,provider}=require("./database");
const pricing=require("../shared/pricing-core");
const money=require("../shared/money");

const number=v=>Number(v);
function positiveInt(value,zero=false){
 return Number.isSafeInteger(value)&&value>=(zero?0:1)&&value<=1000000000;
}
function validMoney(v,allowZero=false){return Number.isFinite(v)&&(allowZero?v>=0:v>0)&&v<=100000000;}
function productPricing(p,settings){
 const extras=Array.isArray(p.additionalCosts)?p.additionalCosts:[];
 const direct=money.sum([Number(p.baseCost??p.direct_cost??0),...extras.map(x=>Number(x.value??0))]);
 return pricing.calculate({unitDirectCost:direct,salePrice:Number(p.salePrice??p.sale_price??0),targetMargin:Number(p.targetMargin??30),units:Number(p.units??1),category:p.category,productId:p.id,productName:p.name,settings});
}
function registerSalesInventory(router,{asyncRoute,getCompany}){
 router.get("/company/inventory",asyncRoute(async(req,res)=>{
  const company=await getCompany(req.user.id);
  if(!company)return res.status(404).json({error:"Configure sua empresa."});
  const [inventory,sales]=await Promise.all([
   query("SELECT product_id,quantity FROM zuz_inventory WHERE company_id=$1",[company.id]),
   query("SELECT id,product_id,quantity,unit_price,unit_cost,sold_at,created_at FROM zuz_sales WHERE company_id=$1 ORDER BY sold_at DESC,created_at DESC LIMIT 500",[company.id])
  ]);
  res.setHeader("Cache-Control","private, no-store");
  res.json({inventory:inventory.rows,sales:sales.rows});
 }));
 router.put("/company/inventory/:productId",asyncRoute(async(req,res)=>{
  const company=await getCompany(req.user.id);if(!company)return res.status(404).json({error:"Configure sua empresa."});
  const productId=String(req.params.productId||"");
  const quantity=number(req.body?.quantity);
  if(!positiveInt(quantity,true))return res.status(400).json({error:"Informe uma quantidade inteira de estoque."});
  const client=await getPool().connect();
  try{
   await client.query("BEGIN");
   const found=await client.query("SELECT id FROM zuz_products WHERE company_id=$1 AND id=$2",[company.id,productId]);
   if(!found.rows.length){await client.query("ROLLBACK");return res.status(404).json({error:"Produto não encontrado."});}
   await client.query("INSERT INTO zuz_inventory(company_id,product_id,quantity) VALUES($1,$2,$3) ON CONFLICT(company_id,product_id) DO UPDATE SET quantity=excluded.quantity,updated_at=CURRENT_TIMESTAMP",[company.id,productId,quantity]);
   await client.query("COMMIT");
   res.json({ok:true,productId,quantity});
  }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
 }));
 router.post("/company/sales",asyncRoute(async(req,res)=>{
  const company=await getCompany(req.user.id);if(!company)return res.status(404).json({error:"Configure sua empresa."});
  const productId=String(req.body?.productId||"");
  const quantity=number(req.body?.quantity),unitPrice=number(req.body?.unitPrice);
  const soldAt=String(req.body?.soldAt||"");
  if(!positiveInt(quantity)||!validMoney(unitPrice)||!/^(20\d{2})-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(soldAt)||!Number.isFinite(Date.parse(soldAt+"T12:00:00Z"))||new Date(soldAt+"T12:00:00Z").toISOString().slice(0,10)!==soldAt)
   return res.status(400).json({error:"Revise produto, quantidade, preço e data da venda."});
  const client=await getPool().connect();
  try{
   await client.query("BEGIN");
   const result=await client.query("SELECT * FROM zuz_products WHERE company_id=$1 AND id=$2"+(provider==="postgresql"?" FOR UPDATE":""),[company.id,productId]);
   if(!result.rows.length){await client.query("ROLLBACK");return res.status(404).json({error:"Produto não encontrado."});}
   const current=result.rows[0];
   const inventory=await client.query("UPDATE zuz_inventory SET quantity=quantity-$3,updated_at=CURRENT_TIMESTAMP WHERE company_id=$1 AND product_id=$2 AND quantity >= $3 RETURNING quantity",[company.id,productId,quantity]);
   if(!inventory.rows.length){await client.query("ROLLBACK");return res.status(409).json({error:"Estoque insuficiente. Cadastre a quantidade disponível antes da venda."});}
   const product=current.payload&&typeof current.payload==="object"?current.payload:current;
   const base=productPricing(product,company.settings||{});
   // Custo variável unitário total inclui encargos de venda calculados sobre o preço REAL.
   const unitCost=Number(base.unitBaseCost)+unitPrice*Number(base.variableRatePct||0)/100;
   if(!validMoney(unitCost,true)){await client.query("ROLLBACK");return res.status(400).json({error:"Não foi possível calcular o custo da venda."});}
   const id=require("crypto").randomUUID();
   await client.query("INSERT INTO zuz_sales(id,company_id,product_id,quantity,unit_price,unit_cost,sold_at) VALUES($1,$2,$3,$4,$5,$6,$7)",[id,company.id,productId,quantity,unitPrice,unitCost,soldAt]);
   await client.query("COMMIT");
   res.status(201).json({ok:true,sale:{id,product_id:productId,quantity,unit_price:unitPrice,unit_cost:unitCost,sold_at:soldAt},remaining:inventory.rows[0].quantity});
  }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
 }));
}
module.exports={registerSalesInventory};
