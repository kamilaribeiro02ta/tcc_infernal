(function(root,factory){
  const api=factory(typeof module==="object"&&module.exports?require("decimal.js"):root.Decimal);
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.ZUZMoney=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Decimal){
  "use strict";
  if(!Decimal)throw new Error("Carregue decimal.js antes de money.js.");
  const D=Decimal.clone({precision:40,rounding:Decimal.ROUND_HALF_UP});
  const sum=values=>values.reduce((total,value)=>total.plus(value),new D(0));
  return Object.freeze({
    Decimal:D,
    sum:values=>sum(values).toNumber(),
    add:(a,b)=>new D(a).plus(b).toNumber(),
    subtract:(a,b)=>new D(a).minus(b).toNumber(),
    multiply:(a,b)=>new D(a).times(b).toNumber(),
    divide:(a,b)=>new D(a).dividedBy(b).toNumber(),
    ceilDivide:(a,b)=>new D(a).dividedBy(b).ceil().toNumber(),
    round:(value,places=2)=>new D(value).toDecimalPlaces(places,D.ROUND_HALF_UP).toNumber()
  });
});
