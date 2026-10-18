"use strict";
const quality=require("./market-quality");
const sourceName=code=>({openprices:"Open Prices",comprasgov:"Compras.gov.br",catmat_archive_2018:"CATMAT"}[code]||code);
function normalizeReference(item,row,now=Date.now()){
 if(["rejected","invalid"].includes(String(row.verification_status||"").toLowerCase()))return null;
 const price=Number(row.price),time=Date.parse(row.observed_at);
 let url;try{url=new URL(row.url);}catch{return null;}
 if(!Number.isFinite(price)||price<=0||row.currency!=="BRL"||!Number.isFinite(time)||time>now+86400000||url.protocol!=="https:"||!row.seller)return null;
 if(!["openprices","comprasgov"].includes(row.source))return null;
 if(row.source==="openprices"&&(url.hostname!=="prices.openfoodfacts.org"||row.price_type!=="retail"))return null;
 if(row.source==="comprasgov"&&(url.hostname!=="dadosabertos.compras.gov.br"||row.price_type!=="public_purchase"))return null;
 const verified=quality.verifiedRetailQuote(row,item,{now});
 const age=(now-time)/86400000;
 const metadata=typeof row.price_metadata==="string"?JSON.parse(row.price_metadata):row.price_metadata||{};
 return {id:row.id,title:item.fullName||item.name,item,price,seller:row.seller,
  offerDescription:row.offer_title||null,brand:row.brand||item.brand||null,model:row.model||item.model||null,metadata,
  source:sourceName(row.source),sourceCode:row.source,sourceRef:row.source_ref,url:url.href,
  currency:"BRL",unit:row.unit||null,region:row.region||null,condition:row.condition||null,
  observedAt:new Date(time).toISOString(),queriedAt:row.last_checked_at||row.fetched_at||null,
  priceType:row.price_type,stale:age>(row.price_type==="public_purchase"?180:30),
  comparison:verified?"gtin":"catalog_reference",verified:!!verified,
  imageUrl:item.attributes?.image_url||null};
}
// No catalogue row is represented as an offer without an actual price and source.
async function searchReferences(term,{query,provider,refresh,dto}){
 const tokens=String(term).trim().split(/\s+/).slice(0,8);
 const params=tokens.map(x=>"%"+x.toLowerCase().replace(/[\\%_]/g,"")+"%");
 const expression=provider==="postgresql"?
  "unaccent(lower(COALESCE(c.commercial_name,c.name,'')||' '||COALESCE(c.brand,'')||' '||COALESCE(c.model,'')||' '||COALESCE(c.barcode,'')))":
  "lower(COALESCE(c.name,'')||' '||COALESCE(c.brand,'')||' '||COALESCE(c.model,'')||' '||COALESCE(c.barcode,''))";
 const where=params.map((_,i)=>expression+" LIKE "+(provider==="postgresql"?"unaccent($"+(i+1)+")":"$"+(i+1))).join(" AND ");
 const found=await query("SELECT c.* FROM zuz_market_catalog c WHERE "+where+
  " ORDER BY EXISTS(SELECT 1 FROM zuz_market_prices p WHERE p.catalog_id=c.id) DESC,c.name,c.id LIMIT 12",params);
 const warnings=[],references=[],catalog=[];
 // Only four live source refreshes per search; the remaining matches use saved observations.
 const responses=await Promise.allSettled(found.rows.map(async(row,index)=>{
  let item=dto({...row,attributes:typeof row.attributes==="string"?JSON.parse(row.attributes):row.attributes});
  if(provider==="postgresql"&&index<4){
   try{const response=await refresh(row);warnings.push(...response.warnings);}
   catch{warnings.push("Uma fonte de preços está indisponível; exibindo as observações salvas.");}
  }
  const prices=await query("SELECT * FROM zuz_market_prices WHERE catalog_id=$1 ORDER BY observed_at DESC LIMIT 20",[row.id]);
  return {item,offers:prices.rows.map(q=>normalizeReference(item,q)).filter(Boolean)};
 }));
 for(const response of responses){
  if(response.status==="rejected"){warnings.push("Algumas referências não puderam ser consultadas.");continue;}
  references.push(...response.value.offers);catalog.push(response.value.item);
 }
 return {references,catalog,warnings:[...new Set(warnings)],limited:found.rows.length===12,
  queriedAt:new Date().toISOString()};
}
module.exports={normalizeReference,searchReferences};
