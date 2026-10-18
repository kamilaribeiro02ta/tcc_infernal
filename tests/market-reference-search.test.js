"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {normalizeReference,searchReferences}=require("../server/market-reference-search");
const now=Date.parse("2026-10-18T12:00:00Z");
const product={id:"a".repeat(32),name:"Vassoura",barcode:"7891234567895",attributes:{}};
const quote={id:"b".repeat(32),price:12.9,currency:"BRL",source:"openprices",source_ref:"123",url:"https://prices.openfoodfacts.org/api/v1/prices/123",seller:"Loja",region:"SP",unit:"un",condition:"new",price_type:"retail",gtin:product.barcode,observed_at:"2026-10-17T12:00:00Z"};
test("normalização conserva fonte, data e preço e não inventa custos",()=>{
 const out=normalizeReference(product,quote,now);assert.equal(out.price,12.9);assert.equal(out.verified,true);assert.equal(out.queriedAt,null);assert.equal(out.margin,undefined);
});
test("rejeita moeda estrangeira, origem inválida, datas ausentes e preços rejeitados",()=>{
 for(const change of [{currency:"USD"},{price:0},{url:"https://evil.example/123"},{observed_at:null},{verification_status:"rejected"},{source:"inventada"}])assert.equal(normalizeReference(product,{...quote,...change},now),null);
});
test("preço antigo e compra pública são separados da cotação validada",()=>{
 const old=normalizeReference(product,{...quote,observed_at:"2024-01-01"},now);assert.equal(old.stale,true);assert.equal(old.verified,false);
 const gov=normalizeReference(product,{...quote,source:"comprasgov",url:"https://dadosabertos.compras.gov.br/modulo-pesquisa-preco/1_consultarMaterial",price_type:"public_purchase"},now);assert.equal(gov.priceType,"public_purchase");assert.equal(gov.verified,false);
});
test("busca reúne observações distintas, limita atualizações e usa parâmetros SQL",async()=>{
 const calls=[],refreshed=[];
 const rows=Array.from({length:6},(_,i)=>({...product,id:String(i).repeat(32),name:"Vassoura "+i}));
 const query=async(sql,params)=>{calls.push({sql,params});return {rows:sql.startsWith("SELECT c.*")?rows:[{...quote,observed_at:new Date().toISOString()}]};};
 const out=await searchReferences("vassoura ' OR 1=1",{query,provider:"postgresql",refresh:async x=>{refreshed.push(x.id);return {warnings:[]};},dto:x=>x});
 assert.equal(out.references.length,6);assert.equal(refreshed.length,4);assert.ok(!calls[0].sql.includes("OR 1=1"));assert.equal(calls[0].params.length,4);
});
test("falha em uma fonte não elimina as observações salvas",async()=>{
 const out=await searchReferences("vassoura",{query:async sql=>({rows:sql.startsWith("SELECT c.*")?[product]:[{...quote,observed_at:new Date().toISOString()}]}),provider:"postgresql",refresh:async()=>{throw Error("offline");},dto:x=>x});
 assert.equal(out.references.length,1);assert.ok(out.warnings.length);
});
