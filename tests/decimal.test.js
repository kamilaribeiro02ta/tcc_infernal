"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const money=require("../shared/money"),pricing=require("../shared/pricing-core"),simulation=require("../shared/simulation-core");
test("decimal preserva centavos, arredondamento explícito e ponto de equilíbrio",()=>{
  assert.equal(money.sum([0.1,0.2]),0.3);
  assert.equal(money.round(1.005),1.01);
  const r=pricing.calculate({unitDirectCost:0,salePrice:0.01,units:14,targetMargin:0,settings:{monthlyUnits:1,fixedCosts:[{value:0.14}]}});
  assert.equal(r.breakEvenUnits,14);assert.equal(r.profit,0);assert.equal(r.revenue,0.14);
  assert.equal(simulation.directCost({baseCost:0.1,additionalCosts:[{value:0.2}]}),0.3);
});
test("cálculos do navegador e servidor usam a mesma implementação decimal",()=>{
  const browser={};vm.createContext(browser);
  for(const file of ["vendor/decimal.js","money.js","pricing-core.js","simulation-core.js"])
    vm.runInContext(fs.readFileSync(path.join(__dirname,"../shared",file),"utf8"),browser,{filename:file});
  const data={unitDirectCost:12.35,salePrice:29.9,targetMargin:25,units:17,settings:{monthlyUnits:300,taxesPct:6.25,sellingFeesPct:2.19,fixedCosts:[{value:100.1},{value:0.2}]}};
  assert.deepEqual(JSON.parse(JSON.stringify(browser.ZUZPricingCore.calculate(data))),JSON.parse(JSON.stringify(pricing.calculate(data))));
  assert.equal(browser.ZUZMoney.round(1.005),1.01);
  for(const file of ["custos/custos.html","produtos/produtos.html","simulacoes/simulacoes.html","garfico/grafico.html"]){
    const html=fs.readFileSync(path.join(__dirname,"..",file),"utf8");
    assert.ok(html.indexOf("shared/vendor/decimal.js")>=0);
    assert.ok(html.indexOf("shared/vendor/decimal.js")<html.indexOf("shared/money.js"));
    assert.ok(html.indexOf("shared/money.js")<html.indexOf("shared/pricing-core.js"));
  }
});
