"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),os=require("node:os");
const {spawnSync}=require("node:child_process");
const {readDataset,importDataset}=require("../scripts/import-uci-retail");
test("UCI: extrai preços válidos, elimina repetição/cancelamento e omite dados de clientes",async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),"zuz-uci-test-")),file=path.join(directory,"fixture.xlsx");
 try{
  assert.equal(spawnSync("python3",[path.join(__dirname,"fixtures/create-uci-workbook.py"),file]).status,0);
  const data=readDataset(file);assert.equal(data.products.length,2);assert.equal(data.scanned,9);assert.equal(data.rejected,6);
  assert.equal(data.products[0].name,"Nome mais recente");assert.equal(data.products[0].price,"2.50");assert.equal(data.products[0].currency,"GBP");
  assert.ok(!JSON.stringify(data).includes("CustomerID"));assert.ok(!JSON.stringify(data).includes("TEST"));
  const queries=[];const count=await importDataset(data,{query:async(sql,params)=>{queries.push({sql,params});return {rowCount:2};}});
  assert.equal(count,2);assert.equal(queries[0].sql,"BEGIN");assert.equal(queries.at(-1).sql,"COMMIT");
  const insert=queries.find(x=>x.sql.startsWith("INSERT"));assert.match(insert.sql,/zuz_market_research_prices/);
  assert.ok(!insert.sql.includes("display_name=excluded"));assert.ok(!insert.sql.includes("zuz_market_catalog"));assert.ok(!insert.sql.includes("zuz_market_prices("));
  const attempts=[];await assert.rejects(importDataset(data,{query:async sql=>{attempts.push(sql);if(sql.startsWith("INSERT"))throw Error("offline");}}));
  assert.equal(attempts.at(-1),"ROLLBACK");
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
