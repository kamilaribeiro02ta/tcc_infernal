"use strict";
// Estatísticas de observações já armazenadas; sem conector comercial externo.
const clean=x=>String(x||"").trim().slice(0,120);
const money=x=>{const n=Number(x);return Number.isFinite(n)&&n>0&&n<100000000?n:null;};
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
 const {query,provider}=require("./database");
 router.get("/market/history",asyncRoute(async(req,res)=>{
  const id=clean(req.query.id);
  if(!/^[a-f0-9]{32}$/.test(id))return res.status(400).json({error:"Produto inválido."});
  const catalog=await query(provider==="postgresql"?"SELECT id,name,barcode,source,is_historical FROM zuz_market_catalog WHERE id=$1":"SELECT id,name,barcode,source FROM zuz_market_catalog WHERE id=$1",[id]);
  if(!catalog.rows.length)return res.status(404).json({error:"Produto não encontrado."});
  if(provider!=="postgresql")return res.json({years:[],requestedYears:[2018,2026],availableYears:[],hasComparable2018and2026:false,note:"Histórico de cotação por ano exige PostgreSQL. Não inferimos valores do catálogo local."});
  const r=await query("SELECT h.price,h.observed_at,p.price_type,p.currency,p.condition,p.source,p.gtin,p.unit FROM zuz_market_price_history h JOIN zuz_market_prices p ON p.id=h.quote_id WHERE p.catalog_id=$1 ORDER BY h.observed_at DESC LIMIT 500",[id]);
  // Apenas histórico do MESMO ID cadastrado, nunca somar preços de produtos apenas semelhantes.
  const verified=r.rows.filter(row=>!catalog.rows[0].barcode||row.gtin===catalog.rows[0].barcode);
  const units=new Set(verified.filter(x=>x.price_type==='retail').map(x=>String(x.unit||'').trim().toLowerCase()));
  const points=units.size===1&&!units.has('')?yearly(verified):[];
  res.setHeader("Cache-Control","private, no-store");
  res.json({years:points,requestedYears:[2018,2026],availableYears:points.map(p=>p.year),
   hasComparable2018and2026:!!catalog.rows[0].barcode&&points.some(p=>p.year===2018)&&points.some(p=>p.year===2026),
   note:"Ano do catálogo não é ano de preço. Comparação 2018 × 2026 só existe com cotações reais de cada ano, identificador equivalente e mesma unidade."});
 }));
}
module.exports={registerMarketIntelligenceRoutes,yearly};

