"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {main}=require("../scripts/smoke-deployment");
test("verificação publicada: segredo não é enviado a uma origem de outra equipe",async()=>{
 const previous={...process.env},fetch=global.fetch;
 try{
  process.env.ZUZ_DEPLOYMENT_URL="https://attacker.vercel.app";process.env.VERCEL_AUTOMATION_BYPASS_SECRET="fixture-secret";
  global.fetch=async()=>{throw Error("Não deveria fazer a requisição");};
  await assert.rejects(main(),/BYPASS_ORIGIN_NOT_AUTHORIZED/);
 }finally{process.env=previous;global.fetch=fetch;}
});
test("verificação publicada: proteção de acesso e revisão incorreta não viram sucesso",async()=>{
 const previous={...process.env},fetch=global.fetch;
 try{
  process.env.ZUZ_DEPLOYMENT_URL="https://tcc-infernal-fixture-kamillas-projects-4205a3d1.vercel.app";
  delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  global.fetch=async()=>new Response("",{status:401});await assert.rejects(main(),/DEPLOYMENT_PROTECTED/);
  process.env.ZUZ_EXPECTED_REVISION="a".repeat(40);
  global.fetch=async()=>new Response(JSON.stringify({ok:true,app:"ZUZ",database:"postgresql",schemaReady:true,revision:"b".repeat(40)}));
  await assert.rejects(main(),/REVISION_MISMATCH/);
 }finally{process.env=previous;global.fetch=fetch;}
});
test("verificação publicada: confirma banco/esquema/commit com credencial opcional somente no header",async()=>{
 const previous={...process.env},fetch=global.fetch;
 try{
  process.env.ZUZ_DEPLOYMENT_URL="https://tcc-infernal-fixture-kamillas-projects-4205a3d1.vercel.app";
  process.env.ZUZ_EXPECTED_REVISION="a".repeat(40);process.env.VERCEL_AUTOMATION_BYPASS_SECRET="fixture-secret";
  global.fetch=async(url,options)=>{
   assert.equal(options.headers["x-vercel-protection-bypass"],"fixture-secret");assert.ok(!url.href.includes("fixture-secret"));assert.equal(options.redirect,"manual");
   return new Response(JSON.stringify({ok:true,app:"ZUZ",database:"postgresql",schemaReady:true,revision:"a".repeat(40)}));
  };
  await main();
 }finally{process.env=previous;global.fetch=fetch;}
});
