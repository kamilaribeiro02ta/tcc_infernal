"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const p=require("../shared/pricing-core");
const catalog=require("../shared/business-templates");
test("catalogo contem quatro operacoes universais",()=>assert.deepEqual(Object.keys(catalog.operations),["producao","revenda","servico","misto"]));
test("custo fixo integral no cenario de periodo",()=>{
  const result=p.calculate({settings:{monthlyUnits:100,fixedCosts:[{label:"Aluguel",value:1000}]},unitDirectCost:100,salePrice:200,units:10});
  assert.equal(result.fixedAllocation,10);
  assert.equal(result.profit,0);
  assert.equal(result.breakEvenUnits,10);
});
test("cenario de volume mensal",()=>{
  const result=p.calculate({settings:{monthlyUnits:100,fixedCosts:[{label:"Aluguel",value:1000}]},unitDirectCost:100,salePrice:200,units:100});
  assert.equal(result.profit,9000);
});
test("margem e taxas inviaveis geram erro",()=>{
  assert.throws(()=>p.calculate({settings:{taxesPct:70,sellingFeesPct:10},targetMargin:30,unitDirectCost:50}),RangeError);
});
test("margem separada de taxa sobre venda",()=>{
  const result=p.calculate({settings:{taxesPct:10,sellingFeesPct:5},unitDirectCost:100,salePrice:200,units:1,targetMargin:30});
  assert.equal(result.contributionMargin,70);
  assert.equal(result.netMarginPct,35);
});
