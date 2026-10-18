"use strict";
// Dados de anúncios são transitórios: não inserimos ofertas de terceiros no banco sem licença.
// Banco só é aberto ao registrar as rotas. Testes de normalização são independentes.
const cache=new Map();
const clean=x=>String(x||"").trim().slice(0,120);
const norm=x=>clean(x).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const money=x=>{const n=Number(x);return Number.isFinite(n)&&n>0&&n<100000000?n:null;};
const allowedUrl=x=>{try{const u=new URL(x);return ["https:","http:"].includes(u.protocol)?u.toString():null;}catch{return null;}};
function similar(queryText,title){
 const q=norm(queryText),name=norm(title);
 if(!q||!name)return false;
 if(name.includes(q))return true;
 const tokens=q.split(" ").filter(w=>w.length>1);
 return tokens.length>0&&tokens.every(w=>name.split(" ").includes(w));
}
function parseShopping(json,term){
 const seen=new Set();
 return (Array.isArray(json.shopping_results)?json.shopping_results:[]).flatMap(row=>{
  const title=clean(row.title),price=money(row.extracted_price),seller=clean(row.source);
  const url=allowedUrl(row.product_link||row.link);
  if(!title||!price||!seller||!similar(term,title)||!url)return [];
  const key=norm(title)+"|"+norm(seller);
  if(seen.has(key))return [];seen.add(key);
  return [{title,price,seller,url,currency:"BRL",observedAt:new Date().toISOString(),
   source:"Google Shopping via SerpApi",comparison:"possivel_similar",
   warning:"Anúncio semelhante: confira marca, modelo, variante, quantidade e condições antes de comparar."}];
 }).slice(0,20);
}
async function shopping(term){
 const key=norm(term),hit=cache.get(key);
 if(hit&&Date.now()-hit.at<15*60000)return hit.value;
 if(!process.env.SERPAPI_API_KEY)return {enabled:false,offers:[],warnings:["Preços de lojas: conecte SERPAPI_API_KEY no servidor para habilitar esta fonte."]};
 const params=new URLSearchParams({engine:"google_shopping",q:term,gl:"br",hl:"pt-br",google_domain:"google.com.br",api_key:process.env.SERPAPI_API_KEY});
 const response=await fetch("https://serpapi.com/search.json?"+params.toString(),{signal:AbortSignal.timeout(8500),headers:{"Accept":"application/json"}});
 if(!response.ok)throw new Error("O provedor comercial não respondeu.");
 const raw=await response.text();if(raw.length>1700000)throw new Error("Resposta acima do limite.");
 const result=JSON.parse(raw);
 if(result.error)throw new Error("Fonte comercial indisponível.");
 const value={enabled:true,offers:parseShopping(result,term),warnings:[]};
 if(cache.size>100)cache.clear();
 cache.set(key,{at:Date.now(),value});
 return value;
}
function yearly(rows){
 const groups=new Map();
 for(const r of rows){
  if(r.price_type!=="retail"||r.currency!=="BRL"||r.condition!=="new")continue;
  const price=money(r.price),date=new Date(r.observed_at);
  if(!price||!Number.isFinite(date.getTime())||date.getTime()>Date.now()+86400000)continue;
  const year=date.getUTCFullYear();
  if(!groups.has(year))groups.set(year,[]);
  groups.get(year).push(price);
 }
 return [...groups].map(([year,prices])=>{
  prices.sort((a,b)=>a-b);
  const i=Math.floor(prices.length/2);
  const median=prices.length%2?prices[i]:(prices[i-1]+prices[i])/2;
  return {year,count:prices.length,min:prices[0],median,max:prices.at(-1)};
 }).sort((a,b)=>a.year-b.year);
}
function registerMarketIntelligenceRoutes(router,{asyncRoute}){
 const {query}=require("./database");
 router.get("/market/offers",asyncRoute(async(req,res)=>{
  const term=clean(req.query.q);
  if(term.length<3||term.length>80)return res.status(400).json({error:"Informe ao menos três caracteres."});
  let result;
  try{result=await shopping(term);}
  catch(error){result={enabled:!!process.env.SERPAPI_API_KEY,offers:[],warnings:["Não foi possível consultar as ofertas comerciais agora."]};}
  res.setHeader("Cache-Control","private, no-store");
  res.json({...result,query:term,note:"Resultados de anúncios similares, não preços homologados do mesmo produto. Valores e estoque devem ser confirmados na loja."});
 }));
 router.get("/market/history",asyncRoute(async(req,res)=>{
  const id=clean(req.query.id);
  if(!/^[a-f0-9]{32}$/.test(id))return res.status(400).json({error:"Produto inválido."});
  const catalog=await query("SELECT id,name,barcode,source,is_historical FROM zuz_market_catalog WHERE id=$1",[id]);
  if(!catalog.rows.length)return res.status(404).json({error:"Produto não encontrado."});
  const r=await query("SELECT h.price,h.observed_at,p.price_type,p.currency,p.condition,p.source,p.gtin,p.unit FROM zuz_market_price_history h JOIN zuz_market_prices p ON p.id=h.quote_id WHERE p.catalog_id=$1 ORDER BY h.observed_at DESC LIMIT 500",[id]);
  // Apenas histórico do MESMO ID cadastrado, nunca somar preços de produtos apenas semelhantes.
  const verified=r.rows.filter(row=>!catalog.rows[0].barcode||row.gtin===catalog.rows[0].barcode);
  const points=yearly(verified);
  res.setHeader("Cache-Control","private, no-store");
  res.json({years:points,requestedYears:[2018,2026],availableYears:points.map(p=>p.year),
   hasComparable2018and2026:!!catalog.rows[0].barcode&&points.some(p=>p.year===2018)&&points.some(p=>p.year===2026),
   note:"Ano do catálogo não é ano de preço. Comparação 2018 × 2026 só existe com cotações reais de cada ano, identificador equivalente e mesma unidade."});
 }));
}
module.exports={registerMarketIntelligenceRoutes,similar,parseShopping,yearly};
