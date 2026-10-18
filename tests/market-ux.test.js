"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const code=fs.readFileSync(path.resolve(__dirname,"../shared/market-ui-v2.js"),"utf8");
class FakeNode{
 constructor(tag){this.tag=tag;this.className="";this.children=[];this.handlers={};this.textContent="";this.value="";this.hidden=false;this.parentElement=null;this.dataset={};}
 append(...items){for(const item of items){if(item instanceof FakeNode)item.parentElement=this;this.children.push(item);}}
 replaceChildren(...items){this.children=[];this.append(...items);}
 after(node){const i=this.parentElement.children.indexOf(this);this.parentElement.children.splice(i+1,0,node);node.parentElement=this.parentElement;}
 insertBefore(node,reference){const i=this.children.indexOf(reference);this.children.splice(i<0?this.children.length:i,0,node);node.parentElement=this;}
 addEventListener(type,fn){(this.handlers[type]??=[]).push(fn);}
 setAttribute(name,val){this[name]=val;}focus(){}closest(){return this.parentElement;}
 querySelectorAll(selector){return selector==="details[open]"?this.all(x=>x.tag==="details"&&x.open):[];}
 querySelector(selector){return this.find(x=>x.tag===selector);}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this);}
 find(fn){if(fn(this))return this;for(const el of this.children){const found=el?.find?.(fn);if(found)return found;}return null;}
 all(fn){return [...(fn(this)?[this]:[]),...this.children.flatMap(x=>x?.all?.(fn)||[])];}
}
function setup(request,timer=setTimeout){
 const host=new FakeNode("div"),mount=new FakeNode("div");host.append(mount);
 const events=[],window={ZUZAPI:{request},location:{href:""},dispatchEvent:e=>{events.push(e);e.detail.accepted=true;}};
 const document={createElement:t=>new FakeNode(t),getElementById:id=>id==="marketSearchMount"?mount:null};
 vm.runInNewContext(code,{window,document,CustomEvent:class{constructor(type,arg){this.type=type;this.detail=arg.detail;}},URL,AbortController,URLSearchParams,sessionStorage:{setItem(){}},Date,Intl,setTimeout:timer,clearTimeout});
 return {root:host.find(x=>x.className==="zm-search-shell"),host,events,window};
}
const ID="a".repeat(32),QID="b".repeat(32);
const offer={id:QID,title:"Vassoura de piaçava",price:14.9,seller:"Loja A",currency:"BRL",source:"Open Prices",sourceCode:"openprices",sourceRef:"123",url:"https://prices.openfoodfacts.org/api/v1/prices/123",observedAt:"2026-10-17",queriedAt:"2026-10-18",verified:true,comparison:"gtin",item:{id:ID,name:"Vassoura",barcode:"7891234567895",attributes:{}}};
async function search(root,term="vassoura"){
 root.find(x=>x.className==="zm-search-input").value=term;
 await root.find(x=>x.tag==="form").handlers.submit[0]({preventDefault(){}});
}
test("consulta fontes em paralelo mesmo com catálogo; preços ficam na própria página",async()=>{
 const calls=[];const {root,host,window}=setup(async(_,url)=>{calls.push(url);return url.includes("/references")?{references:[offer],catalog:[]}:{enabled:true,offers:[{...offer,id:"shop",source:"Shopping",verified:false,comparison:"possivel_similar"}]};});
 await search(root);assert.equal(calls.length,2);assert.equal(root.all(x=>x.className==="zm-offer").length,2);assert.equal(host.all(x=>x.className==="zm-overlay").length,0);assert.equal(window.location.href,"");
 const d=root.find(x=>x.className==="zm-offer");d.open=true;d.handlers.toggle[0]();assert.ok(d.find(x=>x.textContent==="Custos de aquisição"));assert.equal(root.all(x=>x.className==="zm-offer").length,2);
});
test("falha parcial preserva ofertas e oferece precificação manual",async()=>{
 const {root}=setup(async(_,url)=>{if(url.includes("/references"))throw Error("offline");return {enabled:true,offers:[offer]};});
 await search(root);assert.equal(root.all(x=>x.className==="zm-offer").length,1);assert.ok(root.find(x=>x.className==="zm-source-status"||x.className.includes("zm-source-status")).textContent.includes("referências salvas"));assert.ok(root.find(x=>x.textContent==="Precificar manualmente"));
});
test("ausência de preços não apresenta catálogo como oferta",async()=>{
 const {root}=setup(async(_,url)=>url.includes("/references")?{references:[],catalog:[offer.item]}:{enabled:false,offers:[]});
 await search(root);assert.equal(root.all(x=>x.className==="zm-offer").length,0);assert.ok(root.find(x=>x.className==="zm-status").textContent.includes("Não encontramos preços verificáveis"));assert.equal(root.find(x=>x.className==="zm-catalog").hidden,false);
});
test("requisição que nunca responde termina e libera a interface",async()=>{
 const {root}=setup(()=>new Promise(()=>{}),(fn)=>setTimeout(fn,5));await search(root);
 assert.equal(root["aria-busy"],"false");assert.ok(root.find(x=>x.className==="zm-status").textContent.includes("Não foi possível concluir"));
});
test("cancelamento ignora respostas atrasadas e nova busca preserva só resultados atuais",async()=>{
 let finish;const pending=new Promise(resolve=>finish=resolve);let slow=true;
 const {root}=setup(async()=>slow?pending:{enabled:true,offers:[],references:[],catalog:[]});
 const first=search(root);root.find(x=>x.tag==="button"&&x.textContent==="Cancelar").handlers.click[0]();slow=false;await search(root,"arroz");finish({offers:[offer],references:[offer]});await first;
 assert.equal(root.all(x=>x.className==="zm-offer").length,0);assert.equal(root["aria-busy"],"false");
});
test("simulação valida a cotação no servidor antes da utilização",async()=>{
 const {root,events}=setup(async(method,url)=>method==="POST"?{reference:{marketQuoteId:QID,verified:true,price:14.9}}:url.includes("/references")?{references:[offer]}:{offers:[]});
 await search(root);const d=root.find(x=>x.className==="zm-offer");d.open=true;d.handlers.toggle[0]();
 d.find(x=>x.textContent==="Usar na simulação").handlers.click[0]();await d.find(x=>x.textContent==="Confirmar").handlers.click[0]();assert.equal(events.length,1);assert.equal(events[0].type,"zuz:market:reference");
});
