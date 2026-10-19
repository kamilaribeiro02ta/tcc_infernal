"use strict";
// Este comando é exclusivo para um PostgreSQL descartável de CI.
const fs=require("node:fs"),path=require("node:path");
const {Client}=require("pg");
const express=require("express"),request=require("supertest"),assert=require("node:assert/strict");
async function main(){
 const connectionString=process.env.ZUZ_TEST_DATABASE_URL;
 if(!connectionString)throw Error("ZUZ_TEST_DATABASE_URL obrigatória.");
 const url=new URL(connectionString);
 if(!["localhost","127.0.0.1","postgres"].includes(url.hostname)||!/^\/zuz_test(?:_[a-z0-9]+)?$/.test(url.pathname))
  throw Error("Teste permitido apenas em banco zuz_test de PostgreSQL local/CI.");
 const client=new Client({connectionString});await client.connect();
 try{
  const root=path.resolve(__dirname,"../db");
  await client.query(fs.readFileSync(path.join(root,"schema.sql"),"utf8"));
  for(const file of fs.readdirSync(path.join(root,"migrations")).filter(x=>x.endsWith(".sql")).sort())
   await client.query(fs.readFileSync(path.join(root,"migrations",file),"utf8"));
  // A nova migração deve poder ser reaplicada.
  await client.query(fs.readFileSync(path.join(root,"migrations/007-market-research.sql"),"utf8"));
  process.env.DATABASE_URL=connectionString;process.env.NODE_ENV="test";
  delete process.env.VERCEL;delete process.env.ZUZ_BDC_ENABLED;
  // CI não depende de disponibilidade ou consumo de APIs comerciais/públicas.
  require("../server/market-discovery").lookup=async()=>({warnings:[]});
  const {createApi}=require("../server/api"),database=require("../server/database");
  const app=express();app.use(express.json());app.use("/api",createApi());
  try{
   await request(app).get("/api/health").expect(200).expect(r=>{assert.equal(r.body.database,"postgresql");assert.equal(r.body.schemaReady,true);});
   await request(app).get("/api/backend/status").expect(401);
   const credentials={name:"CI",email:"ci-"+Date.now()+"@example.test",password:"TesteSeguro123!"},agent=request.agent(app);
   await agent.post("/api/auth/signup").send(credentials).expect(201);
   await agent.put("/api/company").send({name:"Empresa CI",operationType:"revenda",categories:["Custo"]}).expect(200);
   const product=await agent.post("/api/company/products").send({name:"Produto CI",directCost:10,salePrice:20,units:10}).expect(201);
   const id=product.body.product.id;
   await agent.post("/api/pricing/calculate").send({unitDirectCost:10,salePrice:20,units:10,targetMargin:30}).expect(200).expect(r=>assert.equal(r.body.directCost,10));
   const scenario={price:20,units:10,margin:30,changePct:0,changeMode:"variable"};
   await agent.post("/api/simulations").send({name:"CI",productId:id,snapshot:{scenarios:[{...scenario,id:"conservador"},{...scenario,id:"equilibrado"},{...scenario,id:"premium"}]}}).expect(201);
   await agent.get("/api/simulations").expect(200).expect(r=>assert.equal(r.body.simulations.length,1));
   await agent.get("/api/backend/status").expect(200).expect(r=>{assert.equal(r.body.counts.historical_research,0);assert.equal(r.body.sources.bigdatacorp.status,"disabled");});
   await agent.get("/api/market/references?q=consulta%20sem%20fonte").expect(200).expect(r=>assert.deepEqual(r.body.references,[]));
   await agent.get("/api/market/research?q=produto").expect(200).expect(r=>assert.equal(r.body.usableForMarketPricing,false));
   await agent.post("/api/auth/logout").expect(200);
   await agent.post("/api/auth/login").send(credentials).expect(200);
   await agent.get("/api/company").expect(200).expect(r=>assert.equal(r.body.products.length,1));
   console.log("PostgreSQL: migrações, autenticação, persistência, precificação, simulações e consulta verificadas.");
  }finally{await database.getPool().end();}
 }finally{await client.end();}
}
if(require.main===module)main().catch(error=>{console.error("Falha na verificação PostgreSQL:",error.message.replace(/postgres(?:ql)?:\/\/\S+/g,"[conexão omitida]"));process.exitCode=1;});
module.exports={main};
