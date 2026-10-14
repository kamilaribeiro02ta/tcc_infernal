"use strict";
const simulation=require("../shared/simulation-core");
const {query}=require("./database");
const crypto=require("node:crypto");
const brl=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n);
const safeText=(s,max=120)=>String(s||"").trim().slice(0,max);
const fail=(code,message)=>{const e=new Error(message);e.status=code;throw e;};
async function findProduct(company,id){
  const r=await query("SELECT * FROM zuz_products WHERE company_id=$1 AND id=$2",[company.id,String(id||"")]);
  if(!r.rowCount)fail(404,"Produto não encontrado nesta empresa.");
  const row=r.rows[0];
  return row.payload&&Object.keys(row.payload).length?row.payload:row;
}
function references(value){
  if(!Array.isArray(value))return [];
  return value.slice(0,30).map(c=>({name:safeText(c.name||"Referência",90),price:Number(c.price)}))
    .filter(c=>Number.isFinite(c.price)&&c.price>0&&c.price<=100000000);
}
function propose(message,s){
  const text=message.toLowerCase();
  const next={...s};
  const find=(verb,subject)=>text.match(new RegExp(verb+".{0,35}"+subject+".{0,25}?(\\d+(?:[,.]\\d+)?)\\s*%","i"))
    ||text.match(new RegExp(subject+".{0,35}"+verb+".{0,15}?(\\d+(?:[,.]\\d+)?)\\s*%","i"));
  const priceUp=find("aument\\w*|subir|elevar|reajust\\w*","pre[cç]o");
  const priceDown=find("reduz\\w*|diminu\\w*|baixar","pre[cç]o");
  if(priceUp||priceDown){
    const pct=Number((priceUp||priceDown)[1].replace(",","."));
    if(pct>0&&pct<=100)next.price=+(s.price*(1+(priceUp?1:-1)*pct/100)).toFixed(2);
  }
  const less=text.match(/(?:vender|vendendo|venda).{0,25}?(\d+)\s*unidades?\s*a\s*menos/)
    ||text.match(/(\d+)\s*unidades?\s*a\s*menos/);
  const more=text.match(/(?:vender|vendendo|venda).{0,25}?(\d+)\s*unidades?\s*a\s*mais/)
    ||text.match(/(\d+)\s*unidades?\s*a\s*mais/);
  if(less)next.units=Math.max(1,s.units-Number(less[1]));
  else if(more)next.units=Math.min(1000000,s.units+Number(more[1]));
  if(next.price===s.price&&next.units===s.units)return null;
  return simulation.validate(next);
}
async function explain(message,product,report,proposal,proposed){
  const current="Produto "+safeText(product.name)+"; cenário "+report.scenario.label+
    "; preço "+brl(report.salePrice)+"; "+report.units+" unidades; custo variável "+brl(report.variableCost)+
    "; custos fixos do período "+brl(report.fixedTotal)+"; taxas "+report.variableRatePct+
    "%; receita "+brl(report.revenue)+"; resultado estimado "+brl(report.profit)+
    "; ponto de equilíbrio "+(report.breakEvenUnits||"indisponível")+" unidades.";
  const revised=proposed?" Alternativa proposta: preço "+brl(proposed.salePrice)+", "+proposed.units+
    " unidades e resultado "+brl(proposed.profit)+".":"";
  let answer="Com as premissas informadas: "+current+revised+
    " Estes valores são simulações, não uma previsão de vendas. Compare também a aceitação do preço pelo público.";
  if(!process.env.OPENAI_API_KEY)return {answer,source:"analise_calculada"};
  try{
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),12000);
    try {
      const response=await fetch("https://api.openai.com/v1/responses",{
        method:"POST",signal:controller.signal,
        headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({
          model:process.env.OPENAI_MODEL||"gpt-4.1-mini",
          instructions:"Você é ZUZ, assistente em português brasileiro para pequenos negócios. Analise SOMENTE os dados calculados fornecidos. Não invente números, demanda, dados de concorrência nem previsão. Não recomende atualizar cadastros. Explique diferenças, premissas, riscos e deixe claro que volumes são hipotéticos. Responda em até 130 palavras. Não faça cálculos novos sem base nos dados fornecidos.",
          input:"Pergunta: "+message+"\nDados verificados: "+current+revised
        })
      });
      if(!response.ok)throw new Error("IA indisponível");
      const data=await response.json();
      const content=data.output_text ||(data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\n");
      if(typeof content==="string"&&content.trim())return {answer:content.trim().slice(0,2500),source:"ia"};
    }finally{clearTimeout(timeout);}
  }catch(error){console.warn("ZUZ IA indisponível:",error.message);}
  return {answer,source:"analise_calculada"};
}
function registerSimulationRoutes(router,{asyncRoute,getCompany}){
  router.get("/simulations",asyncRoute(async(req,res)=>{
    const company=await getCompany(req.user.id);
    if(!company)fail(404,"Configure sua empresa primeiro.");
    const rows=await query("SELECT id,name,product_id,snapshot,created_at FROM zuz_simulations WHERE company_id=$1 ORDER BY created_at DESC,id DESC LIMIT 60",[company.id]);
    res.json({simulations:rows.rows.map(r=>({id:r.id,name:r.name,productId:r.product_id,createdAt:r.created_at,snapshot:JSON.parse(r.snapshot)}))});
  }));
  router.post("/simulations",asyncRoute(async(req,res)=>{
    const company=await getCompany(req.user.id);
    if(!company)fail(404,"Configure sua empresa primeiro.");
    const name=safeText(req.body?.name,100);
    const productId=String(req.body?.productId||"");
    if(!name)fail(400,"Dê um nome para a simulação.");
    const product=await findProduct(company,productId);
    const data=req.body?.snapshot;
    if(!data||!Array.isArray(data.scenarios)||data.scenarios.length!==3)fail(400,"Envie três cenários válidos.");
    const scenarios=data.scenarios.map(s=>simulation.validate(s));
    const refs=references(data.references);
    for(const s of scenarios)simulation.calculate(product,company.settings,s,refs.length?refs:undefined);
    const snapshot={version:1,productName:safeText(product.name),productCost:simulation.directCost(product),
      scenarios,selected:scenarios.some(s=>s.id===data.selected)?data.selected:"equilibrado",
      references:refs,originalSettings:company.settings};
    const serialized=JSON.stringify(snapshot);
    if(serialized.length>32000)fail(400,"A simulação excede o limite de armazenamento.");
    const count=await query("SELECT COUNT(*) AS total FROM zuz_simulations WHERE company_id=$1",[company.id]);
    if(Number(count.rows[0].total)>=60)fail(400,"Limite de 60 simulações. Exclua uma antiga para continuar.");
    const id=crypto.randomUUID();
    await query("INSERT INTO zuz_simulations(id,company_id,product_id,name,snapshot) VALUES($1,$2,$3,$4,$5)",
      [id,company.id,productId,name,serialized]);
    res.status(201).json({id,name,ok:true});
  }));
  router.delete("/simulations/:id",asyncRoute(async(req,res)=>{
    const company=await getCompany(req.user.id);
    if(!company)fail(404,"Configure sua empresa primeiro.");
    await query("DELETE FROM zuz_simulations WHERE id=$1 AND company_id=$2",[req.params.id,company.id]);
    res.json({ok:true});
  }));
  router.post("/simulations/assistant",asyncRoute(async(req,res)=>{
    const company=await getCompany(req.user.id);
    if(!company)fail(404,"Configure sua empresa primeiro.");
    const message=safeText(req.body?.message,600);
    if(!message)fail(400,"Escreva uma pergunta para a ZUZ.");
    const ctx=req.body?.context||{};
    const product=await findProduct(company,ctx.productId);
    let scenario,report;
    try{
      scenario=simulation.validate(ctx.scenario);
      report=simulation.calculate(product,company.settings,scenario,references(ctx.references).length?references(ctx.references):undefined);
    }catch(error){if(error instanceof RangeError)fail(400,error.message);throw error;}
    let proposal=propose(message,scenario),proposed=null;
    if(proposal){try{proposed=simulation.calculate(product,company.settings,proposal);}catch{proposal=null;}}
    const response=await explain(message,product,report,proposal,proposed);
    res.json({...response,proposal,metrics:{result:report.profit,revenue:report.revenue,breakEven:report.breakEvenUnits}});
  }));
}
module.exports={registerSimulationRoutes};
