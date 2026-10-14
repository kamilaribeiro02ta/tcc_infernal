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

test("mesma formula de margem com impostos, taxas e rateio",()=>{
  const result=p.calculate({settings:{
    monthlyUnits:100,fixedCosts:[{label:"Aluguel",value:1000}],
    taxesPct:10,sellingFeesPct:5
  },unitDirectCost:100,salePrice:200,units:100,targetMargin:30});
  assert.equal(result.technicalPrice,200);
  assert.equal(result.fixedAllocation,10);
  assert.equal(result.unitBaseCost,110);
  assert.equal(result.contributionMargin,70);
  assert.equal(result.netMarginPct,30);
  assert.equal(result.revenue,20000);
  assert.equal(result.periodVariableCosts,13000);
  assert.equal(result.periodCosts,14000);
  assert.equal(result.profit,6000);
});

test("concorrencia so usa categoria comparavel e percentil 75",()=>{
  const result=p.calculate({settings:{positioning:"mercado",competitors:[
    {name:"A",price:40,category:"Bolos"},{name:"B",price:50,category:"Bolos"},
    {name:"C",price:60,category:"Bolos"},{name:"Outra",price:999,category:"Roupas"}
  ]},unitDirectCost:10,salePrice:30,targetMargin:30,category:"bolos"});
  assert.equal(result.market.count,3);
  assert.equal(result.market.totalCount,4);
  assert.equal(result.market.median,50);
  assert.equal(result.recommendedRange.high,55);
  assert.equal(result.suggestedPrice,50);
});

test("sem amostra suficiente nao inventa preco maximo",()=>{
  const result=p.calculate({settings:{competitors:[{name:"A",price:150,category:"Bolos"}]},
    category:"Bolos",unitDirectCost:80});
  assert.equal(result.recommendedRange.high,null);
  assert.equal(result.recommendedRange.confidence,"insuficiente");
  assert.ok(result.warnings.length);
});

test("mercado abaixo do custo minimo indica conflito",()=>{
  const result=p.calculate({settings:{competitors:[
    {name:"A",price:10,category:"Bolos"},{name:"B",price:11,category:"Bolos"},
    {name:"C",price:12,category:"Bolos"}
  ]},unitDirectCost:100,category:"Bolos"});
  assert.equal(result.recommendedRange.high,null);
  assert.equal(result.suggestedPrice,result.technicalPrice);
  assert.match(result.warnings.join(" "),/mercado comparável/i);
});

test("preco sem margem de contribuicao nao apresenta ponto de equilibrio falso",()=>{
  const result=p.calculate({settings:{fixedCosts:[{label:"Aluguel",value:500}]},
    unitDirectCost:50,salePrice:40,units:4});
  assert.equal(result.breakEvenUnits,null);
  assert.equal(result.profit,-540);
});

test("mes sem vendas mantém custos fixos, sem multiplicar por produtos",()=>{
  const result=p.calculate({settings:{monthlyUnits:100,fixedCosts:[{label:"Aluguel",value:500}]},
    unitDirectCost:50,salePrice:100,units:0});
  assert.equal(result.profit,-500);
  assert.equal(result.revenue,0);
  assert.equal(result.periodCosts,500);
});

test("campos monetarios negativos nao geram custo negativo",()=>{
  const result=p.calculate({unitDirectCost:-30,salePrice:-100,
    settings:{fixedCosts:[{label:"Aluguel",value:-500}]}});
  assert.equal(result.directCost,0);
  assert.equal(result.fixedTotal,0);
  assert.equal(result.salePrice,0);
});

test("categorias diferentes não fundamentam limite superior",()=>{
  const result=p.calculate({settings:{competitors:[
    {name:"A",price:200,category:"Alimentos"},{name:"B",price:250,category:"Alimentos"},
    {name:"C",price:300,category:"Alimentos"}
  ]},unitDirectCost:30,category:"Serviços"});
  assert.equal(result.market.count,0);
  assert.equal(result.recommendedRange.high,null);
});
