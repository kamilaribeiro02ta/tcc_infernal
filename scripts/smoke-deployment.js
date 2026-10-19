"use strict";
const assert=require("node:assert/strict");
async function main(){
 const base=new URL(process.env.ZUZ_DEPLOYMENT_URL||"");
 if(base.protocol!=="https:"||!base.hostname.endsWith(".vercel.app")||base.username||base.password||base.port||base.search||base.hash)
  throw Error("URL de implantação inválida.");
 const response=await fetch(new URL("/api/health",base),{redirect:"error",signal:AbortSignal.timeout(20000)});
 assert.equal(response.status,200,"Endpoint de saúde não respondeu 200.");
 const result=await response.json();
 assert.equal(result.ok,true);assert.equal(result.app,"ZUZ");assert.equal(result.database,"postgresql");assert.equal(result.schemaReady,true);
 const revision=process.env.ZUZ_EXPECTED_REVISION;
 if(revision)assert.equal(result.revision,revision,"A implantação não corresponde ao commit verificado.");
 console.log(JSON.stringify({ok:true,database:result.database,schemaReady:result.schemaReady,revision:result.revision}));
}
if(require.main===module)main().catch(()=>{console.error("A implantação não passou na verificação pública de saúde/versão. Confira permissões de acesso, banco e migrações.");process.exitCode=1;});
module.exports={main};
