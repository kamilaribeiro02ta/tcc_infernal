"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {verifiedRetailQuote,commercialMarket}=require("../server/market-quality");
const NOW=Date.parse("2026-10-18T15:00:00Z");
const product={barcode:"7891234567895",name:"Biscoito marca A 200g"};
const quote=(seller,price,changes={})=>({
 id:("a".repeat(31)+String((seller.charCodeAt(0)%10))).slice(0,32),
 catalog_id:"b".repeat(32),source:"openprices",source_ref:String(100+seller.charCodeAt(0)),
 seller,price,currency:"BRL",unit:"un",region:"São Paulo",
 condition:"new",price_type:"retail",gtin:product.barcode,
 observed_at:"2026-10-17T12:00:00Z",fetched_at:"2026-10-18T12:00:00Z",
 url:"https://prices.openfoodfacts.org/api/v1/prices/"+(100+seller.charCodeAt(0)),
 ...changes
});
test("média de varejo usa três lojas comparáveis do mesmo produto",()=>{
 const r=commercialMarket(product,[quote("A",10),quote("B",20),quote("C",30)],{now:NOW});
 assert.equal(r.summary.average,20);
 assert.equal(r.summary.min,10);
 assert.equal(r.summary.max,30);
 assert.equal(r.summary.distinctStores,3);
 assert.equal(r.offers.length,3);
});
test("compras públicas, produtos diferentes e preços antigos não entram na média",()=>{
 const rows=[quote("A",11),quote("B",19,{gtin:"7891234567896"}),
  quote("C",45,{source:"comprasgov",price_type:"public_purchase"}),
  quote("D",9,{observed_at:"2026-07-01T12:00:00Z"}),quote("E",5,{unit:"kg"})];
 const r=commercialMarket(product,rows,{now:NOW});
 assert.equal(r.summary,null);
 assert.equal(r.offers.length,1);
});
test("loja duplicada, data futura e link sem evidência não podem inflar amostra",()=>{
 const r=commercialMarket(product,[quote("A",10),
  quote("A",12,{source_ref:"999",url:"https://prices.openfoodfacts.org/api/v1/prices/999",
    observed_at:"2026-10-18T12:00:00Z"}),
  quote("B",15),quote("C",7,{url:"https://example.com/preco"}),
  quote("D",55,{observed_at:"2026-12-01T00:00:00Z"})],{now:NOW});
 assert.equal(r.offers.length,2);
 assert.equal(r.summary,null);
 assert.equal(r.offers.find(x=>x.seller==="A").price,12);
});
test("regiões diferentes não formam média geral",()=>{
 const r=commercialMarket(product,[quote("A",10),quote("B",15,{region:"Rio de Janeiro"}),
  quote("C",20)],{now:NOW});
 assert.equal(r.summary,null);
 assert.equal(r.offers.length,3);
});
test("referência verificável mantém origem, data e identidade",()=>{
 const row=verifiedRetailQuote(quote("A",25),product,{now:NOW});
 assert.equal(row.source,"openprices");
 assert.equal(row.gtin,product.barcode);
 assert.ok(row.url.endsWith("/165"));
 assert.ok(row.consultedAt);
 assert.equal(verifiedRetailQuote(quote("A",25,{source_ref:"165",url:"https://example.com/165"}),product,{now:NOW}),null);
});
