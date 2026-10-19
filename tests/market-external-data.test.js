"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {state,normalize,search}=require("../server/market-bigdatacorp");
const {health}=require("../server/backend-status");
const {searchReferences}=require("../server/market-reference-search");
const now=Date.parse("2026-10-19T12:00:00Z");
// Fixtures sintéticas exclusivas de teste: não são importadas nem publicadas.
const env={ZUZ_BDC_ENABLED:"true",ZUZ_BDC_TERMS_ACCEPTED:"true",BDC_ACCESS_TOKEN:"test-token",BDC_TOKEN_ID:"test-id",
 BDC_PRODUCT_NAME_PATH:"ExtraInfoData.Name",BDC_SOURCE_URL_PATH:"Url"};
function payload(){return {Result:[{PrimaryId:"test-sku",ExtraInfoData:{Name:"Produto de teste"},CurrentPriceData:{
 AggregatedPriceData:{AverageSalePrice:999},PriceDataBySource:[{SiteSourceName:"Loja Teste",Currency:"BRL",
 LastUpdateDate:"2026-10-18T12:00:00Z",SalePrice:12.5,Url:"https://store.example.test/product"}]}}]};}
test("conector não consome API paga sem habilitação, contrato e configuração completos",async()=>{
 for(const partial of [{},{...env,ZUZ_BDC_ENABLED:"false"},{...env,ZUZ_BDC_TERMS_ACCEPTED:"false"},{...env,BDC_ACCESS_TOKEN:""},{...env,BDC_PRODUCT_NAME_PATH:""}]){
  const result=await search("qualquer produto",{env:partial,fetchImpl:()=>{throw Error("Não deveria consultar");}});
  assert.deepEqual(result.references,[]);assert.equal(state(partial).ready,false);
 }
 assert.equal(state(env).status,"configured_unverified");assert.equal(state(env).liveTestVerified,false);
});
test("usa preço individual, preserva fonte e data e não inventa custo ou equivalência",()=>{
 const result=normalize(payload(),env,{now});assert.equal(result.references.length,1);
 const offer=result.references[0];assert.equal(offer.price,12.5);assert.equal(offer.verified,false);
 assert.equal(offer.item.name,"Produto de teste");assert.equal(offer.currency,"BRL");assert.equal(offer.stale,false);
 assert.equal(offer.metadata.costsAvailable,false);assert.equal(offer.tax,undefined);assert.equal(offer.margin,undefined);
});
test("descarta observações sem nome, preço, BRL, data verificável, vendedor ou link",()=>{
 for(const mutate of [p=>delete p.Result[0].ExtraInfoData.Name,p=>p.Result[0].CurrentPriceData.PriceDataBySource[0].SalePrice=0,
  p=>p.Result[0].CurrentPriceData.PriceDataBySource[0].Currency="USD",p=>delete p.Result[0].CurrentPriceData.PriceDataBySource[0].LastUpdateDate,
  p=>p.Result[0].CurrentPriceData.PriceDataBySource[0].LastUpdateDate="2027-01-01",p=>delete p.Result[0].CurrentPriceData.PriceDataBySource[0].SiteSourceName,
  p=>p.Result[0].CurrentPriceData.PriceDataBySource[0].Url="http://localhost/item"]){
  const p=payload();mutate(p);assert.equal(normalize(p,env,{now}).references.length,0);
 }
});
test("consulta autenticada usa limite explícito, não injeta filtros nem expõe erros/tokens",async()=>{
 let requests=0;
 const fetchImpl=async(url,options)=>{
  requests++;assert.equal(url,"https://plataforma.bigdatacorp.com.br/produtos");assert.equal(options.headers.AccessToken,"test-token");
  assert.equal(JSON.parse(options.body).q,"searchterms{termo livre}");assert.equal(JSON.parse(options.body).Limit,1);
  return new Response(JSON.stringify(payload()));
 };
 assert.equal((await search("termo livre",{env,fetchImpl,now})).references.length,1);
 await search("produto},ean{123",{env,fetchImpl,now});assert.equal(requests,1);
 const result=await search("qualquer produto",{env,fetchImpl:async()=>{throw Error("test-token");}});
 assert.equal(result.references.length,0);assert.ok(!JSON.stringify(result).includes("test-token"));
});
test("falha comercial preserva pesquisa local e resultados independentes",async()=>{
 const result=await searchReferences("qualquer coisa",{query:async()=>({rows:[]}),provider:"sqlite",dto:x=>x,
  external:async()=>{throw Error("indisponível");}});
 assert.deepEqual(result.references,[]);assert.equal(result.warnings.length,1);
});
test("saúde PostgreSQL falha quando conexão responde mas esquema está incompleto",async()=>{
 await assert.rejects(health(async sql=>({rows:sql.includes("to_regclass")?[{ready:false}]:[{alive:1}]}),"postgresql"),/DB_SCHEMA_PENDING/);
 await assert.rejects(health(async()=>{throw Error("offline");},"postgresql"));
 assert.equal((await health(async()=>({rows:[{alive:1}]}),"sqlite")).schemaReady,true);
});
