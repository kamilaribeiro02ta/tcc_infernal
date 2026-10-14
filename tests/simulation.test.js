"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const simulation=require("../shared/simulation-core");

const product=()=>({id:"produto-teste",name:"Bolo",baseCost:20,additionalCosts:[{value:5}],
  salePrice:50,units:100,targetMargin:20});
const settings=()=>({monthlyUnits:100,taxesPct:10,sellingFeesPct:0,
  fixedCosts:[{label:"Aluguel",value:1000}],competitors:[]});

test("tres cenarios independentes e imutabilidade do produto",()=>{
  const p=product(),cfg=settings(),pBefore=JSON.stringify(p),cBefore=JSON.stringify(cfg);
  const list=simulation.defaults(p);
  assert.deepEqual(list.map(x=>x.id),["conservador","equilibrado","premium"]);
  const outputs=list.map(s=>simulation.calculate(p,cfg,s));
  assert.equal(outputs.length,3);
  assert.ok(outputs[0].salePrice<outputs[1].salePrice);
  assert.ok(outputs[2].salePrice>outputs[1].salePrice);
  assert.equal(JSON.stringify(p),pBefore);
  assert.equal(JSON.stringify(cfg),cBefore);
});
test("impacto do custo variavel e do custo fixo em cenarios",()=>{
  const s=simulation.defaults(product())[1];
  const base=simulation.calculate(product(),settings(),s);
  const shock=simulation.calculate(product(),settings(),{...s,changePct:20,changeMode:"variable"});
  assert.equal(base.variableCost,25);
  assert.equal(shock.variableCost,30);
  assert.equal(shock.profit,base.profit-500);
  const fixed=simulation.calculate(product(),settings(),{...s,changePct:50,changeMode:"fixed"});
  assert.equal(fixed.fixedTotal,1500);
  assert.equal(fixed.profit,base.profit-500);
});
test("metas de receita e resultado usam o periodo",()=>{
  const result=simulation.calculate(product(),settings(),simulation.defaults(product())[1]);
  assert.equal(result.profit,1000);
  assert.equal(simulation.goal(result,5000,"revenue"),100);
  assert.equal(simulation.goal(result,5000,"profit"),300);
});
test("volume de equilibrio respeita tributos sobre receita",()=>{
  const r=simulation.calculate(product(),settings(),simulation.defaults(product())[1]);
  assert.equal(r.contributionMargin,20);
  assert.equal(r.breakEvenUnits,50);
});
test("grafico corresponde a receita menos custos",()=>{
  const r=simulation.calculate(product(),settings(),simulation.defaults(product())[1]);
  const data=simulation.scenarioChartPoints(r,8);
  assert.equal(data.length,9);
  for(const p of data)assert.ok(Math.abs(p.profit-(p.revenue-p.costs))<1e-7);
});
test("parametros invalidos sao rejeitados",()=>{
  const s=simulation.defaults(product())[1];
  assert.throws(()=>simulation.calculate(product(),settings(),{...s,units:1.2}),RangeError);
  assert.throws(()=>simulation.calculate(product(),settings(),{...s,changePct:-101}),RangeError);
  assert.throws(()=>simulation.calculate(product(),{...settings(),taxesPct:85},{...s,margin:20}),RangeError);
  assert.equal(simulation.goal({...simulation.calculate(product(),settings(),s),contributionMargin:-2},5000,"profit"),null);
});

test("campos numéricos vazios nunca viram zero silenciosamente",()=>{
  const base=simulation.defaults(product())[1];
  for(const field of ["price","units","margin","changePct"]){
    assert.throws(()=>simulation.calculate(product(),settings(),{...base,[field]:""}),RangeError);
  }
  const result=simulation.calculate(product(),settings(),base);
  assert.throws(()=>simulation.goal(result,"","revenue"),RangeError);
  assert.equal(simulation.goal(result,0,"revenue"),0);
});
test("referências de produto são isoladas no mecanismo de precificação",()=>{
  const s=simulation.defaults(product())[1];
  const cfg={...settings(),competitors:[{name:"Outro produto",price:900,productId:"produto-diferente"}]};
  const result=simulation.calculate(product(),cfg,s);
  assert.equal(result.market.count,0);
  assert.equal(result.recommendedRange.high,null);
});
