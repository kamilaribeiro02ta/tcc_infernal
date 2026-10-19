"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const express=require("express"),request=require("supertest");
// O processo deste arquivo usa exclusivamente um SQLite temporário.
const directory=fs.mkdtempSync(path.join(os.tmpdir(),"zuz-api-test-"));
process.env.ZUZ_SQLITE_DIRECTORY=directory;
process.env.NODE_ENV="test";
delete process.env.DATABASE_URL;
delete process.env.VERCEL;
const {createApi}=require("../server/api");
const database=require("../server/database");
const app=express();app.use(express.json());app.use("/api",createApi());
test.after(()=>{database.close();fs.rmSync(directory,{recursive:true,force:true});});

test("API: cadastro, persistência, validação e isolamento entre duas contas",async()=>{
  await request(app).get("/api/health").expect(200).expect(r=>assert.equal(r.body.database,"sqlite"));
  await request(app).get("/api/company").expect(401);
  const a=request.agent(app),b=request.agent(app);
  const credentials={name:"Empreendedor A",email:"a@example.test",password:"SenhaTeste123!"};
  await a.post("/api/auth/signup").send(credentials).expect(201).expect(r=>{
    assert.equal(r.body.user.email,credentials.email);assert.equal(r.body.user.password_hash,undefined);
    assert.ok(r.headers["set-cookie"].some(cookie=>cookie.includes("HttpOnly")));
  });
  await b.post("/api/auth/signup").send({...credentials,name:"Empreendedor B",email:"b@example.test"}).expect(201);
  await request(app).post("/api/auth/signup").send(credentials).expect(409);
  await request(app).post("/api/auth/login").send({...credentials,password:"x".repeat(257)}).expect(400).expect(r=>assert.ok(r.body.issues.some(i=>i.field==="password")));
  for(const [agent,name] of [[a,"Empresa A"],[b,"Empresa B"]])
    await agent.put("/api/company").send({name,operationType:"revenda",categories:["Custos diretos"]}).expect(200);
  await a.put("/api/company/settings").send({settings:{monthlyUnits:1,defaultMargin:0,taxesPct:0,sellingFeesPct:0,fixedCosts:[{label:"Fixo",value:"0.14"}]}}).expect(200);
  for(const value of ["",null,true,-1,"inválido"])
    await a.put("/api/company/settings").send({settings:{fixedCosts:[{label:"Inválido",value}]}}).expect(400);
  await a.post("/api/pricing/calculate").send({unitDirectCost:0,salePrice:"0.01",units:14,targetMargin:0}).expect(200).expect(r=>{
    assert.equal(r.body.breakEvenUnits,14);assert.equal(r.body.profit,0);
  });
  await a.post("/api/pricing/calculate").send({unitDirectCost:""}).expect(400);
  const created=await a.post("/api/company/products").send({name:"Produto A",directCost:0.3,salePrice:1,units:20,targetMargin:0}).expect(201);
  const id=created.body.product.id;
  await a.put("/api/company/products").send({products:[{id,name:"Produto A",baseCost:0.1,additionalCosts:[{name:"Adicional",value:0.2}],salePrice:1,units:20,targetMargin:0}]}).expect(200);
  await a.put("/api/company/products").send({products:[{id,name:"Produto A",baseCost:null}]}).expect(400);
  await a.get("/api/company").expect(200).expect(r=>assert.equal(r.body.products.length,1));
  await b.get("/api/company").expect(200).expect(r=>assert.equal(r.body.products.length,0));
  await a.get("/api/pricing/history?productId="+id).expect(200).expect(r=>{
    assert.ok(r.body.history.length>0);assert.equal(r.body.history[0].snapshot.directCost,0.3);
  });
  await b.get("/api/pricing/history?productId="+id).expect(200).expect(r=>assert.equal(r.body.history.length,0));
  await b.put("/api/pricing/sales").send({productId:id,period:"2026-09",averagePrice:1,soldUnits:10}).expect(404);
  const scenario={price:1,units:20,margin:0,changePct:0,changeMode:"variable"};
  const payload={name:"Cenários",productId:id,snapshot:{scenarios:[{...scenario,id:"conservador"},{...scenario,id:"equilibrado"},{...scenario,id:"premium"}]}};
  const saved=await a.post("/api/simulations").send(payload).expect(201);
  await b.post("/api/simulations").send(payload).expect(404);
  await b.patch("/api/simulations/"+saved.body.id).send({name:"Indevido"}).expect(404);
  await b.delete("/api/simulations/"+saved.body.id).expect(200);
  await a.get("/api/simulations").expect(200).expect(r=>assert.equal(r.body.simulations.length,1));
  await a.post("/api/auth/logout").expect(200);
  await a.get("/api/company").expect(401);
  await a.post("/api/auth/login").send(credentials).expect(200);
  await a.get("/api/company").expect(200).expect(r=>assert.equal(r.body.products.length,1));
});
