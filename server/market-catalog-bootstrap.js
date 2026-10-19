"use strict";
/*
 * Catálogo público por categorias com metadados rastreáveis.
 * Open Facts retornam cadastro de produtos e NÃO preços.
 * Não simular produtos, nem transformar fonte antiga em preço atual.
 */
const crypto=require("node:crypto");
const SOURCES={
 openfoodfacts:{host:"world.openfoodfacts.org",kind:"category",topics:[
  ["arroz","rice"],["feijao","beans"],["macarrao","pasta"],["farinha","flours"],["leite","milks"],
  ["iogurte","yogurts"],["queijo","cheeses"],["manteiga","butters"],["biscoitos","biscuits"],["chocolates","chocolates"],
  ["cafe","coffees"],["cha","teas"],["suco","fruit-juices"],["refrigerante","sodas"],["agua","waters"],
  ["paes","breads"],["bolos","cakes"],["cereais","breakfast-cereals"],["congelados","frozen-foods"],
  ["molhos","sauces"],["azeite","olive-oils"],["oleo","vegetable-oils"],["acucar","sugars"],["sal","salts"],
  ["carnes","meats"],["peixes","fish"],["verduras","vegetables"],["frutas","fruits"],
  ["ovos","eggs"],["sorvete","ice-creams"],["conservas","canned-foods"],["temperos","spices"],
  ["lanches","snacks"],["produtos-veganos","vegan-foods"],["produtos-sem-gluten","gluten-free-foods"]
 ]},
 openbeautyfacts:{host:"world.openbeautyfacts.org",kind:"text",topics:[
  ["shampoo","shampoo"],["condicionador","conditioner"],["sabonete","soap"],["creme","cream"],
  ["desodorante","deodorant"],["protetor-solar","sunscreen"],["maquiagem","makeup"],["batom","lipstick"],
  ["perfume","perfume"],["hidratante","moisturizer"],["pasta-de-dente","toothpaste"],["absorvente","sanitary-pads"],
  ["gel","gel"],["tinta-cabelo","hair-dye"],["esfoliante","scrub"]
 ]},

};
const clean=(v,n=200)=>String(v??"").trim().slice(0,n);
const hash=(s)=>crypto.createHash("sha256").update(s).digest("hex").slice(0,32);
const codeOK=v=>/^\d{8,14}$/.test(String(v||""));
const imageURL=x=>/^https:\/\/images\.openfoodfacts\.org\//.test(String(x||""))?clean(x,400):null;
function product(row,source){
 const code=clean(row?.code,14),name=clean(row?.product_name_pt||row?.product_name||row?.generic_name_pt||row?.generic_name,240);
 if(!codeOK(code)||!name)return null;
 const host=SOURCES[source].host;
 return {id:hash(source+":"+code),source,externalId:code,name,
  brand:clean(row.brands,120),category:clean(row.categories,160),
  unit:clean(row.quantity,50),
  attributes:{
   quantity:clean(row.quantity,50),image_url:imageURL(row.image_front_url||row.image_url),
   product_url:"https://"+host+"/product/"+code,
   description:clean(row.generic_name_pt||row.generic_name,240),
   ingredients:clean(row.ingredients_text_pt||row.ingredients_text,420),
   allergens:Array.isArray(row.allergens_tags)?row.allergens_tags.slice(0,20):[],
   labels:Array.isArray(row.labels_tags)?row.labels_tags.slice(0,20):[],
   categories_tags:Array.isArray(row.categories_tags)?row.categories_tags.slice(0,30):[],
   additives_tags:Array.isArray(row.additives_tags)?row.additives_tags.slice(0,15):[],
   serving_size:clean(row.serving_size,50),
   nutrition:{
    energy_kcal_100g:Number.isFinite(Number(row.nutriments?.["energy-kcal_100g"]))?Number(row.nutriments["energy-kcal_100g"]):null,
    sugars_100g:Number.isFinite(Number(row.nutriments?.sugars_100g))?Number(row.nutriments.sugars_100g):null,
    salt_100g:Number.isFinite(Number(row.nutriments?.salt_100g))?Number(row.nutriments.salt_100g):null,
    proteins_100g:Number.isFinite(Number(row.nutriments?.proteins_100g))?Number(row.nutriments.proteins_100g):null
   },
   nutriscore:clean(row.nutriscore_grade,4),
   novaGroup:Number.isFinite(Number(row.nova_group))&&Number(row.nova_group)>0?Number(row.nova_group):null,
   source_updated_at:Number.isFinite(Number(row.last_modified_t))&&Number(row.last_modified_t)>0?new Date(Number(row.last_modified_t)*1000).toISOString():null,
   source_label:source,
   price_notice:"Catálogo de produto. A fonte não inclui preço de venda."
  }};
}
const FIELDS="code,product_name,product_name_pt,generic_name,generic_name_pt,brands,quantity,categories,categories_tags,image_front_url,image_url,ingredients_text_pt,ingredients_text,allergens_tags,labels_tags,additives_tags,serving_size,nutriments,nutriscore_grade,nova_group,last_modified_t";
function buildURL(source,topic,page,size){
 const s=SOURCES[source];if(!s)throw Error("Fonte desconhecida.");
 const t=s.topics.find(x=>x[0]===topic);if(!t)throw Error("Categoria desconhecida.");
 let url;
 if(s.kind==="category"){
  url=new URL("https://"+s.host+"/api/v2/search");
  for(const [k,v] of Object.entries({categories_tags_en:t[1],page,page_size:size,fields:FIELDS,sort_by:"popularity_key"}))url.searchParams.set(k,String(v));
 }else{
  url=new URL("https://"+s.host+"/cgi/search.pl");
  for(const [k,v] of Object.entries({search_terms:t[1],search_simple:"1",action:"process",json:"1",page,page_size:size,fields:FIELDS}))
   url.searchParams.set(k,String(v));
 }
 return url;
}
async function fetchBatch(source,topic,page=1,size=50){
 const url=buildURL(source,topic,page,size);
 const resp=await fetch(url,{headers:{Accept:"application/json","User-Agent":"ZUZ-TCC/1.0 (github.com/kamilaribeiro02ta/tcc_infernal)"},signal:AbortSignal.timeout(10000)});
 if(!resp.ok)throw Error(source+" indisponível (HTTP "+resp.status+").");
 const raw=await resp.text();
 if(raw.length>2800000)throw Error("Resposta do catálogo acima do limite.");
 const data=JSON.parse(raw);
 if(!Array.isArray(data.products))throw Error("Resposta sem lista de produtos.");
 return {url:url.toString(),products:data.products.map(x=>product(x,source)).filter(Boolean),total:Number(data.count)||null};
}
async function upsertRows(items){
 const {query,provider}=require("./database");
 if(provider!=="postgresql")throw Error("Bootstrap exige PostgreSQL persistente.");
 let stored=0;
 // UPSERT mantém SKU, vínculo e preços existentes. Nunca sobrescreve informação privada.
 const sql="INSERT INTO zuz_market_catalog(id,source,external_id,kind,name,commercial_name,brand,barcode,category,unit,attributes,is_historical,commercial_search_ready,updated_at) "+
 "SELECT $1,$2,$3,'product',$4,$4,$5,$3,$6,$7,$8::jsonb,FALSE,TRUE,CURRENT_TIMESTAMP WHERE zuz_market_use_curated_import() "+
 "ON CONFLICT(source,external_id) DO UPDATE SET name=EXCLUDED.name,commercial_name=EXCLUDED.commercial_name,brand=EXCLUDED.brand,barcode=EXCLUDED.barcode,category=EXCLUDED.category,unit=EXCLUDED.unit,attributes=EXCLUDED.attributes,commercial_search_ready=TRUE,is_historical=FALSE,updated_at=CURRENT_TIMESTAMP RETURNING id";
 for(const x of items){
  const result=await query(sql,[x.id,x.source,x.externalId,x.name,x.brand,x.category,x.unit,JSON.stringify(x.attributes)]);
  stored+=result.rowCount;
 }
 return stored;
}
async function bootstrapSource({source,topic,page=1,size=50,preview=false}){
 const spec=SOURCES[source];if(!spec)throw Error("Fonte inválida.");
 if(!spec.topics.some(t=>t[0]===topic))throw Error("Categoria inválida.");
 if(!Number.isInteger(page)||page<1||page>1000||!Number.isInteger(size)||size<1||size>100)throw Error("Paginação inválida.");
 const data=await fetchBatch(source,topic,page,size);
 const stored=preview?0:await upsertRows(data.products);
 return {source,topic,page,returned:data.products.length,stored,availableInSource:data.total,sourceUrl:data.url,preview};
}
function nextTopics(day=Math.floor(Date.now()/86400000),initialSources=[]){
 return Object.entries(SOURCES).map(([source,s],index)=>{
  const isEmpty=initialSources.includes(source),pos=isEmpty?0:(day+index*3)%s.topics.length;
  return {source,topic:s.topics[pos][0]};
 });
}
async function bootstrapDaily({maxSources=2}={}){
 const {query,provider}=require("./database");
 if(provider!=="postgresql")return {ok:false,reason:"Banco PostgreSQL não configurado."};
 const db=await query("SELECT source,COUNT(*)::int AS total FROM zuz_market_catalog WHERE source=ANY($1::text[]) GROUP BY source",[Object.keys(SOURCES)]);
 const existing=new Map(db.rows.map(x=>[x.source,Number(x.total)]));
 const day=Math.floor(Date.now()/86400000);
 const desired=nextTopics(day,Object.keys(SOURCES).filter(k=>!existing.get(k)));
 // Priorizar fontes vazias, sem fazer 10 buscas/min/IP.
 desired.sort((a,b)=>(existing.get(a.source)||0)-(existing.get(b.source)||0));
 const outcomes=[];
 for(const item of desired.slice(0,Math.max(1,Math.min(4,maxSources)))){
  try{outcomes.push(await bootstrapSource({...item,size:45}));}
  catch(error){outcomes.push({...item,stored:0,error:error.message});}
 }
 return {ok:outcomes.some(x=>x.stored>0),outcomes};
}
module.exports={SOURCES,product,buildURL,fetchBatch,upsertRows,bootstrapSource,bootstrapDaily,nextTopics};
