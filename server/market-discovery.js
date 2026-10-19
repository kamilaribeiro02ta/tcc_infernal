"use strict";
const crypto=require("node:crypto");
const {query}=require("./database");
const SOURCES=[
 {code:"openfoodfacts",host:"world.openfoodfacts.org",label:"Alimentos e bebidas"},
 {code:"openbeautyfacts",host:"world.openbeautyfacts.org",label:"Beleza, higiene e cosméticos"}
];
const clean=(x,n=200)=>String(x??"").trim().slice(0,n);
const norm=s=>clean(s,500).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g," ").trim();
const id=(source,code)=>crypto.createHash("sha256").update(source+":"+code).digest("hex").slice(0,32);
const codeOk=v=>/^\d{8,14}$/.test(String(v??""));
function preferred(q){
 const n=norm(q);
 const hints=/absorvente|higiene|shampoo|sabonete|perfume|cosmet|creme|desodorante|condicionador|maquiagem|batom|protetor solar/;
 if(hints.test(n))return [SOURCES[1],...SOURCES.filter(s=>s!==SOURCES[1])];
 return SOURCES;
}
function dto(row,source){
 const gtin=clean(row?.code,16);
 const name=clean(row?.product_name_pt||row?.product_name||row?.generic_name,240);
 if(!codeOk(gtin)||!name)return null;
 const picture=clean(row.image_front_url||row.image_url,400);
 const image=picture.startsWith("https://images.openfoodfacts.org/")?picture:null;
 const brand=clean(row.brands,120),quantity=clean(row.quantity,50);
 const score=norm(name+" "+brand);
 return {source:source.code,externalId:gtin,kind:"product",name,brand,barcode:gtin,
  category:clean(row.categories,160)||source.label,unit:quantity,
  attrs:{quantity,image_url:image,product_url:"https://"+source.host+"/product/"+gtin,
   description:clean(row.generic_name_pt||row.generic_name,240),
   ingredients:clean(row.ingredients_text_pt||row.ingredients_text,420),
   last_source_update:row.last_modified_t&&Number.isFinite(Number(row.last_modified_t))?
     new Date(Number(row.last_modified_t)*1000).toISOString():null,
   catalog_category:source.label},score};
}
function rank(row,q){
 const target=norm(q),name=norm(row.name),brand=norm(row.brand),full=name+" "+brand;
 if(row.barcode===q)return 100;
 if(name===target)return 95;
 if(name.startsWith(target+" ")||name.startsWith(target))return 88;
 if(full.includes(target))return 78;
 const tokens=target.split(" ").filter(x=>x.length>2);
 if(tokens.length&&tokens.every(x=>full.includes(x)))return 62;
 return 0;
}
async function remote(source,q){
 const fields="code,product_name,product_name_pt,generic_name,generic_name_pt,brands,quantity,categories,image_front_url,image_url,ingredients_text_pt,last_modified_t";
 const url=codeOk(q)?"https://"+source.host+"/api/v2/product/"+q+"?fields="+fields:
  "https://"+source.host+"/cgi/search.pl?"+new URLSearchParams({search_terms:q,search_simple:"1",action:"process",json:"1",page_size:"30",fields});
 const request=await fetch(url,{headers:{"Accept":"application/json","User-Agent":"ZUZ-TCC/1.0 (github.com/kamilaribeiro02ta/tcc_infernal)"},signal:AbortSignal.timeout(7500)});
 if(!request.ok)throw new Error("HTTP "+request.status);
 const body=await request.text();
 if(body.length>1750000)throw new Error("Resposta acima do limite");
 const payload=JSON.parse(body);
 const products=Array.isArray(payload.products)?payload.products:payload.product?[payload.product]:[];
 return products.map(x=>dto(x,source)).filter(Boolean).map(x=>({...x,score:rank(x,q)})).filter(x=>x.score>=60);
}
async function upsert(item){
 const sql="INSERT INTO zuz_market_catalog(id,source,external_id,kind,name,commercial_name,brand,barcode,category,unit,attributes,is_historical,commercial_search_ready,updated_at) "+
 "SELECT $1,$2,$3,'product',$4,$4,$5,$3,$6,$7,$8::jsonb,FALSE,TRUE,NOW() WHERE zuz_market_use_curated_import() "+
 "ON CONFLICT(source,external_id) DO UPDATE SET name=excluded.name,commercial_name=excluded.commercial_name,brand=excluded.brand,"+
 "barcode=excluded.barcode,category=excluded.category,unit=excluded.unit,attributes=excluded.attributes,is_historical=FALSE,commercial_search_ready=TRUE,updated_at=NOW() RETURNING id";
 const result=await query(sql,[id(item.source,item.externalId),item.source,item.externalId,item.name,item.brand,item.category,item.unit,JSON.stringify(item.attrs)]);
 return result.rowCount;
}
async function lookup(q){
 const target=clean(q,80),key="discovery-retained:"+id("term",norm(target));
 const prev=await query("SELECT payload,fetched_at FROM zuz_market_cache WHERE cache_key=$1",[key]);
 if(prev.rows.length&&Date.now()-new Date(prev.rows[0].fetched_at).getTime()<3*3600000){
  const v=prev.rows[0].payload;
  return {cached:true,counts:typeof v==="string"?JSON.parse(v):v,warnings:[]};
 }
 const responses=await Promise.allSettled(preferred(target).map(source=>remote(source,target)));
 const found=[];
 const warnings=[];
 const candidates=preferred(target);
 responses.forEach((x,i)=>{
  if(x.status==="fulfilled")found.push(...x.value);
  else warnings.push(candidates[i].code+": consulta indisponível ou limitada.");
 });
 found.sort((a,b)=>b.score-a.score);
 const seen=new Set();let imported=0;
 for(const item of found.slice(0,45)){
  const key=item.source+":"+item.barcode;
  if(seen.has(key))continue;
  seen.add(key);
  try{imported+=await upsert(item);}catch(e){warnings.push("Alguns itens não puderam ser armazenados.");break;}
 }
 const info={found:found.length,imported,sources:candidates.map(x=>x.code)};
 if(responses.some(x=>x.status==="fulfilled"))
  await query("INSERT INTO zuz_market_cache(cache_key,payload,fetched_at) VALUES($1,$2::jsonb,NOW()) ON CONFLICT(cache_key) DO UPDATE SET payload=excluded.payload,fetched_at=NOW()",[key,JSON.stringify(info)]);
 return {cached:false,counts:info,warnings};
}
module.exports={lookup,rank,norm,preferred,dto};

