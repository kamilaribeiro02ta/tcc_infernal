"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {parseKeepaHistory,keepaProduct,parseIPCA,adjustIPCA,flattenNCM}=require("../server/market-extended-providers");
const {validateRTC}=require("../server/rtc-offline");
const {csvRows,parsePrice,parseDate,validate}=require("../scripts/import-sector-public-prices");
test("Keepa: valores em centavos e minutos, ignorando indisponibilidade",()=>{
 const t=Math.floor(Date.UTC(2018,0,1)/60000)-21564000;
 const rows=parseKeepaHistory([t,2399,t+15,-1,t+30,2599]);
 assert.equal(rows.length,2);assert.equal(rows[0].price,23.99);
 assert.ok(rows[0].date.startsWith("2018"));
 const p=keepaProduct({asin:"B012345678",title:"Vassoura",csv:[[t,1200,t+30,1600],[]]});
 assert.equal(p.latest,16);assert.equal(p.currency,"BRL");
 assert.equal(p.history.length,2);
});
test("Classif: formato Codigo/Descricao da tabela NCM oficial",()=>{
 const result=flattenNCM([{Codigo:"9603.10.00",Descricao:"Vassouras de ramos"},
  {Codigo:"1234",Descricao:"Categoria genérica"}]);
 assert.equal(result.length,1);assert.equal(result[0].code,"96031000");
});
test("IPCA: apenas datas e taxas válidas; não extrapolar lacunas",()=>{
 const rows=parseIPCA([{data:"01/02/2026",valor:"0,70"},{data:"01/03/2026",valor:"-0.32"},
 {data:"99/99/2026",valor:"0.4"}]);
 assert.equal(rows.length,2);
 const d=adjustIPCA(100,rows,"2026-01","2026-03");
 assert.ok(d.adjusted>100);assert.equal(d.months,2);
 assert.equal(adjustIPCA(100,rows,"2025-12","2026-03"),null);
});
test("Importação oficial: rejeita preço zero, preserva unidade, data e origem",()=>{
 assert.equal(parsePrice("R$ 23,90"),23.9);assert.equal(parsePrice("0,00"),null);
 assert.equal(parseDate("01/01/2018"),"2018-01-01");
 const parsed=csvRows('DESCRICAO;PRECO;UNIDADE;DATA;ID;UF\n"Vassoura; piaçava";19,90;UN;01/01/2018;0001;SP');
 assert.equal(parsed.length,2);assert.equal(parsed[1][0],"Vassoura; piaçava");
 const headers=parsed[0],map={name:"DESCRICAO",price:"PRECO",unit:"UNIDADE",date:"DATA",ref:"ID",uf:"UF"};
 const valid=validate(parsed[1],headers,map,"sinapi","https://www.caixa.gov.br/teste");
 assert.equal(valid.price,19.9);assert.equal(valid.uf,"SP");
});
test("RTC: não simula sem classificação e operação fiscal completas",()=>{
 assert.match(validateRTC({uf:"SP",itens:[]}),/Data/);
 const p={dataHoraEmissao:"2026-10-18T12:00:00Z",uf:"SP",municipio:3550308,
  itens:[{cst:"000",cClassTrib:"000001",baseCalculo:100,quantidade:1,ncm:"96031000"}]};
 assert.equal(validateRTC(p),null);
 assert.match(validateRTC({...p,itens:[{...p.itens[0],ncm:""}]}),/NCM/);
});
