"use strict";
const {randomUUID}=require("node:crypto");
const {z}=require("zod");
const {query,getPool,provider}=require("./database");
const pricing=require("../shared/pricing-core");
const money=require("../shared/money");
const decode=value=>typeof value==="string"?JSON.parse(value):value;
const fail=(status,message)=>{const e=new Error(message);e.status=status;throw e;};
const amount=z.number().finite().min(0).max(1e8);
const productSchema=z.object({name:z.string().trim().min(1).max(180),category:z.string().trim().max(120),costs:z.array(z.object({name:z.string().trim().min(1).max(180),value:amount}).strict()).min(2).max(100),salePrice:amount,targetMargin:z.number().min(0).max(90),units:z.number().int().min(1).max(1000000)}).strict();
const properties={name:{type:"STRING"},category:{type:"STRING"},costs:{type:"ARRAY",description:"No mínimo dois custos unitários reais informados pelo usuário. Nunca invente valores.",items:{type:"OBJECT",properties:{name:{type:"STRING"},value:{type:"NUMBER"}},required:["name","value"]}},salePrice:{type:"NUMBER"},targetMargin:{type:"NUMBER"},units:{type:"INTEGER",description:"Volume mensal estimado informado pelo usuário"}};
const productParameters={type:"OBJECT",properties,required:Object.keys(properties)};
const declarations=[
 {name:"list_products",description:"Consulta produtos da conta logada; use para encontrar o ID antes de alterar um produto.",parameters:{type:"OBJECT",properties:{search:{type:"STRING"}},required:[]}},
 {name:"create_product",description:"Prepara cadastro de um produto ou serviço. Pergunte os dados faltantes. Só salva após confirmação no card.",parameters:productParameters},
 {name:"update_product",description:"Prepara alteração de um produto existente. Consulte o ID e preserve dados não alterados. Só salva após confirmação.",parameters:{type:"OBJECT",properties:{productId:{type:"STRING"},product:productParameters},required:["productId","product"]}},
 {name:"calculate_price",description:"Calcula preço com a fórmula ZUZ e configurações reais da empresa. Não salva alterações.",parameters:{type:"OBJECT",properties:{unitDirectCost:{type:"NUMBER"},salePrice:{type:"NUMBER"},targetMargin:{type:"NUMBER"},units:{type:"INTEGER"}},required:["unitDirectCost","salePrice","targetMargin","units"]}}
];
let ready;
function ensureSchema(){
 if(!ready)ready=query(`CREATE TABLE IF NOT EXISTS zuz_ai_actions (
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL,company_id TEXT NOT NULL,conversation_id TEXT NOT NULL,
 kind TEXT NOT NULL,payload TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL)`)
 .then(()=>provider==="postgresql"?query("ALTER TABLE zuz_ai_actions ENABLE ROW LEVEL SECURITY"):null).catch(e=>{ready=null;throw e;});
 return ready;
}
async function companyFor(userId,db={query}){
 const company=(await db.query("SELECT * FROM zuz_companies WHERE owner_id=$1",[userId])).rows[0];
 if(!company)fail(404,"Configure sua empresa antes de usar as ações da Zuni.");return company;
}
function normalized(row){
 const p=row.payload&&Object.keys(row.payload).length?row.payload:{};
 return {id:row.id,name:p.name||row.name,category:p.category||row.category||"Sem categoria",costs:p.additionalCosts?.length?[...(Number(p.baseCost)>0?[{name:"Custo principal",value:Number(p.baseCost)}]:[]),...p.additionalCosts.map(c=>({name:c.name||c.label||"Custo",value:Number(c.value)}))]:[{name:"Custo direto",value:Number(row.direct_cost)}],salePrice:Number(p.salePrice??row.sale_price),targetMargin:Number(p.targetMargin??row.target_margin),units:Number(p.units??row.units)};
}
async function executeTool(call,userId,conversationId){
 const company=await companyFor(userId);const args=call.args||{};
 if(call.name==="list_products"){
  const {search=""}=z.object({search:z.string().max(180).optional()}).strict().parse(args);
  const rows=(await query("SELECT * FROM zuz_products WHERE company_id=$1 ORDER BY created_at DESC LIMIT 500",[company.id])).rows.map(normalized).filter(p=>p.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
  return {reply:rows.length?"Produtos encontrados:\n"+rows.slice(0,30).map(p=>`${p.name} — R$ ${p.salePrice.toFixed(2)}\nID: ${p.id}\nCustos: ${p.costs.map(c=>`${c.name}: R$ ${c.value.toFixed(2)}`).join("; ")}\nCategoria: ${p.category}; margem: ${p.targetMargin}%; volume: ${p.units}`).join("\n\n"):"Nenhum produto encontrado na sua conta."};
 }
 if(call.name==="calculate_price"){
  const input=z.object({unitDirectCost:amount,salePrice:amount,targetMargin:z.number().min(0).max(90),units:z.number().int().min(1).max(1000000)}).strict().parse(args);
  const result=pricing.calculate({...input,settings:company.settings||{}});
  return {reply:`Cálculo ZUZ com as configurações da sua empresa:\nPreço sugerido: R$ ${result.suggestedPrice.toFixed(2)}\nCusto unitário: R$ ${result.unitBaseCost.toFixed(2)}\nResultado unitário: R$ ${result.unitProfit.toFixed(2)}\nNenhum cadastro foi alterado.`};
 }
 if(!["create_product","update_product"].includes(call.name))fail(400,"Ação não disponível na Zuni.");
 let product,original=null,productId=null;
 if(call.name==="update_product"){
  const parsed=z.object({productId:z.string().uuid(),product:productSchema}).strict().parse(args);product=parsed.product;productId=parsed.productId;
  original=(await query("SELECT * FROM zuz_products WHERE id=$1 AND company_id=$2",[productId,company.id])).rows[0];
  if(!original)fail(404,"Produto não encontrado na sua conta.");
 }else product=productSchema.parse(args);
 await ensureSchema();
 const id=randomUUID();const payload={product,productId,original:original?JSON.stringify(original):null};
 await query("INSERT INTO zuz_ai_actions(id,user_id,company_id,conversation_id,kind,payload,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)",[id,userId,company.id,conversationId,call.name,JSON.stringify(payload),new Date().toISOString()]);
 return {reply:call.name==="create_product"?"Preparei o cadastro. Confira os dados e clique em Confirmar cadastro para salvar na sua conta.":"Preparei a alteração. Confira os dados e confirme para salvar.",action:{id,kind:call.name,product,state:"pending"}};
}
async function listActions(userId,conversationId){
 await ensureSchema();return (await query("SELECT * FROM zuz_ai_actions WHERE user_id=$1 AND conversation_id=$2 ORDER BY created_at",[userId,conversationId])).rows.map(r=>({id:r.id,kind:r.kind,product:decode(r.payload).product,state:r.state}));
}
async function resolveAction(userId,id,decision,appendRecommendation){
 if(!z.string().uuid().safeParse(id).success||!["confirm","cancel"].includes(decision))fail(400,"Ação inválida.");
 await ensureSchema();const client=await getPool().connect();
 try{
  await client.query("BEGIN");
  const action=(await client.query("SELECT * FROM zuz_ai_actions WHERE id=$1 AND user_id=$2"+(provider==="postgresql"?" FOR UPDATE":""),[id,userId])).rows[0];
  if(!action)fail(404,"Ação não encontrada.");
  if(action.state!=="pending"){await client.query("COMMIT");return {state:action.state};}
  const company=await companyFor(userId,client);
  if(String(company.id)!==action.company_id)fail(403,"Esta ação pertence a outra empresa.");
  if(decision==="cancel"){
   await client.query("UPDATE zuz_ai_actions SET state='cancelled' WHERE id=$1 AND user_id=$2",[id,userId]);await client.query("COMMIT");return {state:"cancelled"};
  }
  if(Date.now()-Date.parse(action.created_at)>86400000)fail(409,"Esta proposta expirou. Peça uma nova à Zuni.");
  const data=decode(action.payload),p=productSchema.parse(data.product);
  const direct=money.sum(p.costs.map(c=>c.value));if(direct>1e8)fail(400,"Custo total acima do limite.");
  let current=null;
  if(action.kind==="update_product"){
   current=(await client.query("SELECT * FROM zuz_products WHERE id=$1 AND company_id=$2"+(provider==="postgresql"?" FOR UPDATE":""),[data.productId,company.id])).rows[0];
   if(!current||JSON.stringify(current)!==data.original)fail(409,"O produto mudou desde a proposta. Peça uma nova alteração à Zuni.");
  }else if(action.kind!=="create_product")fail(400,"Ação desconhecida.");
  const count=(await client.query("SELECT COUNT(*) AS total FROM zuz_products WHERE company_id=$1",[company.id])).rows[0];
  if(!current&&Number(count.total)>=500)fail(409,"Limite de 500 produtos atingido.");
  const productId=current?.id||randomUUID();
  const payload={...(current?.payload||{}),id:productId,name:p.name,category:p.category,baseCost:0,additionalCosts:p.costs,salePrice:p.salePrice,targetMargin:p.targetMargin,units:p.units};
  if(current)await client.query("UPDATE zuz_products SET name=$1,category=$2,inputs=$3::jsonb,direct_cost=$4,sale_price=$5,target_margin=$6,units=$7,payload=$8::jsonb WHERE id=$9 AND company_id=$10",[p.name,p.category,JSON.stringify(p.costs),direct,p.salePrice,p.targetMargin,p.units,JSON.stringify(payload),productId,company.id]);
  else await client.query("INSERT INTO zuz_products(id,company_id,name,operation_type,category,costing_mode,inputs,direct_cost,sale_price,target_margin,units,payload) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12::jsonb)",[productId,company.id,p.name,company.operation_type,p.category,company.costing_mode,JSON.stringify(p.costs),direct,p.salePrice,p.targetMargin,p.units,JSON.stringify(payload)]);
  if(appendRecommendation)await appendRecommendation(client,company.id,payload,company.settings||{});
  await client.query("UPDATE zuz_ai_actions SET state='completed' WHERE id=$1 AND user_id=$2",[id,userId]);
  await client.query("INSERT INTO zuz_ai_messages(id,conversation_id,role,content) VALUES($1,$2,'model',$3)",[randomUUID(),action.conversation_id,`Ação confirmada e salva: ${p.name}. ID: ${productId}`]);
  await client.query("COMMIT");return {state:"completed",productId};
 }catch(e){await client.query("ROLLBACK");throw e;}finally{client.release();}
}
module.exports={declarations,executeTool,listActions,resolveAction};
