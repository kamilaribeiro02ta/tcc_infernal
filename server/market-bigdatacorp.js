"use strict";
// Conector opcional: nenhuma consulta paga é feita sem ativação explícita.
const crypto=require("node:crypto");
const {z}=require("zod");
const ENDPOINT="https://plataforma.bigdatacorp.com.br/produtos";
const validPath=s=>typeof s==="string"&&/^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)*$/.test(s)&&
 !s.split(".").some(x=>["constructor","prototype","__proto__"].includes(x));
function field(object,path){return validPath(path)?path.split(".").reduce((v,key)=>Object.hasOwn(v||{},key)?v[key]:undefined,object):undefined;}
function state(env=process.env){
 const enabled=env.ZUZ_BDC_ENABLED==="true";
 const missing=[];
 if(env.ZUZ_BDC_TERMS_ACCEPTED!=="true")missing.push("contract");
 if(!env.BDC_ACCESS_TOKEN||!env.BDC_TOKEN_ID)missing.push("credentials");
 if(!validPath(env.BDC_PRODUCT_NAME_PATH)||!validPath(env.BDC_SOURCE_URL_PATH))missing.push("response_mapping");
 return {source:"bigdatacorp",status:!enabled?"disabled":missing.length?"pending_configuration":"configured_unverified",
  enabled,ready:enabled&&!missing.length,missing,liveTestVerified:false};
}
const text=z.string().trim().min(1).max(240);
const number=z.union([z.number(),z.string().regex(/^\d+(?:\.\d+)?$/)]).transform(Number).refine(v=>Number.isFinite(v)&&v>0&&v<1e8);
function httpsUrl(value){
 try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&u.hostname.includes(".")&&
 !/^(?:localhost|\d+\.\d+\.\d+\.\d+)$/.test(u.hostname)?u.href:null;}catch{return null;}
}
function normalize(payload,env,{now=Date.now()}={}){
 const references=[];let rejected=0;
 for(const row of Array.isArray(payload?.Result)?payload.Result:[]){
  const name=text.safeParse(field(row,env.BDC_PRODUCT_NAME_PATH));
  if(!name.success){rejected++;continue;}
  const primary=String(row.PrimaryId||"").trim().slice(0,120);
  if(!primary){rejected++;continue;}
  const sources=row.CurrentPriceData?.PriceDataBySource;
  for(const source of Array.isArray(sources)?sources:[]){
   // Nunca atribuir a uma loja a média agregada de todas as fontes.
   const list=Array.isArray(source.PriceDataBySeller)&&source.PriceDataBySeller.length?source.PriceDataBySeller:[source];
   for(const seller of list){
    const price=number.safeParse(seller.SalePrice??seller.FullPrice);
    const url=httpsUrl(field(seller,env.BDC_SOURCE_URL_PATH)||field(source,env.BDC_SOURCE_URL_PATH));
    const date=Date.parse(seller.LastUpdateDate||source.LastUpdateDate);
    const sellerName=String(seller.MarketplaceSellerName||source.SiteSourceName||"").trim();
    if(!price.success||source.Currency!=="BRL"||!url||!sellerName||!Number.isFinite(date)||date>now){rejected++;continue;}
    const id=crypto.createHash("sha256").update("bigdatacorp:"+primary+":"+url+":"+sellerName).digest("hex").slice(0,32);
    const item={id:crypto.createHash("sha256").update("bigdatacorp:"+primary).digest("hex").slice(0,32),name:name.data,fullName:name.data,
     source:"bigdatacorp",sourceId:primary,attributes:{},barcode:row.IdType==="EAN"&&/^\d{8,14}$/.test(primary)?primary:""};
    references.push({id,title:name.data,item,price:price.data,currency:"BRL",seller:sellerName,
     source:"BigDataCorp · "+String(source.SiteSourceName||sellerName),sourceCode:"bigdatacorp",sourceRef:primary,url,
     observedAt:new Date(date).toISOString(),queriedAt:new Date(now).toISOString(),priceType:"retail",
     stale:now-date>30*86400000,verified:false,comparison:"catalog_reference",unit:null,region:null,condition:null,
     metadata:{provider:"BigDataCorp",ephemeral:true,verification:"supplier_observation",costsAvailable:false}});
   }
  }
 }
 return {references:[...new Map(references.map(r=>[r.id,r])).values()],rejected};
}
async function limitedJson(response){
 if(!response.ok)throw Error("BDC_UNAVAILABLE");
 let size=0;const chunks=[];
 if(response.body?.getReader){
  const reader=response.body.getReader();
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
   if(size>1500000)throw Error("BDC_RESPONSE_TOO_LARGE");chunks.push(Buffer.from(value));}}
  finally{await reader.cancel().catch(()=>{});}
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
 }
 const body=await response.text();if(Buffer.byteLength(body)>1500000)throw Error("BDC_RESPONSE_TOO_LARGE");return JSON.parse(body);
}
async function search(term,{env=process.env,fetchImpl=globalThis.fetch,now=Date.now()}={}){
 const config=state(env);
 if(!config.ready)return {references:[],warnings:config.enabled?["A fonte comercial aguarda configuração e validação de acesso."]:[]};
 const input=String(term||"").trim();
 // As chaves da consulta usam delimitadores próprios; não permitir injeção de filtros.
 if(input.length<3||input.length>80||/[{}\[\],\r\n]/.test(input))return {references:[],warnings:[]};
 try{
  const payload=await limitedJson(await fetchImpl(ENDPOINT,{method:"POST",redirect:"error",signal:AbortSignal.timeout(6000),
   headers:{Accept:"application/json","Content-Type":"application/json",AccessToken:env.BDC_ACCESS_TOKEN,TokenId:env.BDC_TOKEN_ID},
   body:JSON.stringify({q:/^\d{8,14}$/.test(input)?"ean{"+input+"}":"searchterms{"+input+"}",
    Datasets:"extra_info_data,current_pricing_data",Limit:1})}));
  const statuses=[...(payload.Status?.extra_info_data||[]),...(payload.Status?.current_pricing_data||[])];
  if(statuses.some(s=>Number(s.Code)!==0))throw Error("BDC_DATASET_FAILED");
  const result=normalize(payload,env,{now});
  return {...result,warnings:result.rejected?["A fonte comercial retornou registros sem identificação, preço, data ou link completos; esses registros foram descartados."]:[]};
 }catch{return {references:[],warnings:["A consulta comercial está indisponível. As referências já disponíveis foram mantidas."]};}
}
module.exports={state,normalize,search,field};
