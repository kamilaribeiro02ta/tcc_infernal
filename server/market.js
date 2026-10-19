"use strict";
const crypto=require("node:crypto");
const {query,provider}=require("./database");
const pricing=require("../shared/pricing-core");
const quality=require("./market-quality");
const hash=(a,b)=>crypto.createHash("sha256").update(a+":"+b).digest("hex").slice(0,32);
const txt=(x,n=180)=>String(x??"").trim().slice(0,n);
const pos=x=>{const n=Number(typeof x==="string"?x.replace(",","."):x);return Number.isFinite(n)&&n>0&&n<1e8?n:null;};
const iso=x=>{const d=new Date(x);return x&&Number.isFinite(d.getTime())&&d.getTime()<=Date.now()+86400000?d.toISOString():null;};
const median=quality.median;
const expired=x=>!iso(x)||Date.now()-new Date(x).getTime()>90*86400000;
const err=(status,message)=>{const e=new Error(message);e.status=status;throw e;};
const attempts=new Map();
function throttle(uid){
 const now=Date.now(),a=attempts.get(uid)||{start:now,n:0};
 if(now-a.start>60000){a.start=now;a.n=0;}a.n++;attempts.set(uid,a);
 if(attempts.size>1000)for(const [id,a] of attempts)if(now-a.start>60000)attempts.delete(id);
 if(a.n>40)err(429,"Aguarde um minuto antes de fazer novas consultas.");
}
function safeUrl(x){
 try{const u=new URL(x);return u.protocol==="https:"&&["dadosabertos.compras.gov.br","world.openfoodfacts.org"].includes(u.hostname)?u.toString():null;}catch{return null;}
}
async function getJson(url){
 if(!safeUrl(url))throw Error("Origem não autorizada.");
 const r=await fetch(url,{headers:{"Accept":"application/json","User-Agent":"ZUZ-TCC/1.0 (github.com/kamilaribeiro02ta/tcc_infernal)"},signal:AbortSignal.timeout(7500)});
 if(!r.ok)throw Error("Fonte indisponível (HTTP "+r.status+").");
 const body=await r.text();if(body.length>1300000)throw Error("Resposta externa grande demais.");
 return JSON.parse(body);
}
async function cacheGet(key,ttl){
 const r=await query("SELECT payload,fetched_at FROM zuz_market_cache WHERE cache_key=$1",[key]);
 if(!r.rows.length||Date.now()-new Date(r.rows[0].fetched_at).getTime()>ttl)return null;
 const payload=r.rows[0].payload;return typeof payload==="string"?JSON.parse(payload):payload;
}
async function cacheSet(key,obj){
 await query("INSERT INTO zuz_market_cache(cache_key,payload,fetched_at) VALUES($1,$2::jsonb,CURRENT_TIMESTAMP) ON CONFLICT(cache_key) DO UPDATE SET payload=excluded.payload,fetched_at=CURRENT_TIMESTAMP",[key,JSON.stringify(obj)]);
}
const dto=r=>({id:r.id,source:r.source,sourceId:r.external_id,type:r.kind,name:r.commercial_name||r.name,fullName:r.name,brand:r.brand||"",model:r.model||"",barcode:r.barcode||"",category:r.category||"",unit:r.unit||"",attributes:r.attributes||{},isHistorical:!!r.is_historical,updatedAt:r.updated_at||null});
async function upsert(item){
 const sql="INSERT INTO zuz_market_catalog(id,source,external_id,kind,name,brand,model,barcode,category,unit,attributes,updated_at) "+
 "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,CURRENT_TIMESTAMP) "+
 "ON CONFLICT(source,external_id) DO UPDATE SET name=excluded.name,brand=excluded.brand,model=excluded.model,"+
 "barcode=excluded.barcode,category=excluded.category,unit=excluded.unit,attributes=excluded.attributes,updated_at=CURRENT_TIMESTAMP RETURNING *";
 const r=await query(sql,[hash(item.source,item.externalId),item.source,item.externalId,item.kind,item.name,item.brand||null,item.model||null,item.barcode||null,item.category||null,item.unit||null,JSON.stringify(item.attributes||{})]);
 return dto(r.rows[0]);
}
function foodProduct(x){
 const code=txt(x.code,24),name=txt(x.product_name||x.product_name_pt,240);
 if(!/^\d{8,14}$/.test(code)||!name)return null;
 return {source:"openfoodfacts",externalId:code,kind:"product",name,barcode:code,brand:txt(x.brands,120),category:txt(x.categories,160),unit:txt(x.quantity,40),attributes:{quantity:txt(x.quantity,40)}};
}
async function searchFood(term){
 const url=/^\d{8,14}$/.test(term)
  ?"https://world.openfoodfacts.org/api/v2/product/"+term+"?fields=code,product_name,brands,quantity,categories"
  :"https://world.openfoodfacts.org/cgi/search.pl?"+new URLSearchParams({search_terms:term,search_simple:"1",action:"process",json:"1",page_size:"12",fields:"code,product_name,brands,quantity,categories"});
 const data=await getJson(url);
 return (Array.isArray(data.products)?data.products:data.product?[data.product]:[]).map(foodProduct).filter(Boolean);
}
async function searchGovernment(term){
 if(!/^\d{1,8}$/.test(term))return [];
 const bases=[["product","material","codigoItem","4_consultarItemMaterial","descricaoItem","codigoItem"],["service","service","codigoServico","6_consultarItemServico","nomeServico","codigoServico"]];
 const r=await Promise.allSettled(bases.map(async b=>{
  const url="https://dadosabertos.compras.gov.br/modulo-"+(b[0]==="product"?"material":"servico")+"/"+b[3]+"?"+new URLSearchParams({[b[2]]:term,tamanhoPagina:"5"});
  const d=await getJson(url);
  return (d.resultado||[]).filter(x=>String(x[b[5]])===term&&x[b[4]]).map(x=>({source:"comprasgov",externalId:b[1]+":"+term,kind:b[0],name:txt(x[b[4]],240),category:txt(x.nomeClasse,160),attributes:{catalogCode:term,governmentType:b[1]}}));
 }));
 if(r.every(x=>x.status==="rejected"))throw Error("Serviço de catálogo indisponível.");
 return r.flatMap(x=>x.status==="fulfilled"?x.value:[]);
}
async function catalog(term){
 const r=await query("SELECT * FROM zuz_market_catalog WHERE barcode=$1 OR lower(name) LIKE $2 OR lower(brand) LIKE $2 OR lower(model) LIKE $2 OR lower(category) LIKE $2 ORDER BY name LIMIT 20",[term,"%"+term.toLowerCase().replace(/[%_]/g,"")+"%"]);
 const stored=r.rows.map(dto),key="search:"+hash("term",term.toLowerCase());
 const hit=await cacheGet(key,12*3600000);if(hit)return {items:unique(stored.concat(hit.items)),cached:true,warnings:[]};
 const ext=await Promise.allSettled([searchFood(term),searchGovernment(term)]);
 const errors=ext.flatMap((x,i)=>x.status==="rejected"?[i===0?"Open Food Facts indisponível":"Compras.gov.br indisponível"]:[]);
 const imported=[];for(const item of ext.flatMap(x=>x.status==="fulfilled"?x.value:[]).slice(0,25))imported.push(await upsert(item));
 if(ext.some(x=>x.status==="fulfilled"))await cacheSet(key,{items:imported});
 return {items:unique(stored.concat(imported)),cached:false,warnings:errors};
}
function unique(items){return [...new Map(items.map(i=>[i.id,i])).values()].slice(0,25);}
async function storeQuote(item,q){
 const sql="INSERT INTO zuz_market_prices(id,catalog_id,source,source_ref,seller,price,currency,unit,region,condition,price_type,url,observed_at,fetched_at,gtin,offer_title,last_checked_at,brand,price_metadata) "+
 "VALUES($1,$2,$3,$4,$5,$6,'BRL',$7,$8,$9,$10,$11,$12,CURRENT_TIMESTAMP,$13,$14,CURRENT_TIMESTAMP,$15,$16::jsonb) "+
 "ON CONFLICT(source,source_ref) DO UPDATE SET seller=excluded.seller,price=excluded.price,unit=excluded.unit,"+
 "region=excluded.region,condition=excluded.condition,price_type=excluded.price_type,url=excluded.url,observed_at=excluded.observed_at,fetched_at=CURRENT_TIMESTAMP,"+
 "gtin=excluded.gtin,offer_title=excluded.offer_title,last_checked_at=CURRENT_TIMESTAMP,brand=excluded.brand,price_metadata=excluded.price_metadata";
 await query(sql,[hash(q.source,q.sourceRef),item.id,q.source,q.sourceRef,q.seller||null,q.price,q.unit||null,q.region||null,q.condition||"new",q.type,safeUrl(q.url),q.date,item.barcode||null,q.offerTitle||item.commercial_name||item.name,q.brand||null,JSON.stringify(q.metadata||{})]);
 await query("INSERT INTO zuz_market_price_history(quote_id,source,source_ref,price,observed_at) "+
  "VALUES($1,$2,$3,$4,$5) ON CONFLICT(quote_id,observed_at,price) DO NOTHING",
  [hash(q.source,q.sourceRef),q.source,q.sourceRef,q.price,q.date]);
}
async function fetchGovQuotes(item){
 const archived=item.source==="catmat_archive_2018";
 const code=item.attributes?.catalogCode||(archived?item.external_id:null);
 if(!["comprasgov","catmat_archive_2018"].includes(item.source)||!/^\d+$/.test(String(code||"")))return [];
 if(archived){
  // Uma entrada de 2018 só pode receber preços de 2026 depois de validação no catálogo oficial.
  const endpoint="https://dadosabertos.compras.gov.br/modulo-material/4_consultarItemMaterial?"+
   new URLSearchParams({codigoItem:String(code),tamanhoPagina:"10"});
  const current=await getJson(endpoint);
  const official=(current.resultado||[]).find(x=>String(x.codigoItem)===String(code)&&x.statusItem!==false);
  const normalize=x=>String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
  const oldFamily=normalize(String(item.name||"").split(",")[0]);
  const newName=normalize(official?.descricaoItem);
  if(!official||!oldFamily||oldFamily.length<5||!newName.startsWith(oldFamily))
   return []; // O código antigo pode ter sido revogado ou alterado; não presumir equivalência.
 }
 const isService=item.kind==="service";
 const route=isService?"3_consultarServico":"1_consultarMaterial";
 const params=isService?{codigoItemCatalogo:code,tamanhoPagina:"50"}:{tipo:"codigoItemCatalogo",codigo:code,tamanhoPagina:"50"};
 const url="https://dadosabertos.compras.gov.br/modulo-pesquisa-preco/"+route+"?"+new URLSearchParams(params);
 const d=await getJson(url);
 return (d.resultado||[]).map(x=>parseGovQuote(x,code,url)).filter(Boolean);
}
function parseGovQuote(x,code,url){
 const price=pos(x.precoUnitario),date=iso(x.dataCompra||x.dataResultado);
 const ref=txt(x.idCompra)+":"+txt(x.idItemCompra??x.numeroItemCompra);
 if(!price||!date||!x.idCompra||!ref.split(":")[1]||String(x.codigoItemCatalogo)!==String(code))return null;
 const discount=Number(x.percentualMaiorDesconto);
 return {source:"comprasgov",sourceRef:ref,price,date,type:"public_purchase",
  unit:txt(x.siglaUnidadeFornecimento||x.siglaUnidadeMedida||x.nomeUnidadeFornecimento||x.nomeUnidadeMedida,40),
  region:txt(x.estado||x.municipio,120),seller:txt(x.nomeFornecedor||x.nomeUasg||x.nomeOrgao),condition:"new",url,
  brand:txt(x.marca,120)||null,offerTitle:txt(x.descricaoDetalhadaItem||x.descricaoItem,1000)||null,
  metadata:{purchaseQuantity:pos(x.quantidade),packageCapacity:pos(x.capacidadeUnidadeFornecimento),
   procurementDiscountPercent:x.percentualMaiorDesconto!==null&&x.percentualMaiorDesconto!==undefined&&x.percentualMaiorDesconto!==""&&Number.isFinite(discount)&&discount>=0&&discount<=100?discount:null,
   procurementCriterion:txt(x.criterioJulgamento,160)||null,
   sourceUpdatedAt:iso(x.dataHoraAtualizacaoItem||x.dataAtualizacaoFato),
   purchaseDate:iso(x.dataCompra),resultDate:iso(x.dataResultado)}};
}

