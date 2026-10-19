"use strict";
const fs=require("node:fs"),path=require("node:path"),{spawnSync}=require("node:child_process");
const root=path.resolve(__dirname,"..");let checked=0;
function check(directory){for(const item of fs.readdirSync(directory,{withFileTypes:true})){
 if(item.name.startsWith(".")||["node_modules","data"].includes(item.name))continue;
 const file=path.join(directory,item.name);
 if(item.isDirectory())check(file);
 else if(item.name.endsWith(".js")){
  const result=spawnSync(process.execPath,["--check",file],{encoding:"utf8"});
  if(result.status!==0){process.stderr.write(result.stderr);process.exit(1);}checked++;
 }
}}
check(root);console.log("Sintaxe verificada em "+checked+" arquivos JavaScript.");
