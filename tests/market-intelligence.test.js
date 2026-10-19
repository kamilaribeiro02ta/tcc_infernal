"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {yearly}=require("../server/market-intelligence");
test("linha histórica recusa compra pública e não inventa 2018",()=>{
 const arr=yearly([
  {price:"10",observed_at:"2026-01-04",price_type:"retail",currency:"BRL",condition:"new"},
  {price:"20",observed_at:"2026-03-04",price_type:"retail",currency:"BRL",condition:"new"},
  {price:"13",observed_at:"2018-03-04",price_type:"public_purchase",currency:"BRL",condition:"new"}
 ]);
 assert.deepEqual(arr.map(x=>x.year),[2026]);assert.equal(arr[0].median,15);
});