function groupsOf(quotes){return quality.summarize(quotes);}
async function quotesFor(item,{force=false}={}){
 const key="quotes:"+item.id,ttl=item.source==="comprasgov"?7*86400000:12*3600000;
 const canRefresh=["comprasgov","catmat_archive_2018"].includes(item.source);
 let warnings=[],hit=canRefresh?await cacheGet(key,ttl):null;
 if(canRefresh&&(!hit||force))try{
  const list=await fetchGovQuotes(item);
  for(const q of list.slice(0,50))await storeQuote(item,q);
  await cacheSet(key,{checked:true,count:list.length});
 }catch(e){warnings.push("Fonte externa indisponível. Mostrando apenas registros já consultados.");}
 const result=await query("SELECT id,source,source_ref,seller,price,currency,unit,region,condition,price_type,url,observed_at,fetched_at,last_checked_at,gtin,verification_status FROM zuz_market_prices WHERE catalog_id=$1 ORDER BY observed_at DESC LIMIT 100",[item.id]);
 const match=item.barcode?"codigo_de_barras":["comprasgov","catmat_archive_2018"].includes(item.source)?"codigo_catalogo":"sem_equivalencia";
 const quotes=result.rows.map(x=>quality.classify({...x,matching:match}));
 const found=quotes.filter(x=>!x.stale).length;
 return {quotes,groups:groupsOf(quotes),warnings,summary:{total:quotes.length,current:found,stale:quotes.length-found},
  matching:match,commercial:quality.commercialMarket(item,result.rows),
  note:["comprasgov","catmat_archive_2018"].includes(item.source)?"Compra pública não representa preço de varejo; itens históricos só são consultados após confirmação do código oficial.":"Preço colaborativo: confirme data e condições."};
}
function registerMarketRoutes(router,{asyncRoute,getCompany}){
 router.get("/market/lookup",asyncRoute(async(req,res)=>{
  throttle(req.user.id);const id=txt(req.query.id,40);
  if(!/^[a-f0-9]{32}$/.test(id))err(400,"Identificador de produto inválido.");
  const found=await query("SELECT * FROM zuz_market_catalog WHERE id=$1",[id]);
  if(!found.rows.length)err(404,"Produto não encontrado.");
  const row=found.rows[0];const item=dto(row);let warnings=[];
  if(provider==="postgresql"){const refreshed=await quotesFor(row);warnings=refreshed.warnings;}
  const prices=await query("SELECT * FROM zuz_market_prices WHERE catalog_id=$1 ORDER BY observed_at DESC LIMIT 50",[id]);
  const {normalizeReference}=require("./market-reference-search");
  res.setHeader("Cache-Control","private, no-store");res.json({references:prices.rows.map(price=>normalizeReference(item,price)).filter(Boolean),warnings});
 }));
 router.get("/market/references",asyncRoute(async(req,res)=>{
  throttle(req.user.id);
  const term=txt(req.query.q,81);
  if(term.length<3||term.length>80)err(400,"Digite entre 3 e 80 caracteres.");
  const result=await require("./market-reference-search").searchReferences(term,{query,provider,refresh:quotesFor,dto,
   discover:require("./market-discovery").lookup});
  res.setHeader("Cache-Control","private, no-store");
  res.json(result);
 }));
 router.get("/market/catalog",asyncRoute(async(req,res)=>{
  throttle(req.user.id);const q=txt(req.query.q,72);if(q.length<3)err(400,"Informe ao menos 3 caracteres.");
  res.setHeader("Cache-Control","private, no-store");res.json({query:q,...await catalog(q)});
 }));
 router.get("/market/quotes",asyncRoute(async(req,res)=>{
  throttle(req.user.id);const id=txt(req.query.id,40);if(!/^[a-f0-9]{32}$/.test(id))err(400,"Referência inválida.");
  const r=await query("SELECT * FROM zuz_market_catalog WHERE id=$1",[id]);
  if(!r.rows.length)err(404,"Item não encontrado.");
  const data=await quotesFor(r.rows[0]);
  const all=data.quotes,region=txt(req.query.region,120);
  const price=x=>{if(x===undefined)return null;if(!/^\d+(?:\.\d{1,2})?$/.test(String(x))||Number(x)>10000000)err(400,"Faixa de preço inválida");return Number(x);};
  const min=price(req.query.minimum),max=price(req.query.maximum);
  if(min!==null&&max!==null&&min>max)err(400,"Faixa de preço inválida");
  const quotes=all.filter(q=>(!region||q.region===region)&&(min===null||q.price>=min)&&(max===null||q.price<=max));
  res.setHeader("Cache-Control","private, no-store");
  res.json({item:dto(r.rows[0]),...data,quotes,groups:groupsOf(quotes),
   availableRegions:[...new Set(all.map(q=>q.region).filter(Boolean))].sort(),
   filters:{region,minimum:min,maximum:max}});
 }));
 router.post("/market/reference/verify",asyncRoute(async(req,res)=>{
  throttle(req.user.id);
  const itemId=txt(req.body?.itemId,50),quoteId=txt(req.body?.quoteId,50);
  if(!/^[a-f0-9]{32}$/.test(itemId)||!/^[a-f0-9]{32}$/.test(quoteId))
   err(400,"Selecione uma cotação válida.");
  const catalog=await query("SELECT * FROM zuz_market_catalog WHERE id=$1",[itemId]);
  if(!catalog.rows.length)err(404,"Produto não encontrado.");
  const quotes=await query("SELECT id,source,source_ref,price,currency,seller,region,unit,condition,price_type,url,observed_at,fetched_at,last_checked_at,gtin,verification_status FROM zuz_market_prices WHERE id=$1 AND catalog_id=$2",[quoteId,itemId]);
  const checked=quotes.rows[0]&&quality.verifiedRetailQuote(quotes.rows[0],catalog.rows[0]);
  if(!checked)err(409,"Esta cotação não está validada ou está desatualizada. Consulte outra oferta.");
  res.setHeader("Cache-Control","private, no-store");
  res.json({reference:{marketQuoteId:checked.id,marketProductId:itemId,verified:true,price:checked.price,
    name:txt(catalog.rows[0].commercial_name||catalog.rows[0].name,90),
    seller:checked.seller,observedAt:checked.observedAt,consultedAt:checked.consultedAt,
    region:checked.region,unit:checked.unit,gtin:checked.gtin,
    source:checked.source,url:checked.url},
    notice:"Preço de mercado confirmado nesta consulta. Não altera custos nem o preço de venda."});
 }));
 router.post("/market/recommend",asyncRoute(async(req,res)=>{
  throttle(req.user.id);const company=await getCompany(req.user.id);
  if(!company)err(404,"Configure a empresa antes de precificar.");
  const input=req.body||{},cost=Number(input.directCost),margin=Number(input.targetMargin??company.settings?.defaultMargin??30);
  if(!Number.isFinite(cost)||cost<0||cost>1e8||!Number.isFinite(margin)||margin<0||margin>90)err(400,"Custos ou margem inválidos.");
  const itemId=txt(input.itemId,50);let market=null,item=null;
  if(itemId){
   const r=await query("SELECT * FROM zuz_market_catalog WHERE id=$1",[itemId]);
   if(!r.rows.length)err(404,"Referência não encontrada.");
   item=r.rows[0];market=await quotesFor(item);
  }
  let result;try{result=pricing.calculate({unitDirectCost:cost,targetMargin:margin,settings:company.settings||{},salePrice:Math.max(0,Number(input.salePrice)||0),units:1});}
  catch(e){err(400,e.message);}
  const minimum=(cost+result.fixedAllocation)/(1-result.variableRatePct/100);
  const comparable=market?.commercial?.offers||[];
  const reference=market?.commercial?.summary?.median??null;
  res.setHeader("Cache-Control","private, no-store");
  res.json({directCost:cost,minimumSustainablePrice:minimum,technicalPrice:result.technicalPrice,
   suggestedPrice:reference===null?result.technicalPrice:Math.max(result.technicalPrice,reference),
   marketMedian:reference,marketCount:comparable.length,
   method:reference===null?"custos_e_margem":"custos_e_referencias_exatas",item:item?dto(item):null,
   explanation:"Preço mínimo cobre custos e encargos; preço técnico incorpora margem desejada. Comparações públicas não substituem custos.",
   warnings:result.warnings});
 }));
}
async function syncCatalogPrices({source="comprasgov",limit=15,offset=0,force=false,onProgress=()=>{}}={}){
 const allowed=["comprasgov","catmat_archive_2018"];
 if(!allowed.includes(source)||!Number.isInteger(limit)||limit<1||limit>50||!Number.isInteger(offset)||offset<0)err(400,"Parâmetros de importação inválidos.");
 const r=await query("SELECT * FROM zuz_market_catalog WHERE source=$1 ORDER BY external_id LIMIT $2 OFFSET $3",[source,limit,offset]);
 const summary={source,requested:limit,processed:0,pricesAvailable:0,errors:0,details:[]};
 for(const row of r.rows){
  try{
   const result=await quotesFor(row,{force});
   const n=result.quotes.length;
   summary.details.push({id:row.external_id,name:row.name.slice(0,80),quotes:n,warnings:result.warnings});
   summary.pricesAvailable+=n;
   if(result.warnings.length)summary.errors++;
  }catch(error){
   summary.errors++;
   summary.details.push({id:row.external_id,name:row.name.slice(0,80),quotes:0,error:String(error.message||error).slice(0,120)});
  }
  summary.processed++;
  onProgress(summary.details.at(-1));
  // Importação controlada: não sobrecarregar as APIs públicas.
  await new Promise(resolve=>setTimeout(resolve,650));
 }
 return summary;
}
module.exports={registerMarketRoutes,median,groupsOf,syncCatalogPrices,catalog,parseGovQuote};

