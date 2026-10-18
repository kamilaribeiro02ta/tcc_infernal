"use strict";
const {SOURCES,bootstrapSource}=require("../server/market-catalog-bootstrap");
const option=(name,defaultValue)=>{const hit=process.argv.find(a=>a.startsWith("--"+name+"="));return hit?hit.slice(name.length+3):defaultValue};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 const {provider}=require("../server/database");
 if(provider!=="postgresql")throw Error("Configure DATABASE_URL do Neon; não importar num SQLite local.");
 const source=option("source","all"),category=option("topic","all");
 const pages=Number(option("pages","1")),size=Number(option("size","60"));
 const dryRun=option("dry-run","false")==="true",max=Number(option("max-requests","40"));
 if(!Number.isSafeInteger(pages)||pages<1||pages>5||!Number.isSafeInteger(size)||size<1||size>100||
 !Number.isSafeInteger(max)||max<1||max>50)throw Error("Use pages=1..5, size=1..100 e max-requests=1..50.");
 const keys=source==="all"?Object.keys(SOURCES):[source];
 if(keys.some(s=>!SOURCES[s]))throw Error("Fonte inválida.");
 const jobs=[];
 for(const s of keys){
  const topics=category==="all"?SOURCES[s].topics.map(x=>x[0]):[category];
  for(const topic of topics)for(let page=1;page<=pages;page++)jobs.push({source:s,topic,page,size,preview:dryRun});
 }
 let total=0,stored=0,errors=0;
 for(const job of jobs.slice(0,max)){
  try{
   const r=await bootstrapSource(job);total+=r.returned;stored+=r.stored;
   console.log(r.source+" / "+r.topic+" / pagina "+r.page+": "+r.returned+" identificados, "+r.stored+" persistidos.");
  }catch(e){errors++;console.warn(job.source+"/"+job.topic+": "+e.message);}
  await sleep(6500); // <= 10 pesquisas por minuto mesmo em lote.
 }
 console.info(JSON.stringify({requested:Math.min(max,jobs.length),identified:total,stored,errors,
  remaining:Math.max(0,jobs.length-max),note:"Somente produtos reais da fonte; nenhum preço adicionado."},null,2));
 if(errors&&stored===0)process.exitCode=1;
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
