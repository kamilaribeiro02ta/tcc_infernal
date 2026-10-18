"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {median,groupsOf}=require("../server/market");

test("mediana trata amostras pares, ímpares e vazias sem criar valores",()=>{
 assert.equal(median([]),null);
 assert.equal(median([80]),80);
 assert.equal(median([110,50,90]),90);
 assert.equal(median([40,80,100,50]),65);
});
test("dados públicos, varejo e unidades diferentes não compartilham estatística",()=>{
 const rows=[
  {price_type:"retail",unit:"un",condition:"new",price:55,stale:false},
  {price_type:"retail",unit:"un",condition:"new",price:75,stale:false},
  {price_type:"retail",unit:"kg",condition:"new",price:12,stale:false},
  {price_type:"public_purchase",unit:"un",condition:"new",price:8,stale:false},
  {price_type:"retail",unit:"un",condition:"new",price:300,stale:true}
 ];
 const groups=groupsOf(rows);
 assert.equal(groups.length,3);
 const retail=groups.find(g=>g.type==="retail"&&g.unit==="un");
 assert.equal(retail.count,2);
 assert.equal(retail.min,55);
 assert.equal(retail.max,75);
 assert.equal(retail.median,65);
 const publicGroup=groups.find(g=>g.type==="public_purchase");
 assert.equal(publicGroup.median,8);
});

test("registro público preserva marca, quantidade e descrição sem criar margem ou imposto",()=>{
 const {parseGovQuote}=require("../server/market");
 const r=parseGovQuote({idCompra:"compra1",idItemCompra:"item1",codigoItemCatalogo:123,precoUnitario:18,dataCompra:"2026-10-16",marca:"Marca informada",quantidade:100,descricaoDetalhadaItem:"Vassoura com cabo",siglaUnidadeFornecimento:"UN",nomeFornecedor:"Fornecedor",percentualMaiorDesconto:0},"123","https://dadosabertos.compras.gov.br/");
 assert.equal(r.brand,"Marca informada");assert.equal(r.offerTitle,"Vassoura com cabo");assert.equal(r.metadata.purchaseQuantity,100);assert.equal(r.metadata.procurementDiscountPercent,0);assert.equal(r.tax,undefined);assert.equal(r.margin,undefined);
});
test("unidade e desconto ausentes não são inventados no registro público",()=>{
 const {parseGovQuote}=require("../server/market");const r=parseGovQuote({idCompra:"c",idItemCompra:"1",codigoItemCatalogo:123,precoUnitario:18,dataCompra:"2026-10-16",nomeFornecedor:"Fornecedor"},"123","https://dadosabertos.compras.gov.br/");assert.equal(r.unit,"");assert.equal(r.metadata.procurementDiscountPercent,null);assert.equal(r.metadata.purchaseQuantity,null);
});
