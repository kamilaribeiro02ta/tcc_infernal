"use strict";
const {randomUUID}=require("node:crypto");
const {z}=require("zod");
const {query,getPool,provider}=require("./database");
const pricing=require("../shared/pricing-core");
const money=require("../shared/money");
const decode=value=>typeof value==="string"?JSON.parse(value):value;
const fail=(status,message)=>{const e=new Error(message);e.status=status;throw e;};
const amount=z.number().finite().min(0).max(1e8);
const productSchema=z.object({name:z.string().trim().min(1).max(180),category:z.string().trim().max(120),costs:z.array(z.object({name:z.string().trim().min(1).max(180),value:amount}).strict()).min(1).max(100),salePrice:amount,targetMargin:z.number().min(0).max(90),units:z.number().int().min(1).max(1000000)}).strict();

const day=z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/).refine(v=>!Number.isNaN(Date.parse(v+"T12:00:00Z"))&&new Date(v+"T12:00:00Z").toISOString().slice(0,10)===v,"Data inválida");
const calendarSchema=z.object({title:z.string().trim().min(1).max(160),type:z.enum(["compromisso","encomenda","lembrete","observacao"]),date:day,time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),notes:z.string().max(3000).optional()}).strict();
const settingsSchema=z.object({segment:z.string().trim().max(120).optional(),operationType:z.enum(["producao","revenda","servico","misto"]).optional(),positioning:z.enum(["preco","mercado","diferenciacao"]).optional(),targetCustomer:z.string().trim().max(500).optional(),monthlyUnits:z.number().int().min(1).max(1000000000).optional(),taxesPct:z.number().finite().min(0).max(99).optional(),sellingFeesPct:z.number().finite().min(0).max(99).optional(),defaultMargin:z.number().finite().min(0).max(90).optional()}).strict().refine(x=>Object.keys(x).length>0,"Informe uma mudança.");
const stockSchema=z.object({productId:z.string().uuid(),quantity:z.number().int().min(0).max(1000000000)}).strict();
const saleSchema=z.object({productId:z.string().uuid(),quantity:z.number().int().min(1).max(1000000000),unitPrice:amount.positive(),soldAt:day}).strict();
const calendarProperties={title:{type:"STRING"},type:{type:"STRING",enum:["compromisso","encomenda","lembrete","observacao"]},date:{type:"STRING",description:"Data YYYY-MM-DD; informe data explícita, não invente datas relativas sem contexto confiável"},time:{type:"STRING",description:"Hora HH:mm opcional"},notes:{type:"STRING"}};
const recordProposal=async(kind,product,company,userId,conversationId,extra={})=>{
 await ensureSchema();
 const id=randomUUID(),payload={product,...extra};
 await query("INSERT INTO zuz_ai_actions(id,user_id,company_id,conversation_id,kind,payload,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)",[id,userId,company.id,conversationId,kind,JSON.stringify(payload),new Date().toISOString()]);
 return {reply:"Preparei a ação de "+({create_calendar:"calendário",set_inventory:"estoque",record_sale:"venda",update_company_settings:"configurações da empresa"}[kind]||"cadastro")+". Confira todos os detalhes e confirme no card antes de salvar.",action:{id,kind,product,state:"pending"}};
};
const properties={name:{type:"STRING"},category:{type:"STRING"},costs:{type:"ARRAY",description:"Um ou mais custos unitários confirmados pelo usuário. Aceite custo agregado por unidade (total do lote dividido pela quantidade), sem inventar divisão entre ingredientes.",items:{type:"OBJECT",properties:{name:{type:"STRING"},value:{type:"NUMBER"}},required:["name","value"]}},salePrice:{type:"NUMBER"},targetMargin:{type:"NUMBER"},units:{type:"INTEGER",description:"Volume mensal estimado informado pelo usuário"}};
const productParameters={type:"OBJECT",properties,required:Object.keys(properties)};
const declarations=[
 {name:"list_products",description:"Consulta produtos da conta logada; use para encontrar o ID antes de alterar um produto.",parameters:{type:"OBJECT",properties:{search:{type:"STRING"}},required:[]}},
 {name:"create_product",description:"Prepara cadastro com custos unitários confirmados, inclusive um custo agregado; preço, margem e volume podem ser sugestões explicitamente aprovadas pelo usuário. Só salva após confirmação no card.",parameters:productParameters},
 {name:"update_product",description:"Prepara alteração de um produto existente. Consulte o ID e preserve dados não alterados. Só salva após confirmação.",parameters:{type:"OBJECT",properties:{productId:{type:"STRING"},product:productParameters},required:["productId","product"]}},
 {name:"get_company_settings",description:"Consulta configurações atuais da empresa do usuário, incluindo margem, taxas, posicionamento e público-alvo.",parameters:{type:"OBJECT",properties:{},required:[]}},
 {name:"update_company_settings",description:"Prepara alteração parcial de configurações da empresa. Só modifica os campos explicitamente informados e aprovados. Exige confirmação em card antes de salvar.",parameters:{type:"OBJECT",properties:{segment:{type:"STRING"},operationType:{type:"STRING",enum:["producao","revenda","servico","misto"]},positioning:{type:"STRING",enum:["preco","mercado","diferenciacao"]},targetCustomer:{type:"STRING"},monthlyUnits:{type:"INTEGER"},taxesPct:{type:"NUMBER"},sellingFeesPct:{type:"NUMBER"},defaultMargin:{type:"NUMBER"}},required:[]}},
 {name:"list_inventory",description:"Consulta estoque real da conta. Para definir estoque, primeiro consulte produto pelo ID.",parameters:{type:"OBJECT",properties:{search:{type:"STRING"}},required:[]}},
 {name:"list_calendar",description:"Consulta compromissos, encomendas e lembretes existentes em um período. Não escreve.",parameters:{type:"OBJECT",properties:{start:{type:"STRING"},end:{type:"STRING"}},required:["start","end"]}},
 {name:"create_calendar",description:"Prepara novo compromisso, encomenda, lembrete ou observação no calendário. Não salva sem confirmação; peça data exata se ambígua.",parameters:{type:"OBJECT",properties:calendarProperties,required:["title","type","date"]}},
 {name:"set_inventory",description:"Prepara ajuste da quantidade TOTAL disponível em estoque, não acréscimo. Consulte o ID real do produto; só salva após confirmação.",parameters:{type:"OBJECT",properties:{productId:{type:"STRING"},quantity:{type:"INTEGER"}},required:["productId","quantity"]}},
 {name:"record_sale",description:"Prepara venda de produto existente, com desconto automático do estoque após confirmação; exige quantidade disponível, preço unitário e data da venda.",parameters:{type:"OBJECT",properties:{productId:{type:"STRING"},quantity:{type:"INTEGER"},unitPrice:{type:"NUMBER"},soldAt:{type:"STRING"}},required:["productId","quantity","unitPrice","soldAt"]}},
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


 if(call.name==="get_company_settings"){
  z.object({}).strict().parse(args);
  return {reply:"Configurações atuais da sua empresa:\n"+JSON.stringify({name:company.name,segment:company.segment,operationType:company.operation_type,settings:company.settings||{}},null,2)};
 }
 if(call.name==="update_company_settings"){
  const changes=settingsSchema.parse(args);
  const original=JSON.stringify({settings:company.settings||{},segment:company.segment,operationType:company.operation_type});
  return recordProposal(call.name,changes,company,userId,conversationId,{original});
 }
 if(call.name==="list_inventory"){
  const {search=""}=z.object({search:z.string().max(180).optional()}).strict().parse(args);
  const result=await query("SELECT p.id,p.name,COALESCE(i.quantity,0) AS quantity FROM zuz_products p LEFT JOIN zuz_inventory i ON i.product_id=p.id AND i.company_id=p.company_id WHERE p.company_id=$1 ORDER BY p.name LIMIT 500",[company.id]);
  const rows=result.rows.filter(p=>p.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))).slice(0,40);
  return {reply:rows.length?rows.map(p=>p.name+" — "+p.quantity+" unidade(s), ID: "+p.id).join("\n"):"Nenhum produto encontrado."};
 }
 if(call.name==="list_calendar"){
  const period=z.object({start:day,end:day}).strict().parse(args);
  if(period.start>period.end)fail(400,"O intervalo de datas está invertido.");
  const events=await query("SELECT title,type,event_date,event_time,notes FROM zuz_calendar_events WHERE company_id=$1 AND event_date BETWEEN $2 AND $3 ORDER BY event_date,event_time LIMIT 80",[company.id,period.start,period.end]);
  return {reply:events.rows.length?events.rows.map(e=>e.title+" ("+e.type+") em "+e.event_date+(e.event_time?" às "+e.event_time:"")+(e.notes?" — "+e.notes:"")).join("\n"):"Nenhum evento nesse período."};
 }
 if(call.name==="create_calendar")return recordProposal(call.name,calendarSchema.parse(args),company,userId,conversationId);
 if(call.name==="set_inventory"||call.name==="record_sale"){
  const product=call.name==="set_inventory"?stockSchema.parse(args):saleSchema.parse(args);
  const found=(await query("SELECT id,name FROM zuz_products WHERE id=$1 AND company_id=$2",[product.productId,company.id])).rows[0];
  if(!found)fail(404,"Produto não encontrado na sua conta. Consulte a lista primeiro.");
  return recordProposal(call.name,{...product,productName:found.name},company,userId,conversationId);
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
  const data=decode(action.payload);
  if(["create_calendar","set_inventory","record_sale","update_company_settings"].includes(action.kind)){
   const p=action.kind==="create_calendar"?calendarSchema.parse(data.product):action.kind==="set_inventory"?stockSchema.strip().parse(data.product):action.kind==="record_sale"?saleSchema.strip().parse(data.product):settingsSchema.parse(data.product);
   let savedId=null;
   if(action.kind==="update_company_settings"){
    const fresh=(await client.query("SELECT * FROM zuz_companies WHERE id=$1 AND owner_id=$2"+(provider==="postgresql"?" FOR UPDATE":""),[company.id,userId])).rows[0];
    if(!fresh||JSON.stringify({settings:fresh.settings||{},segment:fresh.segment,operationType:fresh.operation_type})!==data.original)fail(409,"As configurações mudaram desde a proposta. Peça uma nova à Zuni.");
    const settings=pricing.normalize({...fresh.settings,...p,segment:p.segment??fresh.segment,operationType:p.operationType??fresh.operation_type});
    if(settings.taxesPct+settings.sellingFeesPct+settings.defaultMargin>=100)fail(400,"Taxas, tarifas e margem padrão precisam somar menos de 100%.");
    await client.query("UPDATE zuz_companies SET settings=$1::jsonb,segment=$2,operation_type=$3,updated_at=NOW() WHERE id=$4 AND owner_id=$5",[JSON.stringify(settings),p.segment??fresh.segment,p.operationType??fresh.operation_type,company.id,userId]);
   }else    if(action.kind==="create_calendar"){
    savedId=randomUUID();
    await client.query("INSERT INTO zuz_calendar_events(id,company_id,title,type,event_date,event_time,notes) VALUES($1,$2,$3,$4,$5,$6,$7)",[savedId,company.id,p.title,p.type,p.date,p.time||null,p.notes||""]);
   }else{
    const current=(await client.query("SELECT * FROM zuz_products WHERE id=$1 AND company_id=$2"+(provider==="postgresql"?" FOR UPDATE":""),[p.productId,company.id])).rows[0];
    if(!current)fail(404,"Produto não encontrado na sua conta.");
    if(action.kind==="set_inventory"){
     await client.query("INSERT INTO zuz_inventory(company_id,product_id,quantity) VALUES($1,$2,$3) ON CONFLICT(company_id,product_id) DO UPDATE SET quantity=excluded.quantity,updated_at=CURRENT_TIMESTAMP",[company.id,p.productId,p.quantity]);
    }else{
     const inventory=await client.query("UPDATE zuz_inventory SET quantity=quantity-$3,updated_at=CURRENT_TIMESTAMP WHERE company_id=$1 AND product_id=$2 AND quantity >= $3 RETURNING quantity",[company.id,p.productId,p.quantity]);
     if(!inventory.rows.length)fail(409,"Estoque insuficiente. Ajuste o estoque antes de confirmar a venda.");
     const item=current.payload&&typeof current.payload==="object"?current.payload:current;
     const costs=Array.isArray(item.additionalCosts)?item.additionalCosts:[];
     const direct=money.sum([Number(item.baseCost??item.direct_cost??0),...costs.map(c=>Number(c.value||0))]);
     const calculation=pricing.calculate({unitDirectCost:direct,salePrice:p.unitPrice,targetMargin:Number(item.targetMargin??current.target_margin??30),units:Number(item.units??current.units??1),category:item.category,productId:p.productId,productName:item.name,settings:company.settings||{}});
     const unitCost=Number(calculation.directCost)+p.unitPrice*Number(calculation.variableRatePct||0)/100;
     if(!Number.isFinite(unitCost)||unitCost<0||unitCost>1e8)fail(400,"Custo da venda inválido.");
     savedId=randomUUID();
     await client.query("INSERT INTO zuz_sales(id,company_id,product_id,quantity,unit_price,unit_cost,sold_at) VALUES($1,$2,$3,$4,$5,$6,$7)",[savedId,company.id,p.productId,p.quantity,p.unitPrice,unitCost,p.soldAt]);
    }
   }
   await client.query("UPDATE zuz_ai_actions SET state='completed' WHERE id=$1 AND user_id=$2",[id,userId]);
   await client.query("INSERT INTO zuz_ai_messages(id,conversation_id,role,content) VALUES($1,$2,'model',$3)",[randomUUID(),action.conversation_id,"Ação confirmada e salva: "+action.kind+"."]);
   await client.query("COMMIT");return {state:"completed",id:savedId};
  }
  const p=productSchema.parse(data.product);
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
