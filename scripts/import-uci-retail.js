"use strict";
const {spawnSync}=require("node:child_process");
const path=require("node:path");
const {z}=require("zod");
const product=z.object({productCode:z.string().regex(/^\d{5}[A-Z]?$/),name:z.string().trim().min(1).max(240),
 price:z.string().regex(/^\d+(?:\.\d+)?$/).refine(v=>Number(v)>0&&Number(v)<1e8),currency:z.literal("GBP"),
 observedAt:z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/).refine(v=>Date.parse(v+"Z")>=Date.parse("2010-12-01")&&Date.parse(v+"Z")<Date.parse("2011-12-10"))});
const dataset=z.object({source:z.literal("uci_online_retail"),sourceUrl:z.literal("https://doi.org/10.24432/C5BW33"),
 sourceSha256:z.string().regex(/^[a-f0-9]{64}$/),license:z.literal("CC BY 4.0"),attribution:z.string(),
 scanned:z.number().int().nonnegative(),rejected:z.number().int().nonnegative(),products:z.array(product).max(20000)});
function readDataset(file){
 const result=spawnSync("python3",[path.join(__dirname,"extract-uci-retail.py"),path.resolve(file)],{encoding:"utf8",maxBuffer:16*1024*1024,timeout:180000});
 if(result.error||result.status!==0)throw Error("Não foi possível extrair a planilha UCI. Confira Python 3 e o formato do arquivo.");
 return dataset.parse(JSON.parse(result.stdout));
}
async function importDataset(data,client){
 const input=dataset.parse(data);
 await client.query("BEGIN");
 try{
  for(let start=0;start<input.products.length;start+=250){
   await client.query(`INSERT INTO zuz_market_research_prices(source,product_code,original_name,price,currency,observed_at,source_url,source_sha256)
    SELECT 'uci_online_retail',x."productCode",x.name,x.price::numeric,'GBP',x."observedAt"::timestamp,$2,$3
    FROM jsonb_to_recordset($1::jsonb) AS x("productCode" text,name text,price text,"observedAt" text)
    ON CONFLICT(source,product_code) DO UPDATE SET original_name=excluded.original_name,price=excluded.price,
     observed_at=excluded.observed_at,source_sha256=excluded.source_sha256,imported_at=NOW()`,
   [JSON.stringify(input.products.slice(start,start+250)),input.sourceUrl,input.sourceSha256]);
  }
  await client.query("COMMIT");
 }catch(e){await client.query("ROLLBACK");throw e;}
 return input.products.length;
}
async function main(args=process.argv.slice(2)){
 if(args.some(a=>a.startsWith("--")&&a!=="--apply")||args.filter(a=>!a.startsWith("--")).length!==1)
  throw Error("Use: npm run market:uci-import -- arquivo.xlsx [--apply]");
 const data=readDataset(args.find(a=>!a.startsWith("--")));
 const summary={mode:args.includes("--apply")?"apply":"preview",source:data.source,rows:data.scanned,products:data.products.length,
  rejected:data.rejected,currency:"GBP",historical:true,usableForMarketPricing:false,sourceSha256:data.sourceSha256,attribution:data.attribution};
 if(args.includes("--apply")){
  if(!process.env.DATABASE_URL)throw Error("DATABASE_URL PostgreSQL obrigatória para importar a base histórica.");
  const {Client}=require("pg"),client=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000});
  await client.connect();try{await importDataset(data,client);}finally{await client.end();}
 }
 console.log(JSON.stringify(summary,null,2));
}
if(require.main===module)main().catch(()=>{console.error("Importação UCI não concluída. Confira os parâmetros, Python 3, o banco e a migração 007; nenhum preço histórico entra na busca comercial.");process.exitCode=1;});
module.exports={readDataset,importDataset,dataset,main};
