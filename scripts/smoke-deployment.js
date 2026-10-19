"use strict";
const assert=require("node:assert/strict");
async function main(){
 const base=new URL(process.env.ZUZ_DEPLOYMENT_URL||"");
 if(base.protocol!=="https:"||!base.hostname.endsWith(".vercel.app")||base.username||base.password||base.port||base.search||base.hash)
  throw Error("URL de implantação inválida.");
 const headers={Accept:"application/json"};
 if(process.env.VERCEL_AUTOMATION_BYPASS_SECRET){
  // Enviar a credencial apenas às implantações da equipe deste repositório.
  if(!base.hostname.endsWith("-kamillas-projects-4205a3d1.vercel.app"))throw Error("BYPASS_ORIGIN_NOT_AUTHORIZED");
  headers["x-vercel-protection-bypass"]=process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
 }
 const response=await fetch(new URL("/api/health",base),{headers,redirect:"manual",signal:AbortSignal.timeout(20000)});
 if(response.status>=300&&response.status<400&&/sso|vercel\.com\/login/i.test(response.headers.get("location")||""))
  throw Error("DEPLOYMENT_PROTECTED: redirecionamento de autenticação");
 if([401,403].includes(response.status))throw Error("DEPLOYMENT_PROTECTED: HTTP "+response.status);
 if(response.status!==200)throw Error("BACKEND_HTTP_"+response.status);
 const result=await response.json();
 assert.equal(result.ok,true);assert.equal(result.app,"ZUZ");assert.equal(result.database,"postgresql");assert.equal(result.schemaReady,true);
 const revision=process.env.ZUZ_EXPECTED_REVISION;
 if(revision&&result.revision!==revision)throw Error("REVISION_MISMATCH: esperado "+revision+", recebido "+String(result.revision));
 console.log(JSON.stringify({ok:true,database:result.database,schemaReady:result.schemaReady,revision:result.revision}));
}
if(require.main===module)main().catch(error=>{console.error("A implantação não passou na verificação pública de saúde/versão:",error.message);process.exitCode=1;});
module.exports={main};
