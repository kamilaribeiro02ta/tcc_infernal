"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const q=require("../server/market-quality");
const NOW=Date.parse("2026-10-16T12:00:00Z");
const obs=(overrides={})=>({
 source:"openprices",matching:"codigo_de_barras",seller:"Loja A",price:25,
 currency:"BRL",unit:"un",region:"SP",condition:"new",price_type:"retail",
 url:"https://prices.openfoodfacts.org/api/v1/prices/123",
 observed_at:"2026-10-14T12:00:00Z",...overrides
});
test("cotacao recente possui data, loja, unidade e origem",()=>{
 const x=q.classify(obs(),NOW);
 assert.equal(x.stale,false);
 assert.equal(x.confidence,"media");
 assert.equal(x.freshness,"recente");
});
test("cotacao antiga não interfere na mediana",()=>{
 const fresh=q.classify(obs({price:25}),NOW);
 const old=q.classify(obs({price:1,observed_at:"2026-08-01T12:00:00Z"}),NOW);
 assert.equal(old.stale,true);
 const groups=q.summarize([fresh,old]);
 assert.equal(groups[0].count,1);
 assert.equal(groups[0].median,25);
});
test("compras publicas e varejo, e regioes distintas, não compartilham grupo",()=>{
 const goods=q.classify(obs(),NOW);
 const gov=q.classify(obs({source:"comprasgov",price:12,price_type:"public_purchase"}),NOW);
 const another=q.classify(obs({region:"RJ",price:30}),NOW);
 const groups=q.summarize([goods,gov,another]);
 assert.equal(groups.length,3);
 assert.equal(groups.find(x=>x.region==="RJ").median,30);
 assert.equal(groups.find(x=>x.type==="public_purchase").median,12);
});
test("mediana, media, minimo, maximo e numero de estabelecimentos",()=>{
 const groups=q.summarize([q.classify(obs({price:10,seller:"Loja A"}),NOW),q.classify(obs({price:20,seller:"Loja B"}),NOW),q.classify(obs({price:30,seller:"Loja C"}),NOW)]);
 assert.equal(groups[0].min,10);
 assert.equal(groups[0].average,20);
 assert.equal(groups[0].median,20);
 assert.equal(groups[0].max,30);
 assert.equal(groups[0].distinctStores,3);
});
test("não recomende quando produto diferente ou fonte de baixa qualidade",()=>{
 const exact=q.classify(obs(),NOW);
 const approximate=q.classify(obs({seller:"Loja B",matching:"sem_equivalencia"}),NOW);
 const gov=q.classify(obs({seller:"Loja C",source:"comprasgov",price_type:"public_purchase"}),NOW);
 const old=q.classify(obs({seller:"Loja D",observed_at:"2026-07-01T12:00:00Z"}),NOW);
 const found=q.reliableRetail([exact,approximate,gov,old]);
 assert.equal(found.length,1);
});
test("comparador não inventa estatísticas para lista vazia",()=>{
 assert.equal(q.median([]),null);
 assert.deepEqual(q.summarize([]),[]);
});
