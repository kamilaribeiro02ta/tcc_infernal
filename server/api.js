"use strict";
const express = require("express");
const crypto = require("crypto");
const { promisify } = require("util");
const { query, getPool } = require("./database");
const catalog = require("../shared/business-templates");
const pricing = require("../shared/pricing-core");
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
function createApi() {
  const router = express.Router();
  router.get("/health", (_req, res) => res.json({ ok: true, app: "ZUZ", databaseConfigured: true, database: "sqlite" }));
  router.post("/auth/signup", asyncRoute(async (req, res) => {
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
    } catch (e) { if (e.code === "SQLITE_CONSTRAINT_UNIQUE" || e.code === "SQLITE_CONSTRAINT_PRIMARYKEY") fail(409, "Já existe uma conta com esse e-mail."); throw e; }
    const user = created.rows[0]; await session(req,res,user);
    res.status(201).json({ user: safeUser(user), company: null });
  }));
  router.post("/auth/login", asyncRoute(async (req, res) => {
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
  router.use(asyncRoute(async (req,res,next) => {
    const user = await getUser(req);
    if (!user) fail(401,"Faça login para continuar.");
    req.user = user; next();
  }));
  router.get("/me", asyncRoute(async (req,res) => res.json({ user:safeUser(req.user),company:await getCompany(req.user.id) })));
  router.get("/templates", (_req,res) => res.json(catalog));
  router.get("/company", asyncRoute(async (req,res) => {
    const company=await getCompany(req.user.id);
    if (!company) return res.json({ company:null, categories:[], products:[] });
    const [categories,products]=await Promise.all([
      query("SELECT id,label,cost_type,unit FROM zuz_cost_categories WHERE company_id=$1 ORDER BY label",[company.id]),
      query("SELECT * FROM zuz_products WHERE company_id=$1 ORDER BY created_at DESC",[company.id])
    ]);
    res.json({ company, categories:categories.rows, products:products.rows.map(row=>row.payload && Object.keys(row.payload).length ? row.payload : row) });
  }));
  router.put("/company", asyncRoute(async (req,res) => {
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
      await client.query("DELETE FROM zuz_cost_categories WHERE company_id=$1 AND label NOT IN (SELECT value FROM json_each($2))",[company.id,JSON.stringify(unique)]);
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
  router.put("/company/settings", asyncRoute(async (req,res) => {
    const company=await getCompany(req.user.id);
    if (!company) fail(404,"Configure sua empresa antes de salvar os custos.");
    const settings=req.body.settings;
    if (!settings || typeof settings!=="object" || Array.isArray(settings) || JSON.stringify(settings).length>32000) fail(400,"Configurações inválidas.");
    const result=await query("UPDATE zuz_companies SET settings=$1::jsonb,updated_at=NOW() WHERE id=$2 AND owner_id=$3 RETURNING settings",[JSON.stringify(settings),company.id,req.user.id]);
    res.json({ settings:result.rows[0].settings });
  }));
  router.post("/pricing/calculate", asyncRoute(async (req,res) => {
    const company=await getCompany(req.user.id);
    if (!company) fail(404,"Configure sua empresa.");
    try { res.json(pricing.calculate({ ...req.body, settings:company.settings })); }
    catch(e){ if(e instanceof RangeError) fail(400,e.message); throw e; }
  }));
  router.put("/company/products", asyncRoute(async (req,res) => {
    const company=await getCompany(req.user.id);
    if(!company)fail(404,"Configure sua empresa antes de cadastrar produtos.");
    const products=req.body.products;
    if(!Array.isArray(products)||products.length>500)fail(400,"Lista de produtos inválida.");
    const verified=products.map(item=>{
      if(!item || typeof item!=="object")fail(400,"Produto inválido.");
      const name=normalText(item.name,180),direct=Number(item.baseCost||0)
        +(Array.isArray(item.additionalCosts)?item.additionalCosts.reduce((sum,x)=>sum+Number(x.value||0),0):0);
      const sale=Number(item.salePrice||0),margin=Number(item.targetMargin??30),units=Number(item.units??1);
      const id=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id||"")?item.id:crypto.randomUUID();
      const payload={...item,id};
      if(!name || !Number.isFinite(direct)||direct<0||!Number.isFinite(sale)||sale<0||!Number.isFinite(margin)||margin<0||margin>90||!Number.isInteger(units)||units<1||JSON.stringify(payload).length>1500000)fail(400,"Revise nome, custos, margem, quantidade e foto dos produtos.");
      return {name,id,direct,sale,margin,units,payload};
    });
    const client=await getPool().connect();
    try{
      await client.query("BEGIN");
      await client.query("DELETE FROM zuz_products WHERE company_id=$1",[company.id]);
      for(const p of verified){
        await client.query(`INSERT INTO zuz_products(id,company_id,name,operation_type,category,costing_mode,inputs,direct_cost,sale_price,target_margin,units,payload)
        VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12::jsonb)`,
        [p.id,company.id,p.name,company.operation_type,normalText(p.payload.category||"Sem categoria"),company.costing_mode,
         JSON.stringify(p.payload.additionalCosts||[]),p.direct,p.sale,p.margin,p.units,JSON.stringify(p.payload)]);
      }
      await client.query("COMMIT");
    }catch(e){await client.query("ROLLBACK");throw e;}
    finally{client.release();}
    res.json({ok:true,products:verified.map(p=>p.payload)});
  }));
  router.post("/company/products", asyncRoute(async (req,res) => {
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
    const row=await query(`INSERT INTO zuz_products(company_id,name,operation_type,category,costing_mode,inputs,direct_cost,sale_price,target_margin,units)
      VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10) RETURNING *`,
      [company.id,name,op,normalText(req.body.category||"Sem categoria"),normalText(req.body.costingMode||company.costing_mode,32),JSON.stringify(inputs),direct,sale,margin,units]);
    res.status(201).json({ product:row.rows[0] });
  }));
  router.use((err,req,res,_next)=>{
    console.error("Erro API ZUZ:",err.message);
    res.status(err.status || 500).json({ error:err.status?err.message:"Erro interno. Confira a configuração do servidor." });
  });
  return router;
}
module.exports={createApi};
