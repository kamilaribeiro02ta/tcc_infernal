"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {createRequire}=require("node:module");
function load(file,database,fetch){
 const filename=path.resolve(__dirname,"../server/"+file),module={exports:{}};
 const nativeRequire=createRequire(filename);
 vm.runInNewContext(fs.readFileSync(filename,"utf8"),{
  module,exports:module.exports,require:id=>id==="./database"?database:nativeRequire(id),
  URL,URLSearchParams,AbortSignal,fetch,Buffer,console,setTimeout,clearTimeout
 },{filename});
 return module.exports;
}
test("descoberta consulta somente fontes mantidas e persiste identificações sem preço",async()=>{
 const calls=[],writes=[];
 const discovery=load("market-discovery.js",{query:async(sql,params)=>{
  if(sql.startsWith("INSERT"))writes.push({sql,params});return {rows:[]};
 }},async url=>{
  calls.push(new URL(url).hostname);
  return {ok:true,text:async()=>JSON.stringify({products:[{code:"7891234567895",product_name:"Produto consultado"}]})};
 });
 const result=await discovery.lookup("produto");
 assert.deepEqual(calls.sort(),["world.openbeautyfacts.org","world.openfoodfacts.org"]);
 assert.equal(result.counts.imported,2);
 assert.equal(writes.filter(w=>w.sql.startsWith("INSERT INTO zuz_market_prices")).length,0);
});
test("consulta de identificação sem fonte de preço não chama conector removido",async()=>{
 const queries=[],routes=new Map();let remoteCalls=0;
 const item={id:"a".repeat(32),source:"openbeautyfacts",name:"Sabonete",barcode:"7891234567895",attributes:{}};
 const database={provider:"postgresql",query:async(sql)=>{
  queries.push(sql);return {rows:sql.startsWith("SELECT * FROM zuz_market_catalog")?[item]:[]};
 }};
 const market=load("market.js",database,async()=>{remoteCalls++;throw Error("unexpected network");});
 market.registerMarketRoutes({get:(route,fn)=>routes.set(route,fn),post:()=>{}},{asyncRoute:fn=>fn,getCompany:async()=>null});
 let result;
 await routes.get("/market/lookup")({user:{id:"test"},query:{id:item.id}},{setHeader(){},json(data){result=data;}});
 assert.equal(remoteCalls,0);assert.equal(result.references.length,0);
 assert.ok(!queries.some(sql=>sql.includes("zuz_market_cache")));
});
test("rotas matemáticas e histórico permanecem sem os conectores vazios",()=>{
 const routes=[];
 const router={get:(route)=>routes.push(route)};
 const options={asyncRoute:fn=>fn};
 load("market-extended-providers.js",{},()=>{throw Error("unexpected network");}).registerExtendedMarketRoutes(router,options);
 load("market-intelligence.js",{},()=>{throw Error("unexpected network");}).registerMarketIntelligenceRoutes(router,options);
 assert.deepEqual(routes.sort(),["/market/classif","/market/history","/market/ipca","/market/official-sources"]);
});
