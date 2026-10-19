(function(root,factory){
  const api=factory(typeof module==="object"&&module.exports?require("./pricing-core"):root.ZUZPricingCore,typeof module==="object"&&module.exports?require("./money"):root.ZUZMoney);
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.ZUZSimulationCore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(pricing,money){
  "use strict";
  const numeric=(v,fallback=0)=>v===""||v===null||v===undefined?fallback:Number(v);
  const finite=(v,name,min,max)=>{
    if(!Number.isFinite(v)||v<min||v>max)throw new RangeError(name+" fora do intervalo permitido.");
    return v;
  };
  function directCost(product){
    const base=Number(product?.baseCost??product?.direct_cost??0);
    const extra=Array.isArray(product?.additionalCosts)?product.additionalCosts.map(item=>Math.max(0,Number(item.value)||0)):[];
    return money.sum([Math.max(0,Number.isFinite(base)?base:0),...extra]);
  }
  function defaults(product={}){
    const p=Math.max(0,Number(product.salePrice)||0);
    const units=Math.max(1,Math.round(Number(product.units)||100));
    const margin=Number(product.targetMargin??30);
    return [
      {id:"conservador",label:"Conservador",price:money.round(money.multiply(p,0.93)),units:Math.max(1,Math.round(units*1.1)),margin,changePct:0,changeMode:"variable"},
      {id:"equilibrado",label:"Equilibrado",price:p,units,margin,changePct:0,changeMode:"variable"},
      {id:"premium",label:"Premium",price:money.round(money.multiply(p,1.12)),units:Math.max(1,Math.round(units*.8)),margin,changePct:0,changeMode:"variable"}
    ];
  }
  function validate(scenario){
    if(!scenario||typeof scenario!=="object")throw new RangeError("Cenário inválido.");
    const price=finite(numeric(scenario.price,NaN),"Preço",0,100000000);
    const units=finite(numeric(scenario.units,NaN),"Quantidade",1,1000000);
    const margin=finite(numeric(scenario.margin,NaN),"Margem",0,90);
    const changePct=finite(numeric(scenario.changePct,NaN),"Variação de custos",-100,500);
    if(!Number.isInteger(units))throw new RangeError("Quantidade deve ser inteira.");
    const changeMode=scenario.changeMode==="fixed"?"fixed":"variable";
    return {id:String(scenario.id||"equilibrado"),label:String(scenario.label||"Cenário"),price,units,margin,changePct,changeMode};
  }
  function calculate(product,settings,scenario,competitors){
    const s=validate(scenario);
    const original=pricing.normalize(settings||{});
    const copied={...original,fixedCosts:original.fixedCosts.map(c=>({...c})),competitors:(competitors||original.competitors).map(c=>({...c}))};
    const multiplier=money.add(1,money.divide(s.changePct,100));
    const direct=money.multiply(directCost(product),s.changeMode==="variable"?multiplier:1);
    if(s.changeMode==="fixed")copied.fixedCosts=copied.fixedCosts.map(c=>({...c,value:money.multiply(c.value,multiplier)}));
    const output=pricing.calculate({unitDirectCost:direct,salePrice:s.price,targetMargin:s.margin,units:s.units,settings:copied,productId:String(product?.id??""),productName:String(product?.name??""),category:String(product?.category??"")});
    return {...output,scenario:s,appliedSettings:copied,variableCost:direct,variableContribution:output.contributionMargin};
  }
  function goal(result,target,kind){
    const amount=finite(numeric(target,NaN),"Meta",0,1000000000);
    if(amount===0&&kind==="revenue")return 0;
    if(kind==="revenue")return result.salePrice>0?money.ceilDivide(amount,result.salePrice):null;
    if(kind!=="profit")throw new RangeError("Tipo de meta inválido.");
    if(result.contributionMargin<=0)return null;
    return Math.max(0,money.ceilDivide(money.add(amount,result.fixedTotal),result.contributionMargin));
  }
  function scenarioChartPoints(result,steps=10){
    const high=Math.min(2000000,Math.max(10,result.units*2,Number.isFinite(result.breakEvenUnits)?result.breakEvenUnits:0));
    const values=[];
    for(let i=0;i<=steps;i++){
      const units=Math.round(i*high/steps);
      const revenue=money.multiply(result.salePrice,units);
      const costs=new money.Decimal(result.salePrice).times(result.variableRatePct).div(100).plus(result.variableCost).times(units).plus(result.fixedTotal).toNumber();
      values.push({units,revenue,costs,profit:money.subtract(revenue,costs)});
    }
    return values;
  }
  return {directCost,defaults,validate,calculate,goal,scenarioChartPoints};
});

