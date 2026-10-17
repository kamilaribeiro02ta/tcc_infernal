"use strict";
// Sincronização segura do catálogo público: não lê usuários, custos, margens ou faturamento.
// Ex.: npm run market:sync -- --source=comprasgov --limit=10 --offset=0
const {provider}=require("../server/database");
const {syncCatalogPrices}=require("../server/market");
const option=(key,def)=>{
 const a=process.argv.find(x=>x.startsWith("--"+key+"="));
 return a?a.slice(key.length+3):def;
};
const source=option("source","comprasgov"),limit=Number(option("limit","10"));
const offset=Number(option("offset","0")),force=option("force","false")==="true";
async function run(){
 if(provider!=="postgresql")throw new Error("Para sincronizar o catálogo global, configure DATABASE_URL apontando para o Neon PostgreSQL. A execução foi interrompida sem escrever no SQLite.");
 const r=await syncCatalogPrices({source,limit,offset,force,onProgress:item=>{
  console.info(item.id+" — "+item.quotes+" cotação(ões) armazenada(s) ou previamente consultada(s)"+(item.error?" — "+item.error:""));
 }});
 console.info(JSON.stringify({source:r.source,processed:r.processed,quotesFoundInDb:r.pricesAvailable,sourceWarnings:r.errors},null,2));
 if(r.errors===r.processed&&r.processed>0)process.exitCode=1;
}
run().catch(error=>{console.error("Falha de sincronização:",error.message);process.exitCode=1;});
