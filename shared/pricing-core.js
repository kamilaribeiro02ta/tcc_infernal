(function(root,factory) {
  const pricing=factory();
  if (typeof module==="object" && module.exports) module.exports=pricing;
  if (root) root.ZUZPricingCore=pricing;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const toNum=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
  const defaults={segment:"",operationType:"producao",positioning:"mercado",targetCustomer:"",monthlyUnits:100,taxesPct:0,sellingFeesPct:0,defaultMargin:30,fixedCosts:[],competitors:[]};
  function normalize(s={}) {
    return {...defaults,...s,monthlyUnits:Math.max(1,Math.round(toNum(s.monthlyUnits??100))),
      taxesPct:Math.max(0,toNum(s.taxesPct)),sellingFeesPct:Math.max(0,toNum(s.sellingFeesPct)),
      defaultMargin:Math.min(90,Math.max(0,toNum(s.defaultMargin??30))),
      fixedCosts:Array.isArray(s.fixedCosts)?s.fixedCosts.map(c=>({label:String(c.label||"Custo fixo"),value:Math.max(0,toNum(c.value))})).filter(c=>c.value>0):[],
      competitors:Array.isArray(s.competitors)?s.competitors.map(c=>({name:String(c.name||"Concorrente"),price:Math.max(0,toNum(c.price))})).filter(c=>c.price>0):[]};
  }
  function fixedCostsTotal(settings){return settings.fixedCosts.reduce((sum,x)=>sum+x.value,0);}
  function marketStats(settings) {
    const prices=settings.competitors.map(c=>c.price).filter(p=>p>0);
    return prices.length?{count:prices.length,min:Math.min(...prices),max:Math.max(...prices),average:prices.reduce((a,b)=>a+b,0)/prices.length}:{count:0,min:0,max:0,average:0};
  }
  function calculate(input={}) {
    const s=normalize(input.settings||{});
    const direct=Math.max(0,toNum(input.unitDirectCost));
    const sale=Math.max(0,toNum(input.salePrice));
    const margin=toNum(input.targetMargin??s.defaultMargin);
    const units=Math.max(1,Math.round(toNum(input.units??1)));
    const rate=s.taxesPct+s.sellingFeesPct;
    if (!Number.isFinite(margin) || margin<0 || margin>90 || rate>=100 || rate+margin>=100) {
      throw new RangeError("A soma da margem desejada com os tributos e taxas deve ser menor que 100%.");
    }
    const fixed=fixedCostsTotal(s),allocation=fixed/s.monthlyUnits;
    const baseCost=direct+allocation;
    const technical=baseCost/(1-(rate+margin)/100);
    const market=marketStats(s);
    let suggested=technical;
    if(market.count){
      suggested=s.positioning==="diferenciacao"?Math.max(technical,market.average*1.08)
        :s.positioning==="preco"?Math.max(technical,Math.min(market.average,technical*1.03))
        :Math.max(technical,market.average);
    }
    const charges=sale*rate/100,contribution=sale-direct-charges;
    const unitProfit=contribution-allocation;
    // Cenário de período: custo fixo completo não pode ser multiplicado pela quantidade simulada.
    const periodProfit=contribution*units-fixed;
    return {settings:s,directCost:direct,fixedTotal:fixed,fixedAllocation:allocation,
      unitBaseCost:baseCost,variableRatePct:rate,technicalPrice:technical,suggestedPrice:suggested,
      market,recommendedRange:{low:technical,high:market.count?Math.max(technical,market.max):technical*1.1},
      salePrice:sale,targetMargin:margin,units,contributionMargin:contribution,
      contributionMarginPct:sale?contribution/sale*100:0,unitProfit,
      netMarginPct:sale?unitProfit/sale*100:0,
      breakEvenUnits:contribution>0&&fixed>0?Math.ceil(fixed/contribution):0,
      investment:direct*units+fixed,revenue:sale*units,profit:periodProfit,
      profitScope:"periodo_com_custo_fixo_integral"};
  }
  return {calculate,normalize,marketStats,fixedCostsTotal};
});
