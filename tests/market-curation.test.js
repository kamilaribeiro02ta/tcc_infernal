"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {options}=require("../scripts/curate-market-catalog");
test("curadoria exige aplicação explícita e limita opções de exclusão e restauração",()=>{
 assert.deepEqual(options([]),{apply:false,limit:3,restore:undefined});
 assert.deepEqual(options(["--apply","--limit=2"]),{apply:true,limit:2,restore:undefined});
 for(const args of [["--limit=0"],["--limit=11"],["--restore-batch=errado"],["--delete-all"]])assert.throws(()=>options(args));
});
