"use strict";
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),check=process.argv.includes("--check");
const normalized=buffer=>buffer.toString("utf8").replace(/\r\n/g,"\n");
const pairs=[["node_modules/decimal.js/decimal.js","shared/vendor/decimal.js"],["node_modules/decimal.js/LICENCE.md","shared/vendor/decimal-LICENCE.md"]];
for(const [source,target] of pairs){
  const input=fs.readFileSync(path.join(root,source)),destination=path.join(root,target);
  if(check){
    if(!fs.existsSync(destination)||normalized(input)!==normalized(fs.readFileSync(destination)))throw new Error("Atualize "+target+" com npm run vendor:sync.");
  }else{
    fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,input);
  }
}
