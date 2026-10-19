"use strict";
// Importacao incremental oficial CATMAT/CATSER. Uso manual e controlado; nao inicia no site.
// npm run market:import -- --kind=service --pages=10 --start=1
const crypto=require("node:crypto");
const {query,provider}=require("../server/database");
const parse=(key,def)=>{const value=process.argv.find(x=>x.startsWith("--"+key+"="));return value?value.slice(key.length+3):def;};
const kind=parse("kind","service");
const pages=Number(parse("pages","5")),start=Number(parse("start","1"));
const size=100;
if(!["service","product"].includes(kind)||!Number.isSafeInteger(pages)||pages<1||pages>200||
 !Number.isSafeInteger(start)||start<1)throw new Error("Use --kind=service|product, --pages=1..200, --start=N.");
const specs=kind==="service"
 ?{path:"/modulo-servico/6_consultarItemServico",code:"codigoServico",name:"nomeServico",tag:"service"}
 :{path:"/modulo-material/4_consultarItemMaterial",code:"codigoItem",name:"descricaoItem",tag:"material"};
const sha=x=>crypto.createHash("sha256").update(x).digest("hex").slice(0,32);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function download(page){
 const url="https://dadosabertos.compras.gov.br"+specs.path+"?"+new URLSearchParams({pagina:String(page),tamanhoPagina:String(size)});
 const response=await fetch(url,{headers:{"Accept":"application/json","User-Agent":"ZUZ-TCC/1.0 (github.com/kamilaribeiro02ta/tcc_infernal)"},
   signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new Error("Compras.gov.br respondeu HTTP "+response.status+" na pagina "+page);
 const text=await response.text();
 if(text.length>2e6)throw new Error("Arquivo excedeu limite de tamanho.");
 const data=JSON.parse(text);
 if(!Array.isArray(data.resultado))throw new Error("Formato inesperado na pagina "+page);
 return data.resultado;
}
async function persist(rows){
 const valid=rows.filter(x=>String(x[specs.code]??"").match(/^\d{1,12}$/)&&String(x[specs.name]||"").trim()).slice(0,size);
 let total=0;
 for(let offset=0;offset<valid.length;offset+=40){
  const chunk=valid.slice(offset,offset+40),params=[];
  const placeholders=chunk.map((x,i)=>{
   const code=String(x[specs.code]),sourceId=specs.tag+":"+code;
   params.push(sha("comprasgov:"+sourceId),"comprasgov",sourceId,kind,String(x[specs.name]).trim().slice(0,240),
    String(x.nomeClasse||"").slice(0,160),JSON.stringify({catalogCode:code,governmentType:specs.tag}));
   return "("+Array.from({length:7},(_,j)=>j===6?"$"+(i*7+j+1)+"::jsonb":"$"+(i*7+j+1)).join(",")+")";
  }).join(",");
  const values=provider==="postgresql"?"SELECT v.* FROM (VALUES "+placeholders+") AS v(id,source,external_id,kind,name,category,attributes) WHERE zuz_market_use_curated_import()":"VALUES "+placeholders;
  const sql="INSERT INTO zuz_market_catalog (id,source,external_id,kind,name,category,attributes) "+values+
   " ON CONFLICT(source,external_id) DO UPDATE SET name=excluded.name,category=excluded.category,attributes=excluded.attributes,updated_at=CURRENT_TIMESTAMP RETURNING id";
  const result=await query(sql,params);total+=result.rowCount;
 }
 return total;
}
(async()=>{
 if(provider!=="postgresql")console.warn("Aviso: importando no SQLite local. Configure DATABASE_URL para alimentar o PostgreSQL.");
 console.info("Importacao ZUZ / "+specs.tag+" / "+pages+" pagina(s), inicio "+start);
 let count=0;
 for(let page=start;page<start+pages;page++){
  const rows=await download(page);
  if(!rows.length){console.info("Catalogo sem mais registros.");break;}
  const n=await persist(rows);count+=n;console.info("Pagina "+page+": "+n+" registros importados.");
  if(rows.length<size){console.info("Fim da colecao.");break;}
  await pause(700);
 }
 console.info("Total processado: "+count+". Nenhum dado privado de empresas foi acessado.");
})().catch(e=>{console.error("Importacao interrompida:",e.message);process.exitCode=1;});

