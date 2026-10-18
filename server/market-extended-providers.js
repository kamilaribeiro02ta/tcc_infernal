"use strict";
// Conectores externos: não persistem nem redistribuem histórico comercial sem autorização.
const cache=new Map();
const clean=(v,n=120)=>String(v??"").trim().slice(0,n);
const cents=v=>Number.isInteger(v)&&v>0&&v<100000000000?v/100:null;
const BRL="BRL";
function normalize(v){return clean(v,260).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();}
function parseKeepaHistory(series,{max=300}={}){
 if(!Array.isArray(series))return [];
 const out=[];
 for(let i=0;i+1<series.length;i+=2){
  const t=Number(series[i]),p=cents(series[i+1]);
  if(!Number.isFinite(t)||!p)continue; // -1/zero = indisponível
  const time=(t+21564000)*60000;
  if(time<Date.UTC(2000,0,1)||time>Date.now()+86400000)continue;
  out.push({date:new Date(time).toISOString(),price:p});
 }
 return out.slice(-max);
}
function keepaProduct(item){
 const asin=clean(item?.asin,10);
 if(!/^[A-Z0-9]{10}$/.test(asin))return null;
 const amazon=parseKeepaHistory(item?.csv?.[0]||[]);
 const newMarket=parseKeepaHistory(item?.csv?.[1]||[]);
 const historical=amazon.length?amazon:newMarket;
 const last=historical.at(-1);
 return {source:"Keepa — Amazon Brasil",asin,title:clean(item.title,180),brand:clean(item.brand,80),
  model:clean(item.model,80),url:"https://www.amazon.com.br/dp/"+asin,currency:BRL,
  latest:last?.price??null,history:historical,priceKind:amazon.length?"amazon":"marketplace_new",
  note:"Série de anúncios Amazon Brasil, não preços de lojas locais ou valor de imposto. Mudanças de preço não indicam vendas."};
}
async function limitedJSON(url,{timeout=8000,limit=4000000}={}){
 const response=await fetch(url,{headers:{"Accept":"application/json","User-Agent":"ZUZ-TCC/1.0"},signal:AbortSignal.timeout(timeout)});
 if(!response.ok)throw new Error("Provedor retornou HTTP "+response.status);
 const body=await response.text();if(body.length>limit)throw new Error("Resposta acima do tamanho autorizado");
 return JSON.parse(body);
}
async function keepaByProduct(code,asin){
 if(!process.env.KEEPA_API_KEY)return {enabled:false,products:[],warning:"Keepa exige assinatura e KEEPA_API_KEY."};
 const params=new URLSearchParams({key:process.env.KEEPA_API_KEY,domain:"12",history:"1",update:"72"});
 if(/^[A-Z0-9]{10}$/.test(asin||""))params.set("asin",asin);
 else if(/^\d{8,14}$/.test(code||""))params.set("code",code);
 else return {enabled:true,products:[],warning:"Keepa Brasil: pesquise por GTIN/EAN ou ASIN (não há busca livre brasileira confirmada nesta integração)."};
 const result=await limitedJSON("https://api.keepa.com/product?"+params,{limit:6000000});
 const products=(Array.isArray(result.products)?result.products:[]).map(keepaProduct).filter(Boolean).slice(0,5);
 return {enabled:true,products,warning:products.length?"":"Produto não encontrado na Amazon Brasil pelo identificador informado."};
}
function parseIPCA(rows){
 return (Array.isArray(rows)?rows:[]).flatMap(row=>{
  const date=/^(\d\d)\/(\d\d)\/(\d{4})$/.exec(String(row.data||""));
  const rate=Number(String(row.valor||"").replace(",","."));
  if(!date||!Number.isFinite(rate)||rate<=-100||rate>100)return [];
  return [{date:date[3]+"-"+date[2]+"-"+date[1],rate}];
 }).sort((a,b)=>a.date.localeCompare(b.date));
}
function adjustIPCA(value,rows,from,to){
 const amount=Number(value),start=String(from||"").slice(0,7),end=String(to||"").slice(0,7);
 if(!(amount>0)||!/^\d{4}-\d\d$/.test(start)||!/^\d{4}-\d\d$/.test(end)||start>=end)return null;
 const chosen=rows.filter(x=>x.date.slice(0,7)>start&&x.date.slice(0,7)<=end);
 const diff=(Number(end.slice(0,4))*12+Number(end.slice(5)))-(Number(start.slice(0,4))*12+Number(start.slice(5)));
 if(chosen.length!==diff)return null; // jamais extrapolar mês ausente
 const factor=chosen.reduce((a,x)=>a*(1+x.rate/100),1);
 return {nominal:amount,adjusted:Math.round(amount*factor*100)/100,factor,months:chosen.length,
  note:"Atualização monetária hipotética pelo IPCA; não é uma cotação histórica efetiva do produto."};
}
async function ipca(fromYear=2018){
 const year=Math.max(1990,Math.min(new Date().getUTCFullYear(),Number(fromYear)||2018));
 const key="ipca:"+year,entry=cache.get(key);
 if(entry&&Date.now()-entry.at<12*3600000)return entry.data;
 const url="https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?"+new URLSearchParams({
  formato:"json",dataInicial:"01/01/"+year,dataFinal:"31/12/"+new Date().getUTCFullYear()});
 const rows=parseIPCA(await limitedJSON(url,{timeout:8000,limit:300000}));
 const data={series:rows,source:"Banco Central (SGS 433 / IPCA mensal, IBGE)",
  url:"https://dadosabertos.bcb.gov.br/dataset/433",updatedThrough:rows.at(-1)?.date||null};
 cache.set(key,{at:Date.now(),data});return data;
}
const CLASSIF_URL="https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json?perfil=PUBLICO";
function flattenNCM(payload){
 const matches=[];const visited=new Set();const stack=[payload];
 while(stack.length&&matches.length<15000){
  const x=stack.pop();
  if(!x||typeof x!=="object"||visited.has(x))continue;visited.add(x);
  if(Array.isArray(x)){for(let i=x.length-1;i>=0;i--)stack.push(x[i]);continue;}
  const code=String(x.Codigo||x.codigo||x.codigoNcm||x.codNcm||"").replace(/\D/g,"");
  if(code.length===8){
   const description=clean(String(x.Descricao||x.descricao||x.descricaoConcatenada||x.description||"").replace(/<[^>]+>/g," "),230);
   if(description)matches.push({code,description});
  }
  for(const [k,v] of Object.entries(x))if(v&&typeof v==="object"&&k!=="metadata")stack.push(v);
 }
 return matches;
}
async function classif(query){
 const q=normalize(query);
 if(q.length<2)return {source:"Classif/Receita Federal",items:[],warning:"Digite ao menos dois caracteres."};
 const cached=cache.get("classif");
 if(cached&&Date.now()-cached.at<24*3600000){
  return {source:"Classif/Receita Federal",items:cached.data.filter(x=>normalize(x.code+" "+x.description).includes(q)).slice(0,15),
    url:CLASSIF_URL,note:"Códigos candidatos da tabela vigente, não enquadramento fiscal automático."};
 }
 // JSON completo pode ser grande. Não buscar reiteradamente se a fonte falhar.
 try{
  const raw=await limitedJSON(CLASSIF_URL,{timeout:12000,limit:16000000});
  const data=flattenNCM(raw);
  if(!data.length)throw new Error("Formato oficial alterado.");
  cache.set("classif",{at:Date.now(),data});
  return {source:"Classif/Receita Federal",items:data.filter(x=>normalize(x.code+" "+x.description).includes(q)).slice(0,15),
   url:CLASSIF_URL,note:"Tabela NCM vigente da Receita Federal. A classificação deve ser confirmada."};
 }catch{return {source:"Classif/Receita Federal",items:[],url:CLASSIF_URL,
   warning:"Tabela oficial indisponível nesta consulta. Use o Sistema Classif diretamente ou a busca auxiliar da BrasilAPI."};}
}
const official={
 bps:{label:"BPS — Ministério da Saúde",type:"precos_aquisicao_saude",
  url:"https://dadosabertos.saude.gov.br/dataset/bps",
  note:"Preços de aquisição de medicamentos e dispositivos médicos; não representam varejo."},
 sinapi:{label:"SINAPI — Caixa/IBGE",type:"referencia_custos_construcao",
  url:"https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/Paginas/default.aspx",
  note:"Referências de insumos e composições; não equivalem a oferta comercial. Arquivos recentes podem trazer preços zerados."},
 rtc:{label:"Calculadora RTC — Receita Federal",type:"simulacao_tributaria_oficial",
  url:"https://consumo.tributos.gov.br/servico/calcular-tributos-consumo/calculadora",
  note:"Sem API pública online para cálculo externo. O motor oficial é integrável apenas via módulo offline auto-hospedado, sujeito à versão e à validação."},
 classif:{label:"Classif — NCM oficial",type:"classificacao_mercadoria",url:CLASSIF_URL,note:"Classificação NCM vigente não define sozinha o imposto a recolher."}
};
function registerExtendedMarketRoutes(router,{asyncRoute}){
 router.get("/market/sector-prices",asyncRoute(async(req,res)=>{
  const {query,provider}=require("./database");
  const q=clean(req.query.q,80),source=clean(req.query.source,10);
  if(q.length<3)return res.status(400).json({error:"Digite pelo menos três caracteres."});
  if(source&&!["bps","sinapi"].includes(source))return res.status(400).json({error:"Fonte não reconhecida."});
  if(provider!=="postgresql")return res.json({items:[],warning:"Importação de BPS/SINAPI disponível no PostgreSQL; o SQLite local não possui estes dados."});
  try{
   const term="%"+normalize(q).replace(/[%_]/g,"")+"%";
   const rows=await query("SELECT source,source_ref,product_name,product_code,uf,unit,price,reference_date,category,provenance_url FROM zuz_sector_public_prices "+
    "WHERE unaccent(lower(product_name)) LIKE unaccent($1) AND ($2::text IS NULL OR source=$2) "+
    "ORDER BY reference_date DESC, product_name LIMIT 70",[term,source||null]);
   return res.json({items:rows.rows,source:"Dados setoriais importados da fonte pública",
    note:"BPS é aquisição em saúde; SINAPI é referência de custos de construção. Nenhum deles é cotação de loja ou preço de varejo."});
  }catch{
   return res.json({items:[],warning:"Tabelas setoriais não configuradas ou dados não importados. Não há preços confirmados para exibir."});
  }
 }));

 router.get("/market/keepa",asyncRoute(async(req,res)=>{
  const gtin=clean(req.query.gtin,14),asin=clean(req.query.asin,10).toUpperCase();
  try{res.json(await keepaByProduct(gtin,asin));}
  catch{res.json({enabled:!!process.env.KEEPA_API_KEY,products:[],warning:"Keepa temporariamente indisponível; nenhuma cotação foi presumida."});}
 }));
 router.get("/market/ipca",asyncRoute(async(req,res)=>{
  try{res.json(await ipca(req.query.fromYear));}
  catch{res.json({series:[],warning:"IPCA indisponível nesta consulta; nenhuma correção inflacionária foi presumida."});}
 }));
 router.get("/market/classif",asyncRoute(async(req,res)=>res.json(await classif(req.query.q))));
 router.get("/market/official-sources",(_req,res)=>res.json({sources:official}));
}
module.exports={registerExtendedMarketRoutes,parseKeepaHistory,keepaProduct,parseIPCA,adjustIPCA,flattenNCM,official};
