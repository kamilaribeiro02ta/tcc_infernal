"use strict";
const express = require("express");
const crypto = require("crypto");
const { promisify } = require("util");
const { query, getPool, provider } = require("./database");
const catalog = require("../shared/business-templates");
const { registerSimulationRoutes } = require("./simulations-routes");
const { registerMarketRoutes } = require("./market");
const { registerMarketIntelligenceRoutes } = require("./market-intelligence");
const { registerExtendedMarketRoutes } = require("./market-extended-providers");
const { registerRTCRoutes } = require("./rtc-offline");
const { registerTaxContextRoutes } = require("./tax-context");
const { askCostsGuide } = require("./costs-assistant");
const { registerGeminiTestRoute } = require("./gemini-test");
const { askSimulationGuide } = require("./simulations-help");
const pricing = require("../shared/pricing-core");
const money = require("../shared/money");
const {schemas,validateBody}=require("./validation");
const {registerSalesInventory}=require("./sales-inventory");
const {registerCalendarRoutes}=require("./calendar-routes");
// O motor estatístico só é carregado ao consultar previsões;
// falha nele não pode bloquear cadastro, login e sessão.
const predictPrice = (...args) => require("../shared/price-prediction").predictPrice(...args);
const scrypt = promisify(crypto.scrypt);
const SESSION = "zuz_auth";
const MAX_AGE = 7 * 24 * 60 * 60;
const validOps = new Set(["producao", "revenda", "servico", "misto"]);
const fail = (status, message) => { const e = new Error(message); e.status = status; throw e; };
const normalText = (value, length = 120) => String(value || "").trim().slice(0, length);
const cookie = req => {
  const raw = (req.headers.cookie || "").split(";").map(x => x.trim()).find(x => x.startsWith(SESSION + "="));
  return raw ? raw.slice(SESSION.length + 1) : "";
};
const cookieAttrs = req => `HttpOnly; SameSite=Lax; Path=/; ${process.env.NODE_ENV === "production" || req.secure ? "Secure; " : ""}Max-Age=${MAX_AGE}`;
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
async function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const digest = await scrypt(password, salt, 64);
  return `${salt}:${digest.toString("hex")}`;
}
async function checkPassword(password, stored) {
  const [salt, hex] = String(stored || "").split(":");
  if (!salt || !/^[a-f0-9]{128}$/.test(hex || "")) return false;
  const digest = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hex, "hex"), digest);
}
const tokenHash = token => crypto.createHash("sha256").update(token).digest("hex");
async function session(req, res, user) {
  const token = crypto.randomBytes(32).toString("hex");
  await query("INSERT INTO zuz_sessions(token_hash,user_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '7 days')",
    [tokenHash(token), user.id]);
  res.setHeader("Set-Cookie", `${SESSION}=${token}; ${cookieAttrs(req)}`);
}
async function getUser(req) {
  const token = cookie(req);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const result = await query(`SELECT u.id,u.full_name,u.email
    FROM zuz_sessions s JOIN zuz_users u ON u.id=s.user_id
    WHERE s.token_hash=$1 AND s.expires_at>NOW()`, [tokenHash(token)]);
  return result.rows[0] || null;
}
const safeUser = u => ({ id: u.id, name: u.full_name, email: u.email });
async function getCompany(userId) {
  const r = await query("SELECT * FROM zuz_companies WHERE owner_id=$1", [userId]);
  return r.rows[0] || null;
}
function productSnapshot(product, settings) {
  const costs = Array.isArray(product.additionalCosts) ? product.additionalCosts : [];
  const rawDirect = product.baseCost ?? product.direct_cost ?? product.directCost ?? 0;
  const direct = money.sum([Number(rawDirect), ...costs.map(item => Number(item.value || 0))]);
  const salePrice = Number(product.salePrice ?? product.sale_price ?? 0);
  const targetMargin = Number(product.targetMargin ?? product.target_margin ?? settings.defaultMargin ?? 30);
  const units = Number(product.units ?? 1);
  return pricing.calculate({
    unitDirectCost: direct, salePrice, targetMargin, units,
    category: product.category, productId: product.id,
    productName: product.name, settings
  });
}
async function appendRecommendation(client, companyId, product, settings) {
  const calculation = productSnapshot(product, settings);
  const snapshot = {
    productId: String(product.id), productName: String(product.name),
    salePrice: calculation.salePrice, directCost: calculation.directCost,
    units: calculation.units, targetMargin: calculation.targetMargin,
    technicalPrice: calculation.technicalPrice,
    suggestedPrice: calculation.suggestedPrice,
    recommendedRange: calculation.recommendedRange, recommendationMethod: calculation.recommendationMethod,
    explanation: calculation.explanation, warnings: calculation.warnings,
    market: calculation.market, fixedAllocation: calculation.fixedAllocation
  };
  const fingerprint = crypto.createHash("sha256").update(JSON.stringify({
    name: product.name, category: product.category, snapshot, settings: pricing.normalize(settings)
  })).digest("hex");
  const previous = await client.query(
    "SELECT fingerprint FROM zuz_pricing_history WHERE company_id=$1 AND product_id=$2 ORDER BY id DESC LIMIT 1",
    [companyId, String(product.id)]
  );
  if (previous.rows[0]?.fingerprint === fingerprint) return;
  await client.query(
    "INSERT INTO zuz_pricing_history(company_id,product_id,product_name,fingerprint,snapshot) VALUES($1,$2,$3,$4,$5)",
    [companyId,String(product.id),String(product.name),fingerprint,JSON.stringify(snapshot)]
  );
}
function createApi() {
  const router = express.Router();
  registerGeminiTestRoute(router, asyncRoute, getUser, {appendRecommendation});
  router.get("/health", asyncRoute(async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try{res.json(await require("./backend-status").health(query,provider));}
    catch{res.status(503).json({ok:false,app:"ZUZ",code:"BACKEND_NOT_READY"});}
  }));
  router.post("/auth/signup", validateBody(schemas.signup), asyncRoute(async (req, res) => {
    const name = normalText(req.body.name, 160);
    const email = normalText(req.body.email, 254).toLowerCase();
    const password = String(req.body.password || "");
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 256) fail(400, "Nome, e-mail e senha válida são obrigatórios.");
    const existing = await query("SELECT id FROM zuz_users WHERE email=$1", [email]);
    if (existing.rowCount) fail(409, "Já existe uma conta com esse e-mail.");
    const hash = await hashPassword(password);
    let created;
    try {
      created = await query("INSERT INTO zuz_users(full_name,email,password_hash) VALUES($1,$2,$3) RETURNING id,full_name,email", [name,email,hash]);
    } catch (e) { if (e.code === "23505" || e.code === "SQLITE_CONSTRAINT_UNIQUE" || e.code === "SQLITE_CONSTRAINT_PRIMARYKEY") fail(409, "Já existe uma conta com esse e-mail."); throw e; }
    const user = created.rows[0]; await session(req,res,user);
    res.status(201).json({ user: safeUser(user), company: null });
  }));
  router.post("/auth/login", validateBody(schemas.login), asyncRoute(async (req, res) => {
    const email = normalText(req.body.email,254).toLowerCase();
    const result = await query("SELECT * FROM zuz_users WHERE email=$1",[email]);
    const user = result.rows[0];
    if (!user || !await checkPassword(String(req.body.password || ""),user.password_hash)) fail(401,"E-mail ou senha inválidos.");
    await session(req,res,user);
    res.json({ user: safeUser(user), company: await getCompany(user.id) });
  }));
  router.post("/auth/logout", asyncRoute(async (req,res) => {
    const token = cookie(req);
    if (/^[a-f0-9]{64}$/.test(token)) await query("DELETE FROM zuz_sessions WHERE token_hash=$1",[tokenHash(token)]);
    res.setHeader("Set-Cookie", `${SESSION}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
    res.json({ ok: true });
  }));
  // Vercel Cron: rota administrativa separada do login, bloqueada por chave do servidor.
  router.get("/market/cron",asyncRoute(async(req,res)=>{
    const secret=process.env.CRON_SECRET;
    const authorization=String(req.headers.authorization||"");
    const expected=secret?"Bearer "+secret:"";
    const auth=Buffer.from(authorization),valid=Buffer.from(expected);
    if(!secret||secret.length<16||auth.length!==valid.length||!crypto.timingSafeEqual(auth,valid))
      return res.status(401).json({error:"Cron não autorizado."});
    // Importa as duas fontes com itens persistidos: nenhuma entrada é inventada.
    // API do Open Food Facts limita pesquisas; uma requisição por domínio por dia.
    const {bootstrapDaily}=require("./market-catalog-bootstrap");
    const bootstrap=await bootstrapDaily({maxSources:2});
    const source=new Date().getUTCDay()===0?"comprasgov":"catmat_archive_2018";
    const {syncCatalogPrices}=require("./market");
    let priceSync={source,processed:0,quotesAvailable:0,sourceFailures:0};
    try{
      const r=await query("SELECT COUNT(*)::int AS total FROM zuz_market_catalog WHERE source=$1",[source]);
      const count=Number(r.rows[0]?.total)||0;
      if(count>0){
        const limit=3;
        const offset=(Math.floor(Date.now()/86400000)*limit)%count;
        const result=await syncCatalogPrices({source,limit,offset});
        priceSync={source,processed:result.processed,quotesAvailable:result.pricesAvailable,sourceFailures:result.errors};
      }
    }catch(e){priceSync.warning="Sincronização de preços governamentais indisponível."; }
    let curation;
    if(provider==="postgresql")try{
      const result=await query("SELECT zuz_market_curate_catalog((SELECT max_per_group FROM zuz_market_catalog_policy WHERE id=1),FALSE) AS summary");
      curation=result.rows[0].summary;
    }catch{curation={warning:"Curadoria indisponível; confira a migração do catálogo."};}
    res.setHeader("Cache-Control","no-store");
    res.json({ok:true,bootstrap,priceSync,curation,
      note:"A rotina importa produtos identificados por Open Facts, mas não inventa cotações de preço."});
  }));
  router.use(asyncRoute(async (req,res,next) => {
    const user = await getUser(req);
    if (!user) fail(401,"Faça login para continuar.");
    req.user = user; next();
  }));
  require("./backend-status").registerBackendStatus(router,{query,provider,asyncRoute});
  registerMarketRoutes(router,{asyncRoute,getCompany});
  registerMarketIntelligenceRoutes(router,{asyncRoute});
  registerExtendedMarketRoutes(router,{asyncRoute});
  registerRTCRoutes(router,{asyncRoute});
  registerTaxContextRoutes(router,{asyncRoute});

  router.get("/market/coverage",asyncRoute(async(req,res)=>{
    const catalog=await query("SELECT source,kind,COUNT(*)::int AS items FROM zuz_market_catalog GROUP BY source,kind ORDER BY items DESC");
    const prices=await query("SELECT source,price_type,COUNT(*)::int AS records FROM zuz_market_prices GROUP BY source,price_type");
    res.setHeader("Cache-Control","private, no-store");
    res.json({catalog:catalog.rows,prices:prices.rows,
      integrations:{
        openFacts:{configured:true,sources:["openfoodfacts","openbeautyfacts"],periodicImportEnabled:!!process.env.CRON_SECRET},
        publicPrices:{sources:["comprasgov"]},
        ibpt:{configured:!!process.env.IBPT_TOKEN},
        rtcOffline:{configured:!!process.env.RTC_OFFLINE_API_BASE_URL}
      },
      note:"Catálogo, observações de preços e configurações são métricas diferentes. Não confundir registros técnicos com ofertas."});
  }));


  // Mercado: resultados atuais e técnicos são exibidos separadamente, nunca tratados como ofertas equivalentes.
  router.get("/market/v2/search",asyncRoute(async(req,res)=>{
    const term=normalText(req.query.q,80);
    if(term.length<2)fail(400,"Digite ao menos dois caracteres.");
    if(provider!=="postgresql"){
      // O SQLite não dispõe da função SQL PostgreSQL nem do acervo público do Neon.
      // Não retornar 503: permitir pesquisa nos itens locais com aviso transparente.
      const kindLocal=["product","service"].includes(req.query.kind)?req.query.kind:null;
      const like="%"+term.toLowerCase().replace(/[%_]/g,"")+"%";
      const r=await query("SELECT c.id AS item_id,c.kind,c.name AS display_name,c.name AS full_name,c.brand,c.model,c.barcode,c.category,c.source,FALSE AS is_historical, EXISTS(SELECT 1 FROM zuz_market_prices p WHERE p.catalog_id=c.id) AS has_price FROM zuz_market_catalog c WHERE (lower(c.name) LIKE $1 OR c.barcode=$2) AND ($3 IS NULL OR c.kind=$3) ORDER BY c.name LIMIT 30",[like,term,kindLocal]);
      const items=r.rows.map(x=>({...x,is_historical:false,has_price:!!x.has_price}));
      res.setHeader("Cache-Control","private, no-store");
      return res.json({items,commercial:items,archived:[],warnings:["Catálogo SQLite local: o acervo histórico do PostgreSQL Neon não é sincronizado automaticamente."],totals:{commercial:items.length,archived:0,archiveTotal:0},archivePage:0,archiveHasMore:false});
    }
    const kind=["product","service"].includes(req.query.kind)?req.query.kind:null;
    const includeArchive=req.query.historical==="true";
    const warnings=[];
    const page=Math.min(200,Math.max(0,Number.parseInt(req.query.page,10)||0));
    let current=(await query("SELECT * FROM zuz_market_search_v2($1,$2,$3,FALSE,30)",[term,kind,null])).rows;
    if(kind!=="service"&&current.length<12){
      try{
        const data=await require("./market-discovery").lookup(term);
        warnings.push(...data.warnings);
        current=(await query("SELECT * FROM zuz_market_search_v2($1,$2,$3,FALSE,30)",[term,kind,null])).rows;
      }catch(error){
        warnings.push("Um catálogo externo está indisponível. Exibindo os itens já armazenados.");
      }
    }
    // Não confundir coincidência só na categoria com o termo buscado.
    const normalized=require("./market-discovery").norm;
    const wanted=normalized(term);
    current=current.filter(x=>{
      const line=normalized([x.display_name,x.brand,x.model,x.barcode].filter(Boolean).join(" "));
      const tokens=wanted.split(/\s+/).filter(word=>word.length>=2);
      const words=line.split(/\s+/);
      return line.includes(wanted)||x.barcode===term||
        (tokens.length>0&&tokens.every(token=>words.some(word=>word.startsWith(token))));
    }).slice(0,20);
    let archived=[];
    let archiveTotal=0;
    if(includeArchive){
      const contains="%"+term.toLowerCase().replace(/[\\%_]/g,"")+"%";
      const tally=await query("SELECT COUNT(*)::int AS total FROM zuz_market_catalog WHERE source='catmat_archive_2018' AND unaccent(lower(name)) LIKE unaccent($1) AND ($2::text IS NULL OR kind=$2)",[contains,kind]);
      archiveTotal=Number(tally.rows[0]?.total)||0;
      const r=await query(
        "SELECT id AS item_id,kind,LEFT(SPLIT_PART(name,',',1),140) AS display_name,name AS full_name,"+
        "brand,model,barcode,category,source,external_id AS source_id,TRUE AS is_historical,FALSE AS has_price,20 AS match_score "+
        "FROM zuz_market_catalog WHERE source='catmat_archive_2018' AND unaccent(lower(name)) LIKE unaccent($1) "+
        "AND ($2::text IS NULL OR kind=$2) ORDER BY CASE WHEN unaccent(lower(name)) LIKE unaccent($3) THEN 0 ELSE 1 END,LENGTH(name) LIMIT 35 OFFSET $4",
        [contains,kind,term.toLowerCase().replace(/[\\%_]/g,"")+"%",page*35]);
      const seen=new Set();
      for(const x of r.rows){
        const key=normalized(x.full_name);
        if(seen.has(key))continue;
        seen.add(key);archived.push(x);
        if(archived.length>=35)break;
      }
    }
    res.setHeader("Cache-Control","private, no-store");
    res.json({items:current.concat(archived),commercial:current,archived,warnings,
      totals:{commercial:current.length,archived:archived.length,archiveTotal},archivePage:page,archiveHasMore:(page+1)*35<archiveTotal,
      note:"Itens históricos são apenas referências técnicas. Fontes de catálogo não garantem preços."});
  }));
  router.get("/market/v2/item",asyncRoute(async(req,res)=>{
    const id=normalText(req.query.id,50);
    if(!/^[a-f0-9]{32}$/.test(id))fail(400,"Identificador inválido.");
    if(provider!=="postgresql"){
      const local=await query("SELECT * FROM zuz_market_catalog WHERE id=$1",[id]);
      if(!local.rows.length)fail(404,"Item não encontrado.");
      const p=await query("SELECT COUNT(*) AS count FROM zuz_market_prices WHERE catalog_id=$1",[id]);
      const x=local.rows[0];
      res.setHeader("Cache-Control","private, no-store");
      return res.json({item:{id:x.id,source:x.source,sourceId:x.external_id,type:x.kind,name:x.name,fullName:x.name,
       brand:x.brand,model:x.model,barcode:x.barcode,category:x.category,unit:x.unit,
       attributes:typeof x.attributes==="string"?JSON.parse(x.attributes):x.attributes||{},
       isHistorical:false,updatedAt:x.updated_at,priceCount:Number(p.rows[0]?.count)||0}});
    }
    const r=await query("SELECT id,source,external_id,kind,name,commercial_name,brand,model,barcode,category,unit,attributes,is_historical,updated_at FROM zuz_market_catalog WHERE id=$1",[id]);
    if(!r.rows.length)fail(404,"Item não encontrado.");
    const x=r.rows[0];
    const prices=await query("SELECT COUNT(*)::int AS count FROM zuz_market_prices WHERE catalog_id=$1",[id]);
    res.setHeader("Cache-Control","private, no-store");
    res.json({item:{id:x.id,source:x.source,sourceId:x.external_id,type:x.kind,
      name:x.commercial_name||x.name,fullName:x.name,brand:x.brand,model:x.model,
      barcode:x.barcode,category:x.category,unit:x.unit,attributes:x.attributes||{},
      isHistorical:!!x.is_historical,updatedAt:x.updated_at,
      priceCount:prices.rows[0]?.count||0}});
  }));

  router.get("/me", asyncRoute(async (req,res) => res.json({ user:safeUser(req.user),company:await getCompany(req.user.id) })));
  // Atualiza a identidade autenticada no banco, permitindo que o nome apareça
  // corretamente em outros dispositivos (em vez de existir apenas no localStorage).
  router.put("/me", validateBody(schemas.profile), asyncRoute(async (req,res) => {
    const name=normalText(req.body?.name,160);
    if(name.length<2) fail(400,"Informe um nome com pelo menos 2 caracteres.");
    const result=await query(
      "UPDATE zuz_users SET full_name=$1 WHERE id=$2 RETURNING id,full_name,email",
      [name,req.user.id]
    );
    if(!result.rows[0]) fail(404,"Conta não encontrada.");
    res.json({user:safeUser(result.rows[0])});
  }));
  // Orientação solicitada pelo usuário: não modifica os dados da empresa.
  // Ajuda didática de Simulações. Não executa alterações no banco de dados.
  router.post("/help/simulations", asyncRoute(async (req,res) => {
    const result=await askSimulationGuide({
      topic:req.body?.topic,
      message:req.body?.message,
      context:req.body?.context
    });
    res.setHeader("Cache-Control","no-store");
    res.json(result);
  }));

  router.post("/help/costs", asyncRoute(async (req,res) => {
    const result=await askCostsGuide({
      topic:req.body?.topic,
      message:req.body?.message,
      context:req.body?.context
    });
    res.setHeader("Cache-Control","no-store");
    res.json(result);
  }));
  router.get("/templates", (_req,res) => res.json(catalog));
  router.get("/company", asyncRoute(async (req,res) => {
    const company=await getCompany(req.user.id);
    if (!company) return res.json({ company:null, categories:[], products:[] });
    const [categories,products]=await Promise.all([
      query("SELECT id,label,cost_type,unit FROM zuz_cost_categories WHERE company_id=$1 ORDER BY label",[company.id]),
      query(provider === "postgresql" ? "SELECT payload FROM zuz_products WHERE company_id=$1 ORDER BY created_at DESC" : "SELECT * FROM zuz_products WHERE company_id=$1 ORDER BY created_at DESC",[company.id])
    ]);
    res.json({ company, categories:categories.rows, products:products.rows.map(row=>row.payload && Object.keys(row.payload).length ? row.payload : row) });
  }));
  router.put("/company", validateBody(schemas.company), asyncRoute(async (req,res) => {
    const name=normalText(req.body.name,160);
    const segment=normalText(req.body.segment || "outro",120);
    const operation_type=normalText(req.body.operationType,24);
    const costing_mode=normalText(req.body.costingMode || "por_unidade",32);
    if (!name || !validOps.has(operation_type)) fail(400,"Nome e operação válidos são obrigatórios.");
    const cats=Array.isArray(req.body.categories) ? req.body.categories : [];
    if (cats.length>60 || cats.some(c=>typeof c!=="string" || !c.trim() || c.length>120)) fail(400,"Revise as categorias de custos.");
    const unique=[...new Set(cats.map(c=>c.trim()))];
    const value=await query(`INSERT INTO zuz_companies(owner_id,name,segment,operation_type,costing_mode)
      VALUES($1,$2,$3,$4,$5) ON CONFLICT(owner_id) DO UPDATE
      SET name=EXCLUDED.name,segment=EXCLUDED.segment,operation_type=EXCLUDED.operation_type,
      costing_mode=EXCLUDED.costing_mode,updated_at=NOW() RETURNING *`,
      [req.user.id,name,segment,operation_type,costing_mode]);
    const company=value.rows[0];
    const client=await getPool().connect();
    try {
      await client.query("BEGIN");
      await client.query(provider === "postgresql" ? "DELETE FROM zuz_cost_categories WHERE company_id=$1 AND NOT (label = ANY($2::text[]))" : "DELETE FROM zuz_cost_categories WHERE company_id=$1 AND label NOT IN (SELECT value FROM json_each($2))",[company.id,provider === "postgresql" ? unique : JSON.stringify(unique)]);
      for (const label of unique) {
        const type=/taxa|comiss|tributo|imposto/i.test(label)?"percentual":/aluguel|internet|assinatura|licença/i.test(label)?"fixo":"direto";
        const unit=type==="percentual"?"percentual":"reais";
        await client.query("INSERT INTO zuz_cost_categories(company_id,label,cost_type,unit) VALUES($1,$2,$3,$4) ON CONFLICT(company_id,label) DO NOTHING",[company.id,label,type,unit]);
      }
      await client.query("COMMIT");
    } catch(e){await client.query("ROLLBACK");throw e;}
    finally{client.release();}
    res.json({ company });
  }));
  router.put("/company/settings", validateBody(schemas.settings), asyncRoute(async (req,res) => {
    const company=await getCompany(req.user.id);
    if (!company) fail(404,"Configure sua empresa antes de salvar os custos.");
    const input=req.body.settings;
    if (!input || typeof input!=="object" || Array.isArray(input) || JSON.stringify(input).length>32000)
      fail(400,"Configurações inválidas.");
    const operationType=normalText(input.operationType ?? company.operation_type,24);
    if(!validOps.has(operationType))fail(400,"Tipo de operação inválido.");
    const segment=normalText(input.segment ?? company.segment,120);
    const settings=pricing.normalize({...company.settings,...input,segment,operationType});
    if (settings.taxesPct+settings.sellingFeesPct+settings.defaultMargin>=100)
      fail(400,"A soma das taxas e da margem padrão deve ser inferior a 100%.");
    const client=await getPool().connect();
    try {
      await client.query("BEGIN");
      const result=await client.query(
        "UPDATE zuz_companies SET settings=$1::jsonb,segment=$2,operation_type=$3,updated_at=NOW() WHERE id=$4 AND owner_id=$5 RETURNING settings",
        [JSON.stringify(settings),segment,operationType,company.id,req.user.id]);
      const products=await client.query("SELECT * FROM zuz_products WHERE company_id=$1",[company.id]);
      for(const row of products.rows)
        await appendRecommendation(client,company.id,row.payload && Object.keys(row.payload).length?row.payload:row,settings);
      await client.query("COMMIT");
      res.json({settings:result.rows[0].settings});
    } catch(error) {
      await client.query("ROLLBACK");
      if (error instanceof RangeError) fail(400,error.message);
      throw error;
    } finally {client.release();}
  }));
  // Histórico autenticado e isolado pelo identificador da empresa.
  router.get("/pricing/history", asyncRoute(async (req,res) => {
    const company=await getCompany(req.user.id);
    if(!company)fail(404,"Configure sua empresa.");
    const limit=Math.max(1,Math.min(100,Number.parseInt(req.query.limit,10)||30));
    const productId=normalText(req.query.productId,100);
    const rows=productId
      ? await query("SELECT id,product_id,product_name,snapshot,created_at FROM zuz_pricing_history WHERE company_id=$1 AND product_id=$2 ORDER BY id DESC LIMIT $3",[company.id,productId,limit])
      : await query("SELECT id,product_id,product_name,snapshot,created_at FROM zuz_pricing_history WHERE company_id=$1 ORDER BY id DESC LIMIT $2",[company.id,limit]);
    res.json({history:rows.rows.map(row=>({...row,snapshot:typeof row.snapshot === "string" ? JSON.parse(row.snapshot) : row.snapshot}))});
  }));

  // Registro explicito de unidades efetivamente vendidas em um mes.
  router.put("/pricing/sales", validateBody(schemas.sales), asyncRoute(async (req,res) => {
    const company=await getCompany(req.user.id);
    if(!company)fail(404,"Configure sua empresa.");
    const productId=normalText(req.body.productId,100);
    const period=normalText(req.body.period,7);
    const price=Number(req.body.averagePrice);
    const units=Number(req.body.soldUnits);
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period) || !Number.isFinite(price) ||
       price<=0 || !Number.isSafeInteger(units) || units<0 || units>1000000000)
      fail(400,"Informe mês, preço médio e unidades realmente vendidas.");
    const row=await query("SELECT id FROM zuz_products WHERE id=$1 AND company_id=$2",[productId,company.id]);
    if(!row.rows.length)fail(404,"Produto não encontrado.");
    await query(`INSERT INTO zuz_sales_observations(company_id,product_id,period,average_price,sold_units)
       VALUES($1,$2,$3,$4,$5) ON CONFLICT(company_id,product_id,period)
       DO UPDATE SET average_price=excluded.average_price,sold_units=excluded.sold_units`,
       [company.id,productId,period,price,units]);
    res.json({ok:true});
  }));

  router.get("/pricing/prediction", asyncRoute(async (req,res) => {
    const company=await getCompany(req.user.id);
    if(!company)fail(404,"Configure sua empresa.");
    const productId=normalText(req.query.productId,100);
    const rows=await query("SELECT * FROM zuz_products WHERE id=$1 AND company_id=$2",[productId,company.id]);
    if(!rows.rows.length)fail(404,"Produto não encontrado.");
    const product=rows.rows[0].payload && Object.keys(rows.rows[0].payload).length
      ? rows.rows[0].payload : rows.rows[0];
    const current=productSnapshot(product,company.settings);
    const history=await query(
      "SELECT period,average_price,sold_units FROM zuz_sales_observations WHERE company_id=$1 AND product_id=$2 ORDER BY period",
      [company.id,productId]);
    res.json(predictPrice(history.rows,{
      directCost:current.directCost,variableRatePct:current.variableRatePct,
      fixedTotal:current.fixedTotal,technicalPrice:current.technicalPrice
    }));
  }));
  router.post("/pricing/calculate", validateBody(schemas.calculate), asyncRoute(async (req,res) => {
    const company=await getCompany(req.user.id);
    if (!company) fail(404,"Configure sua empresa.");
    try { res.json(pricing.calculate({ ...req.body, settings:company.settings })); }
    catch(e){ if(e instanceof RangeError) fail(400,e.message); throw e; }
  }));
  router.put("/company/products", validateBody(schemas.products), asyncRoute(async (req,res) => {
    const company=await getCompany(req.user.id);
    if(!company)fail(404,"Configure sua empresa antes de cadastrar produtos.");
    const products=req.body.products;
    if(!Array.isArray(products)||products.length>500)fail(400,"Lista de produtos inválida.");
    const verified=products.map(item=>{
      if(!item || typeof item!=="object")fail(400,"Produto inválido.");
      const name=normalText(item.name,180),direct=money.sum([Number(item.baseCost||0),
        ...(Array.isArray(item.additionalCosts)?item.additionalCosts.map(x=>Number(x.value||0)):[])]);
      const sale=Number(item.salePrice||0),margin=Number(item.targetMargin??30),units=Number(item.units??1);
      const id=/^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(item.id||"")?item.id:crypto.randomUUID();
      const payload={...item,id};
      if(!name || !Number.isFinite(direct)||direct<0||!Number.isFinite(sale)||sale<0||!Number.isFinite(margin)||margin<0||margin>90||!Number.isInteger(units)||units<1||JSON.stringify(payload).length>1500000)fail(400,"Revise nome, custos, margem, quantidade e foto dos produtos.");
      return {name,id,direct,sale,margin,units,payload};
    });
    const client=await getPool().connect();
    try{
      await client.query("BEGIN");
      const removed=await client.query(provider === "postgresql"
        ? "SELECT id FROM zuz_products WHERE company_id=$1 AND NOT (id = ANY($2::uuid[])) AND EXISTS (SELECT 1 FROM zuz_sales s WHERE s.product_id=zuz_products.id)"
        : "SELECT id FROM zuz_products WHERE company_id=$1 AND id NOT IN (SELECT value FROM json_each($2)) AND EXISTS (SELECT 1 FROM zuz_sales s WHERE s.product_id=zuz_products.id)",
        [company.id,provider === "postgresql" ? verified.map(product=>product.id) : JSON.stringify(verified.map(product=>product.id))]);
      if(removed.rows.length)fail(409,"Este produto possui vendas registradas e não pode ser excluído.");
      // Produtos com vendas reais não podem ser apagados (histórico imutável).
      await client.query(provider === "postgresql" ? "DELETE FROM zuz_products WHERE company_id=$1 AND NOT (id = ANY($2::uuid[])) AND NOT EXISTS (SELECT 1 FROM zuz_sales s WHERE s.product_id=zuz_products.id)" : "DELETE FROM zuz_products WHERE company_id=$1 AND id NOT IN (SELECT value FROM json_each($2)) AND NOT EXISTS (SELECT 1 FROM zuz_sales s WHERE s.product_id=zuz_products.id)",
        [company.id,provider === "postgresql" ? verified.map(product=>product.id) : JSON.stringify(verified.map(product=>product.id))]);
      for(const p of verified){
        const current=await client.query("SELECT company_id FROM zuz_products WHERE id=$1",[p.id]);
        if(current.rowCount && current.rows[0].company_id!==company.id)
          fail(400,"Identificador de produto inválido.");
        await client.query(`INSERT INTO zuz_products(id,company_id,name,operation_type,category,costing_mode,inputs,direct_cost,sale_price,target_margin,units,payload)
          VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12::jsonb)
          ON CONFLICT(id) DO UPDATE SET name=excluded.name,operation_type=excluded.operation_type,
          category=excluded.category,costing_mode=excluded.costing_mode,inputs=excluded.inputs,
          direct_cost=excluded.direct_cost,sale_price=excluded.sale_price,
          target_margin=excluded.target_margin,units=excluded.units,payload=excluded.payload`,
          [p.id,company.id,p.name,company.operation_type,normalText(p.payload.category||"Sem categoria"),company.costing_mode,
           JSON.stringify(p.payload.additionalCosts||[]),p.direct,p.sale,p.margin,p.units,JSON.stringify(p.payload)]);
        await appendRecommendation(client,company.id,p.payload,company.settings);
      }
      await client.query("COMMIT");
    }catch(e){await client.query("ROLLBACK");if(e instanceof RangeError)fail(400,e.message);throw e;}
    finally{client.release();}
    res.json({ok:true,products:verified.map(p=>p.payload)});
  }));
  router.post("/company/products", validateBody(schemas.product), asyncRoute(async (req,res) => {
    const company=await getCompany(req.user.id);
    if (!company) fail(404,"Configure sua empresa.");
    const name=normalText(req.body.name,180);
    const op=normalText(req.body.operationType || company.operation_type,24);
    const direct=Number(req.body.directCost);
    const sale=Number(req.body.salePrice);
    const units=Number(req.body.units ?? 1);
    const margin=Number(req.body.targetMargin ?? 30);
    if (!name || !validOps.has(op) || !Number.isFinite(direct) || direct<0 || !Number.isFinite(sale) || sale<0 || !Number.isInteger(units) || units<1 || !Number.isFinite(margin) || margin<0 || margin>90) fail(400,"Revise os dados do produto.");
    const inputs=Array.isArray(req.body.inputs)?req.body.inputs:[];
    if (inputs.length>100 || JSON.stringify(inputs).length>16000) fail(400,"Quantidade de custos inválida.");
    const client=await getPool().connect();
    let created;
    try {
      await client.query("BEGIN");
      const row=await client.query(`INSERT INTO zuz_products(company_id,name,operation_type,category,costing_mode,inputs,direct_cost,sale_price,target_margin,units)
        VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10) RETURNING *`,
        [company.id,name,op,normalText(req.body.category||"Sem categoria"),
        normalText(req.body.costingMode||company.costing_mode,32),JSON.stringify(inputs),direct,sale,margin,units]);
      created=row.rows[0];
      await appendRecommendation(client,company.id,created,company.settings);
      await client.query("COMMIT");
    } catch(error) {
      await client.query("ROLLBACK");
      if(error instanceof RangeError)fail(400,error.message);
      throw error;
    } finally {client.release();}
    res.status(201).json({ product:created });
  }));
  registerSalesInventory(router,{asyncRoute,getCompany});
  registerCalendarRoutes(router,{asyncRoute,getCompany});
  registerSimulationRoutes(router,{asyncRoute,getCompany});
  router.use((err,req,res,_next)=>{
    console.error("Erro API ZUZ:",err.message);
    res.status(err.status || 500).json({ error:err.status?err.message:"Erro interno. Confira a configuração do servidor." });
  });
  return router;
}
module.exports={createApi};
