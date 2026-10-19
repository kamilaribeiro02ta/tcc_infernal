"use strict";
const revision=()=>String(process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||"").replace(/[^a-f0-9]/gi,"").slice(0,40)||null;
async function health(query,provider){
 const result=await query("SELECT 1 AS alive");
 if(Number(result.rows[0]?.alive)!==1)throw Error("DB_UNAVAILABLE");
 if(provider==="postgresql"){
  const schema=await query(`SELECT to_regclass('zuz_users') IS NOT NULL
    AND to_regclass('zuz_companies') IS NOT NULL AND to_regclass('zuz_products') IS NOT NULL
    AND to_regclass('zuz_simulations') IS NOT NULL AND to_regclass('zuz_market_catalog') IS NOT NULL
    AND to_regclass('zuz_market_prices') IS NOT NULL AND to_regclass('zuz_market_research_prices') IS NOT NULL
    AND to_regprocedure('zuz_market_use_curated_import()') IS NOT NULL AS ready`);
  if(!schema.rows[0]?.ready)throw Error("DB_SCHEMA_PENDING");
 }
 return {ok:true,app:"ZUZ",databaseConfigured:true,database:provider,schemaReady:true,revision:revision()};
}
function registerBackendStatus(router,{query,provider,asyncRoute}){
 router.get("/backend/status",asyncRoute(async(_req,res)=>{
  const status=await health(query,provider);
  const source=require("./market-bigdatacorp").state();
  let counts=null;
  if(provider==="postgresql"){
   const result=await query(`SELECT (SELECT count(*)::int FROM zuz_market_catalog) AS catalog,
    (SELECT count(*)::int FROM zuz_market_prices) AS prices,
    (SELECT count(DISTINCT catalog_id)::int FROM zuz_market_prices) AS priced_products,
    (SELECT count(*)::int FROM zuz_market_research_prices) AS historical_research`);
   counts=result.rows[0];
  }
  res.setHeader("Cache-Control","private, no-store");
  res.json({...status,counts,sources:{bigdatacorp:source,uci:{status:counts?.historical_research?"historical_imported":"not_imported",
   currency:"GBP",historical:true,usableForMarketPricing:false}},checkedAt:new Date().toISOString()});
 }));
 router.get("/market/research",asyncRoute(async(req,res)=>{
  res.setHeader("Cache-Control","private, no-store");
  const term=String(req.query.q||"").trim();
  if(term.length<3||term.length>80)return res.status(400).json({error:"Digite entre 3 e 80 caracteres."});
  if(provider!=="postgresql")return res.json({items:[],historical:true,usableForMarketPricing:false});
  const result=await query(`SELECT product_code,original_name,COALESCE(display_name,original_name) AS name,price,currency,
   observed_at,source_url,source_sha256,license FROM zuz_market_research_prices
   WHERE lower(original_name) LIKE $1 OR lower(COALESCE(display_name,'')) LIKE $1 ORDER BY original_name LIMIT 30`,
   ["%"+term.toLowerCase().replace(/[\\%_]/g,"")+"%"]);
  res.json({items:result.rows,historical:true,usableForMarketPricing:false,
   attribution:"Chen, D. (2015). Online Retail. UCI Machine Learning Repository. CC BY 4.0.",
   notice:"Vendas históricas de 2010–2011 em libras. Não representam preços atuais no Brasil."});
 }));
}
module.exports={health,registerBackendStatus,revision};
