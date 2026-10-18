"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {similar,parseShopping,yearly}=require("../server/market-intelligence");
test("comparação exige tokens de modelo e evita variantes irrelevantes",()=>{
 assert.equal(similar("iPhone 18 Plus","Apple iPhone 18 Plus 128 GB"),true);
 assert.equal(similar("iPhone 18 Plus","Apple iPhone 17 Plus 128 GB"),false);
 assert.equal(similar("vassoura","Vassoura de piaçava"),true);
});
test("ofertas descartam preço ausente e resultados não correspondentes",()=>{
 const out=parseShopping({shopping_results:[
  {title:"Apple iPhone 18 Plus 128 GB",source:"Loja Um",extracted_price:5900,product_link:"https://example.com/18plus"},
  {title:"Apple iPhone 17 Plus",source:"Loja Dois",extracted_price:3000,product_link:"https://example.com/17plus"},
  {title:"Apple iPhone 18 Plus",source:"Loja Três",extracted_price:0,product_link:"https://example.com/zero"}
 ]},"iPhone 18 Plus");
 assert.equal(out.length,1);assert.equal(out[0].price,5900);
 assert.equal(out[0].comparison,"possivel_similar");
 assert.equal(out[0].observedAt,null);
 assert.ok(out[0].queriedAt);
 assert.equal(parseShopping({shopping_results:[{title:"Apple iPhone 18 Plus",source:"Loja",extracted_price:5000,link:"http://example.com/1"}]},"iPhone 18 Plus").length,0);
});
test("linha histórica recusa compra pública e não inventa 2018",()=>{
 const arr=yearly([
  {price:"10",observed_at:"2026-01-04",price_type:"retail",currency:"BRL",condition:"new"},
  {price:"20",observed_at:"2026-03-04",price_type:"retail",currency:"BRL",condition:"new"},
  {price:"13",observed_at:"2018-03-04",price_type:"public_purchase",currency:"BRL",condition:"new"}
 ]);
 assert.deepEqual(arr.map(x=>x.year),[2026]);assert.equal(arr[0].median,15);
});
