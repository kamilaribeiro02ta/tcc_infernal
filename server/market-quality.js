"use strict";
// Estatísticas determinísticas; preços públicos não se misturam entre tipos, unidades ou regiões.
const asString=x=>String(x??"").trim();
const ageDays=(date,now=Date.now())=>{
 const time=new Date(date).getTime();
 return Number.isFinite(time)&&time<=now+86400000?Math.max(0,(now-time)/86400000):null;
};
const recentLimit=kind=>kind==="public_purchase"?180:30;
function classify(row,now=Date.now()){
 const kind=row.price_type,age=ageDays(row.observed_at,now);
 const source=asString(row.source);
 const link=asString(row.url);
 const validSource=source==="comprasgov"||source==="openprices";
 const dated=age!==null;
 const clearIdentity=!!asString(row.seller);
 const unit=!!asString(row.unit);
 const linkValid=/^https:\/\//.test(link);
 const strongMatch=source==="openprices"&&row.matching==="codigo_de_barras";
 const publicRef=kind==="public_purchase";
 const fresh=dated&&age<=recentLimit(kind);
 const stale=!fresh;
 const reasons=[];
 if(!dated)reasons.push("Data ausente ou inválida");
 else if(stale)reasons.push("Cotação fora da janela de atualização");
 if(!clearIdentity)reasons.push("Estabelecimento não identificado");
 if(!unit)reasons.push("Unidade não especificada");
 if(!linkValid)reasons.push("Sem link verificável");
 if(publicRef)reasons.push("Compra governamental não representa preço de varejo");
 if(source==="openprices")reasons.push("Dado colaborativo; confirme a evidência na fonte");
 const usable=validSource&&dated&&unit&&Number(row.price)>0&&Number.isFinite(Number(row.price));
 // Fonte colaborativa é, por padrão, média até validar comprovante; fonte oficial pode ser alta.
 const strong=usable&&fresh&&linkValid&&clearIdentity&&publicRef;
 const medium=usable&&fresh&&linkValid;
 return {...row,ageDays:age===null?null:Math.floor(age),stale,
  freshness:fresh?"recente":dated?"desatualizada":"sem_data",
  confidence:strong?"alta":medium?"media":"baixa",
  reasons,price:Number(row.price)};
}
const median=xs=>{
 if(!xs.length)return null;
 const sorted=[...xs].sort((a,b)=>a-b),index=Math.floor(sorted.length/2);
 return sorted.length%2?sorted[index]:(sorted[index-1]+sorted[index])/2;
};
function groupKey(q){
 return [q.price_type||"nao_definido",asString(q.unit).toLowerCase()||"sem_unidade",
 asString(q.condition).toLowerCase()||"nao_definida",
 asString(q.region).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase()||"regiao_nao_informada"].join("|");
}
function summarize(rows){
 const map=new Map();
 for(const quote of rows){
  if(quote.stale||!Number.isFinite(Number(quote.price))||Number(quote.price)<=0)continue;
  const key=groupKey(quote);
  if(!map.has(key))map.set(key,[]);
  map.get(key).push(quote);
 }
 return [...map].map(([key,list])=>{
  const numbers=list.map(q=>Number(q.price)),sum=numbers.reduce((a,b)=>a+b,0);
  const stores=new Set(list.map(q=>asString(q.seller).toLocaleLowerCase("pt-BR")).filter(Boolean));
  return {key,type:list[0].price_type,unit:list[0].unit,region:list[0].region||null,
   condition:list[0].condition,count:list.length,distinctStores:stores.size,
   min:Math.min(...numbers),average:sum/list.length,median:median(numbers),
   max:Math.max(...numbers),latest:list.map(q=>q.observed_at).sort().at(-1)};
 }).sort((a,b)=>b.count-a.count);
}
function reliableRetail(rows,{region=null}={}){
 const seen=new Set();
 return rows.filter(q=>{
  if(q.stale||q.price_type!=="retail"||q.condition!=="new"||q.unit!=="un"
    ||q.matching!=="codigo_de_barras"||!q.seller||q.confidence==="baixa")return false;
  if(region&&String(q.region||"").toLowerCase()!==String(region).toLowerCase())return false;
  const key=[q.seller.toLowerCase(),(q.region||"").toLowerCase()].join("|");
  if(seen.has(key))return false;
  seen.add(key);return true;
 });
}

