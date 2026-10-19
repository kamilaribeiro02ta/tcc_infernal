"use strict";
// Auxiliares de correção monetária e classificação fiscal, sem fontes de ofertas.
const cache=new Map();
const clean=(v,n=120)=>String(v??"").trim().slice(0,n);
function normalize(v){return clean(v,260).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();}
async function limitedJSON(url,{timeout=8000,limit=4000000}={}){
 const response=await fetch(url,{headers:{"Accept":"application/json","User-Agent":"ZUZ-TCC/1.0"},signal:AbortSignal.timeout(timeout)});
 if(!response.ok)throw new Error("Provedor retornou HTTP "+response.status);
 const body=await response.text();if(body.length>limit)throw new Error("Resposta acima do tamanho autorizado");
 return JSON.parse(body);
}
function parseIPCA(rows){
 return (Array.isArray(rows)?rows:[]).flatMap(row=>{
  const date=/^(\d\d)\/(\d\d)\/(\d{4})$/.exec(String(row.data||""));
  const rate=Number(String(row.valor||"").replace(",","."));
  if(!date||!Number.isFinite(rate)||rate<=-100||rate>100)return [];
  const stamp=date[3]+"-"+date[2]+"-"+date[1],parsed=new Date(stamp+"T00:00:00Z");
  if(!Number.isFinite(parsed.valueOf())||parsed.toISOString().slice(0,10)!==stamp)return [];
  return [{date:stamp,rate}];
 }).sort((a,b)=>a.date.localeCompare(b.date));
}
function adjustIPCA(value,rows,from,to){
 const amount=Number(value),start=String(from||"").slice(0,7),end=String(to||"").slice(0,7);
 if(!(amount>0)||!/^\d{4}-\d\d$/.test(start)||!/^\d{4}-\d\d$/.test(end)||start>=end)return null;
 const chosen=rows.filter(x=>x.date.slice(0,7)>start&&x.date.slice(0,7)<=end);
 const diff=(Number(end.slice(0,4))*12+Number(end.slice(5)))-(Number(start.slice(0,4))*12+Number(start.slice(5)));
 if(chosen.length!==diff)return null; // jamais extrapolar mês ausente
 const factor=chosen.reduce((a,x)=>a*(1+x.rate/100),1);
 return {nominal:amount,adjusted:Math.round(amount*factor*100)/100,factor,months:chosen.length,
  note:"Atualização monetária hipotética pelo IPCA; não é uma cotação histórica efetiva do produto."};
}
async function ipca(fromYear=2018){
 const year=Math.max(1990,Math.min(new Date().getUTCFullYear(),Number(fromYear)||2018));
 const key="ipca:"+year,entry=cache.get(key);
 if(entry&&Date.now()-entry.at<12*3600000)return entry.data;
 const url="https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?"+new URLSearchParams({
  formato:"json",dataInicial:"01/01/"+year,dataFinal:"31/12/"+new Date().getUTCFullYear()});
 const rows=parseIPCA(await limitedJSON(url,{timeout:8000,limit:300000}));
 const data={series:rows,source:"Banco Central (SGS 433 / IPCA mensal, IBGE)",
  url:"https://dadosabertos.bcb.gov.br/dataset/433",updatedThrough:rows.at(-1)?.date||null};
 cache.set(key,{at:Date.now(),data});return data;
}
const CLASSIF_URL="https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json?perfil=PUBLICO";
function flattenNCM(payload){
 const matches=[];const visited=new Set();const stack=[payload];
 while(stack.length&&matches.length<15000){
  const x=stack.pop();
  if(!x||typeof x!=="object"||visited.has(x))continue;visited.add(x);
  if(Array.isArray(x)){for(let i=x.length-1;i>=0;i--)stack.push(x[i]);continue;}
  const code=String(x.Codigo||x.codigo||x.codigoNcm||x.codNcm||"").replace(/\D/g,"");
  if(code.length===8){
   const description=clean(String(x.Descricao||x.descricao||x.descricaoConcatenada||x.description||"").replace(/<[^>]+>/g," "),230);
   if(description)matches.push({code,description});
  }
  for(const [k,v] of Object.entries(x))if(v&&typeof v==="object"&&k!=="metadata")stack.push(v);
 }
 return matches;
}
async function classif(query){
 const q=normalize(query);
 if(q.length<2)return {source:"Classif/Receita Federal",items:[],warning:"Digite ao menos dois caracteres."};
 const cached=cache.get("classif");
 if(cached&&Date.now()-cached.at<24*3600000){
  return {source:"Classif/Receita Federal",items:cached.data.filter(x=>normalize(x.code+" "+x.description).includes(q)).slice(0,15),
    url:CLASSIF_URL,note:"Códigos candidatos da tabela vigente, não enquadramento fiscal automático."};
 }
 // JSON completo pode ser grande. Não buscar reiteradamente se a fonte falhar.
 try{
  const raw=await limitedJSON(CLASSIF_URL,{timeout:12000,limit:16000000});
  const data=flattenNCM(raw);
  if(!data.length)throw new Error("Formato oficial alterado.");
  cache.set("classif",{at:Date.now(),data});
  return {source:"Classif/Receita Federal",items:data.filter(x=>normalize(x.code+" "+x.description).includes(q)).slice(0,15),
   url:CLASSIF_URL,note:"Tabela NCM vigente da Receita Federal. A classificação deve ser confirmada."};
 }catch{return {source:"Classif/Receita Federal",items:[],url:CLASSIF_URL,
   warning:"Tabela oficial indisponível nesta consulta. Use o Sistema Classif diretamente ou a busca auxiliar da BrasilAPI."};}
}
const official={
 rtc:{label:"Calculadora RTC — Receita Federal",type:"simulacao_tributaria_oficial",
  url:"https://consumo.tributos.gov.br/servico/calcular-tributos-consumo/calculadora",
  note:"Sem API pública online para cálculo externo. O motor oficial é integrável apenas via módulo offline auto-hospedado, sujeito à versão e à validação."},
 classif:{label:"Classif — NCM oficial",type:"classificacao_mercadoria",url:CLASSIF_URL,note:"Classificação NCM vigente não define sozinha o imposto a recolher."}
};
function registerExtendedMarketRoutes(router,{asyncRoute}){
 router.get("/market/ipca",asyncRoute(async(req,res)=>{
  try{res.json(await ipca(req.query.fromYear));}
  catch{res.json({series:[],warning:"IPCA indisponível nesta consulta; nenhuma correção inflacionária foi presumida."});}
 }));
 router.get("/market/classif",asyncRoute(async(req,res)=>res.json(await classif(req.query.q))));
 router.get("/market/official-sources",(_req,res)=>res.json({sources:official}));
}
module.exports={registerExtendedMarketRoutes,parseIPCA,adjustIPCA,flattenNCM,official};
