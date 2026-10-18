"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {taxContext}=require("../server/tax-context");
test("sem aliquota informada não inventa tributo a pagar",()=>{
 const d=taxContext({salePrice:100,regime:"simples",activity:"revenda"});
 assert.equal(d.manualSimulation,null);
 assert.ok(d.warnings.some(x=>x.includes("RBT12")));
});
test("simulação opcional usa somente taxa explicitamente informada",()=>{
 const d=taxContext({salePrice:200,estimatedBusinessRate:12.5,activity:"producao",regime:"simples",uf:"SP",ncm:"12345678"});
 assert.equal(d.manualSimulation.estimatedAmount,25);
 assert.equal(d.manualSimulation.remainder,175);
});
test("NCM e UF invalidos não passam",()=>{
 assert.throws(()=>taxContext({ncm:"vassoura",uf:"SP"}),RangeError);
 assert.throws(()=>taxContext({uf:"XX"}),RangeError);
});
