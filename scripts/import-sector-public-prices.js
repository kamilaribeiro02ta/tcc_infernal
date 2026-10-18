"use strict";
/* Importa CSV oficial extraído das bases BPS e SINAPI; não presume formato de planilhas.
 npm run market:sector-import -- --source=bps --file=base.csv --url=https://dadosabertos.saude.gov.br/dataset/bps --map=name:DESCRICAO,price:PRECO,unit:UNIDADE,date:DATA,ref:ID,uf:UF
 Para SINAPI use --source=sinapi, URL oficial caixa.gov.br e um CSV exportado do XLSX.
*/
const fs=require("node:fs"),crypto=require("node:crypto");
// O banco só é aberto quando a importação for executada; testes de CSV não acessam dados.
function csvRows(input){
 const text=String(input||"").replace(/^\uFEFF/,"");
 const head=text.split(/\r?\n/,1)[0]||"";
 const delimiter=(head.match(/;/g)||[]).length>(head.match(/,/g)||[]).length?";":",";
 let cells=[],cell="",quoted=false;const rows=[];
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
  else if(ch===delimiter&&!quoted){cells.push(cell);cell="";}
  else if((ch==="\n"||ch==="\r")&&!quoted){
   cells.push(cell);if(cells.some(x=>x.trim()))rows.push(cells);
   cells=[];cell="";if(ch==="\r"&&text[i+1]==="\n")i++;
  }else cell+=ch;
 }
 cells.push(cell);if(cells.some(x=>x.trim()))rows.push(cells);
 return rows;
}
function parsePrice(x){
 const s=String(x??"").trim().replace(/\s/g,"").replace(/^R\$/i,"");
 if(!s)return null;
 const value=Number(s.includes(",")?s.replace(/\./g,"").replace(",","."):s);
 return Number.isFinite(value)&&value>0&&value<100000000?Math.round(value*10000)/10000:null;
}
function parseDate(x){
 const s=String(x||"").trim(),iso=/^(\d{4})-(\d\d)-(\d\d)$/.exec(s),
 br=/^(\d\d)\/(\d\d)\/(\d{4})$/.exec(s),month=/^(\d\d)\/(\d{4})$/.exec(s);
 const d=iso?s:br?br[3]+"-"+br[2]+"-"+br[1]:month?month[2]+"-"+month[1]+"-01":null;
 if(!d)return null;
 const obj=new Date(d+"T00:00:00Z");
 return Number.isFinite(obj.valueOf())&&obj.toISOString().slice(0,10)===d&&obj.valueOf()<=Date.now()?d:null;
}
function argsFrom(argv){
 const flags=Object.fromEntries(argv.filter(x=>x.startsWith("--")&&x.includes("=")).map(x=>{const j=x.indexOf("=");return [x.slice(2,j),x.slice(j+1)];}));
 const fields=Object.fromEntries(String(flags.map||"").split(",").filter(Boolean).map(x=>{const j=x.indexOf(":");return [x.slice(0,j),x.slice(j+1)];}));
 return {flags,fields};
}
function validate(row,header,fields,source,url){
 const get=k=>{const i=header.indexOf(fields[k]);return i<0?"":String(row[i]||"").trim()};
 const name=get("name").slice(0,240),price=parsePrice(get("price")),
  date=parseDate(get("date")),unit=get("unit").slice(0,50),ref=get("ref").slice(0,140),
  uf=get("uf").toUpperCase().slice(0,2),code=get("code").slice(0,70);
 if(!name||!price||!date||!unit||!ref||(uf&&!/^[A-Z]{2}$/.test(uf)))return null;
 const id=crypto.createHash("sha256").update([source,ref,date,uf,unit].join("|")).digest("hex").slice(0,32);
 return {id,source,ref,name,price,date,unit,uf:uf||null,code:code||null,
  category:source==="bps"?"health_purchase":"construction_input",url};
}
async function run(){
 const {provider,query}=require("../server/database");
 if(provider!=="postgresql")throw Error("A importação requer DATABASE_URL com PostgreSQL.");
 const {flags,fields}=argsFrom(process.argv.slice(2)),source=flags.source;
 if(!["bps","sinapi"].includes(source))throw Error("Fonte deve ser bps ou sinapi.");
 if(!flags.file||!fs.existsSync(flags.file))throw Error("Informe --file com CSV local.");
 for(const k of ["name","price","date","unit","ref"])if(!fields[k])throw Error("Mapeie a coluna "+k+" em --map.");
 const host=source==="bps"?"dadosabertos.saude.gov.br":"caixa.gov.br";
 let url;try{url=new URL(flags.url);}catch{throw Error("Informe --url com a origem do arquivo.");}
 if(url.protocol!=="https:"||!(url.hostname===host||url.hostname.endsWith("."+host)))
  throw Error("Origem incompatível com a fonte escolhida.");
 if(fs.statSync(flags.file).size>200*1024*1024)throw Error("CSV maior que 200 MB. Divida em lotes.");
 const rows=csvRows(fs.readFileSync(flags.file,"utf8")),header=(rows.shift()||[]).map(x=>x.trim());
 for(const c of Object.values(fields))if(c&&!header.includes(c))throw Error("Coluna inexistente: "+c);
 const accepted=[];let ignored=0;
 for(const row of rows){const x=validate(row,header,fields,source,url.toString());if(x)accepted.push(x);else ignored++;}
 if(!accepted.length)throw Error("Arquivo sem cotações positivas e verificáveis; nenhuma gravação realizada.");
 if(flags.dryRun==="true"){console.log(JSON.stringify({source,accepted:accepted.length,ignored,sample:accepted[0]},null,2));return;}
 let processed=0;
 const sql="INSERT INTO zuz_sector_public_prices(id,source,source_ref,product_name,product_code,uf,unit,price,reference_date,category,provenance_url) "+
 "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) "+
 "ON CONFLICT(id) DO UPDATE SET price=EXCLUDED.price,product_name=EXCLUDED.product_name,provenance_url=EXCLUDED.provenance_url RETURNING id";
 for(const x of accepted){
  const r=await query(sql,[x.id,x.source,x.ref,x.name,x.code,x.uf,x.unit,x.price,x.date,x.category,x.url]);
  processed+=r.rows.length;
 }
 console.log(JSON.stringify({source,processed,ignored,note:"Preços de aquisição/custos, não de varejo."}));
}
if(require.main===module)run().catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={csvRows,parsePrice,parseDate,argsFrom,validate};
