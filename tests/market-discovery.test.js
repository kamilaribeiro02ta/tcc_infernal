"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const extra=require("../server/market-discovery");
test("Produtos atuais não recebem preços fictícios do catálogo",()=>{
 const x=extra.dto({code:"7891234567895",product_name_pt:"Macarrão 500g",brands:"Marca A",quantity:"500 g"},
  {code:"openfoodfacts",host:"world.openfoodfacts.org",label:"Alimentos"});
 assert.equal(x.barcode,"7891234567895");assert.equal(x.unit,"500 g");assert.equal(Object.hasOwn(x,"price"),false);
});
test("GTIN inválido é rejeitado",()=>assert.equal(extra.dto({code:"abc",product_name:"Produto"},{code:"openfoodfacts",host:"world.openfoodfacts.org",label:"Alimentos"}),null));
test("Sinônimos por acentuação são tratados na correspondência",()=>{
 assert.equal(extra.norm("MACARRÃO 500g"),"macarrao 500g");
 assert.equal(extra.rank({name:"Macarrão Integral 500g",brand:"Marca",barcode:"7890000000000"},"macarrao"),88);
});
test("Busca especializada prioriza higiene e alimentos",()=>{
 assert.equal(extra.preferred("absorvente")[0].code,"openbeautyfacts");
 assert.equal(extra.preferred("macarrão")[0].code,"openfoodfacts");
});
test("Itens diferentes não recebem correspondência apenas por categoria",()=>assert.equal(extra.rank({name:"Sabonete 90g",brand:"Marca",barcode:"7890000000000"},"absorvente"),0));
test("Foto externa passa apenas quando proveniente do provedor",()=>{
 const x=extra.dto({code:"7891234567895",product_name:"Teste",image_url:"https://outro.example/foto"},
  {code:"openfoodfacts",host:"world.openfoodfacts.org",label:"Alimentos"});
 assert.equal(x.attrs.image_url,null);
});
