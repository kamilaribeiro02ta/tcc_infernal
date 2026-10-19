"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {parseIPCA,adjustIPCA,flattenNCM}=require("../server/market-extended-providers");
const {validateRTC}=require("../server/rtc-offline");
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
test("RTC: não simula sem classificação e operação fiscal completas",()=>{
 assert.match(validateRTC({uf:"SP",itens:[]}),/Data/);
 const p={dataHoraEmissao:"2026-10-18T12:00:00Z",uf:"SP",municipio:3550308,
  itens:[{cst:"000",cClassTrib:"000001",baseCalculo:100,quantidade:1,ncm:"96031000"}]};
 assert.equal(validateRTC(p),null);
 assert.match(validateRTC({...p,itens:[{...p.itens[0],ncm:""}]}),/NCM/);
});
