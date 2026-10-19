"use strict";
const {z}=require("zod");
const text=(max,min=0)=>z.string().trim().min(min).max(max);
const numeric=(min,max,integer=false)=>z.preprocess(value=>{
  if(typeof value!=="string")return value;
  const clean=value.trim();
  return clean.length<=64&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(clean)?Number(clean):value;
},integer?z.number().finite().int().min(min).max(max):z.number().finite().min(min).max(max));
const amount=numeric(0,100000000),margin=numeric(0,90),count=numeric(1,1000000000,true);
const operation=z.enum(["producao","revenda","servico","misto"]);
// SQLite legado usa 32 hexadecimais; PostgreSQL retorna UUID com hífens.
const identifier=z.string().regex(/^(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i);
const cost=z.object({label:text(180).optional(),name:text(180).optional(),value:amount}).passthrough();
const competitor=z.object({name:text(180).optional(),price:amount,category:text(180).optional(),productId:text(100).optional(),productName:text(180).optional()}).passthrough();
const settings=z.object({
  segment:text(120).optional(),operationType:operation.optional(),positioning:z.enum(["preco","mercado","diferenciacao"]).optional(),
  targetCustomer:text(500).optional(),monthlyUnits:count.optional(),taxesPct:numeric(0,99).optional(),sellingFeesPct:numeric(0,99).optional(),
  defaultMargin:margin.optional(),fixedCosts:z.array(cost).max(100).optional(),competitors:z.array(competitor).max(100).optional()
}).passthrough();
const product=z.object({
  id:text(100).optional(),name:text(180,1),baseCost:amount.optional(),directCost:amount.optional(),direct_cost:amount.optional(),
  salePrice:amount.optional(),targetMargin:margin.optional(),units:count.optional(),additionalCosts:z.array(cost).max(100).optional()
}).passthrough();
const scenario=z.object({
  id:text(100).optional(),label:text(100).optional(),price:amount,units:numeric(1,1000000,true),margin,
  changePct:numeric(-100,500),changeMode:z.enum(["fixed","variable"])
}).passthrough();
const schemas={
  signup:z.object({name:text(160,1),email:z.string().trim().max(254).email(),password:z.string().min(8).max(256)}),
  login:z.object({email:z.string().trim().max(254).email(),password:z.string().min(1).max(256)}),
  profile:z.object({name:text(160,2)}),
  company:z.object({name:text(160,1),segment:text(120).optional(),operationType:operation,costingMode:text(32).optional(),categories:z.array(text(120,1)).max(60).optional()}).passthrough(),
  settings:z.object({settings}),
  products:z.object({products:z.array(product).max(500)}),
  product:z.object({name:text(180,1),directCost:amount,salePrice:amount,targetMargin:margin.optional(),units:count.optional(),operationType:operation.optional(),inputs:z.array(z.object({value:amount.optional()}).passthrough()).max(100).optional()}).passthrough(),
  calculate:z.object({unitDirectCost:amount.optional(),salePrice:amount.optional(),targetMargin:margin.optional(),units:numeric(0,1000000000,true).optional()}).passthrough(),
  sales:z.object({productId:identifier,period:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),averagePrice:numeric(0.000001,100000000),soldUnits:numeric(0,1000000000,true)}),
  simulation:z.object({name:text(100,1),productId:identifier,snapshot:z.object({scenarios:z.array(scenario).length(3),references:z.array(z.object({name:text(180).optional(),price:amount}).passthrough()).max(30).optional(),selected:text(100).optional()}).passthrough()})
};
function validateBody(schema){
  return (req,res,next)=>{
    const result=schema.safeParse(req.body);
    if(!result.success)return res.status(400).json({error:"Revise os dados enviados.",issues:result.error.issues.map(issue=>({field:issue.path.join("."),message:"Valor ausente, inválido ou fora do intervalo permitido."}))});
    req.body=result.data;
    next();
  };
}
module.exports={schemas,validateBody};