/**
 * A referência comercial precisa corresponder ao GTIN exato e à unidade.
 * Estatísticas só consideram lojas distintas na mesma região, nunca CATMAT ou compras públicas.
 */
function normalizedSeller(value){
 return asString(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g," ").trim();
}
function normalizedRegion(value){
 return asString(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLocaleLowerCase("pt-BR").replace(/\s+/g," ").trim();
}
function verifiedRetailQuote(row,item,{now=Date.now()}={}){
 const gtin=asString(item?.barcode),sourceRef=asString(row?.source_ref);
 if(!/^\d{8,14}$/.test(gtin)||asString(row?.gtin)!==gtin)return null;
 if(row?.source!=="openprices"||row.price_type!=="retail"||row.currency!=="BRL"||
  row.condition!=="new"||asString(row.unit).toLowerCase()!=="un"||
  !/^\d+$/.test(sourceRef))return null;
 if(["rejected","invalid","unverified"].includes(asString(row.verification_status).toLowerCase()))return null;
 const value=Number(row.price),age=ageDays(row.observed_at,now);
 const seller=asString(row.seller),url=asString(row.url),region=asString(row.region);
 if(!Number.isFinite(value)||value<=0||value>1e8||age===null||age>30||!seller||!region||
  url!=="https://prices.openfoodfacts.org/api/v1/prices/"+sourceRef)return null;
 return {id:asString(row.id),source:"openprices",sourceRef,seller,region,price:value,currency:"BRL",
  unit:"un",observedAt:new Date(row.observed_at).toISOString(),
  consultedAt:row.last_checked_at||row.fetched_at||null,url,gtin,
  condition:"new",priceType:"retail"};
}
function commercialMarket(item,records,{now=Date.now()}={}){
 const refs=new Set(),stores=new Map();
 for(const row of records||[]){
  const quote=verifiedRetailQuote(row,item,{now});if(!quote)continue;
  const key=quote.source+":"+quote.sourceRef;
  if(refs.has(key))continue;refs.add(key);
  const storeKey=normalizedSeller(quote.seller)+"|"+normalizedRegion(quote.region);
  const prev=stores.get(storeKey);
  if(!prev||Date.parse(quote.observedAt)>Date.parse(prev.observedAt))stores.set(storeKey,quote);
 }
 const offers=[...stores.values()].sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt));
 const regions=new Map();
 for(const quote of offers){
  const key=normalizedRegion(quote.region);
  if(!regions.has(key))regions.set(key,[]);
  regions.get(key).push(quote);
 }
 const eligible=[...regions.values()].filter(items=>items.length>=3);
 eligible.sort((a,b)=>b.length-a.length||String(a[0].region).localeCompare(String(b[0].region),"pt-BR"));
 const cohort=eligible[0]||[];
 const prices=cohort.map(x=>x.price),sum=prices.reduce((a,b)=>a+b,0);
 const summary=cohort.length>=3?{
  min:Math.min(...prices),average:Math.round(sum/prices.length*100)/100,
  median:median(prices),max:Math.max(...prices),offers:cohort.length,
  distinctStores:cohort.length,region:cohort[0].region,unit:"un",priceType:"retail",
  rule:"Mesmo GTIN, unidade, condição e região; até 30 dias; uma cotação recente por loja."
 }:null;
 return {offers,summary,hasComparablePrices:!!summary,
  note:summary?"Referência de lojas independentes para o mesmo produto.":
    "Sem amostra suficiente de preços comerciais comparáveis para calcular uma média."};
}
module.exports={classify,median,summarize,reliableRetail,ageDays,verifiedRetailQuote,commercialMarket};
