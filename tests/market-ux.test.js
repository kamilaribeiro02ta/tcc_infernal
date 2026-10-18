"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const code=fs.readFileSync(path.resolve(__dirname,"../shared/market-ui-v2.js"),"utf8");
class FakeNode{
 constructor(tag){this.tag=tag;this.className="";this.children=[];this.handlers={};this.textContent="";this.value="";this.hidden=false;this.parentElement=null;}
 append(...items){for(const item of items){if(item instanceof FakeNode)item.parentElement=this;this.children.push(item);}}
 replaceChildren(...items){this.children=[];this.append(...items);}
 after(node){const i=this.parentElement.children.indexOf(this);this.parentElement.children.splice(i+1,0,node);node.parentElement=this.parentElement;}
 insertBefore(node,reference){const i=this.children.indexOf(reference);this.children.splice(i<0?this.children.length:i,0,node);node.parentElement=this;}
 addEventListener(type,fn){(this.handlers[type]??=[]).push(fn);}
 setAttribute(name,val){this[name]=val;}focus(){}closest(){return this.parentElement;}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this);}
 find(fn){if(fn(this))return this;for(const el of this.children){const found=el?.find?.(fn);if(found)return found;}return null;}
 all(fn){return [...(fn(this)?[this]:[]),...this.children.flatMap(x=>x?.all?.(fn)||[])];}
}
function setup(mode,request){
 const host=new FakeNode("div"),control=new FakeNode("div"),name=new FakeNode("input"),market=new FakeNode("div"),marketMount=new FakeNode("div");
 host.append(control);control.append(name);host.append(marketMount,market);
 const events=[],window={ZUZAPI:{request},location:{href:""},dispatchEvent:e=>{events.push(e);if(e.type==="zuz:market:reference")e.detail.accepted=true;}};
 const document={createElement:t=>new FakeNode(t),getElementById:id=>id==="nameInput"&&mode==="products"?name:id==="marketSearchMount"&&mode==="simulations"?marketMount:id==="marketStats"&&mode==="simulations"?market:null};
 vm.runInNewContext(code,{window,document,CustomEvent:class{constructor(type,arg){this.type=type;this.detail=arg.detail;}},URLSearchParams,sessionStorage:{setItem(){},getItem(){return null}},console,Date,Intl});
 return {root:host.find(x=>x.className==="zm-search-shell"),host,events};
}
const ID="a".repeat(32),QID="b".repeat(32);
async function search(root,q){
 root.find(x=>x.tag==="input"&&x.type==="search").value=q;
 await root.find(x=>x.tag==="form").handlers.submit[0]({preventDefault(){}});
}
test("vassoura: poucas referências úteis, preço ausente claramente indicado",async()=>{
 const requests=[],api=async(_method,url)=>{
  requests.push(url);
  if(url.includes("/market/v2/search"))return url.includes("historical=true")?
   {commercial:[],archived:[{item_id:ID,display_name:"Vassoura",full_name:"VASSOURA, CERDAS AÇO, CABO MADEIRA",is_historical:true}]}:{commercial:[]};
  if(url.includes("/market/v2/item"))return {item:{id:ID,name:"Vassoura de aço",type:"product",attributes:{},isHistorical:true}};
  if(url.includes("/market/quotes"))return {commercial:{offers:[],summary:null},quotes:[]};
  throw Error("Rota inesperada "+url);
 };
 const {root}=setup("products",api);
 assert.ok(root);
 await search(root,"vassoura");
 const results=root.all(x=>x.tag==="button"&&x.className.includes("zm-result"));
 assert.equal(results.length,1);
 assert.equal(root.all(x=>x.textContent?.includes?.("2018")).length,0);
 await results[0].handlers.click[0]();
 assert.equal(root.find(x=>x.className==="zm-detail").hidden,false);
 assert.ok(root.all(x=>x.textContent?.includes?.("não há cotação comercial verificável")).length);
 assert.equal(requests.filter(x=>x.includes("/market/offers")).length,1);
 assert.equal(requests.filter(x=>x.includes("/market/keepa")).length,0);
});
test("cotações confirmadas são utilizáveis na simulação sem alterar custos",async()=>{
 const quote={id:QID,price:24.9,seller:"Loja conferida",region:"SP",
  observedAt:"2026-10-18T10:00:00Z",url:"https://prices.openfoodfacts.org/api/v1/prices/123"};
 const api=async(method,url)=>{
  if(url.includes("/market/v2/search"))return {commercial:[{item_id:ID,display_name:"Biscoito Marca A 200g",brand:"Marca A",barcode:"7891234567895"}]};
  if(url.includes("/market/v2/item"))return {item:{id:ID,name:"Biscoito Marca A 200g",type:"product",barcode:"7891234567895",attributes:{}}};
  if(url.includes("/market/quotes"))return {commercial:{offers:[quote],summary:null},quotes:[]};
  if(method==="POST"&&url==="/market/reference/verify")return {reference:{marketQuoteId:QID,marketProductId:ID,verified:true,price:24.9}};
  throw Error("Rota inesperada "+url);
 };
 const {root,events}=setup("simulations",api);
 await search(root,"biscoito");
 const product=root.find(x=>x.tag==="button"&&x.className.includes("zm-result"));
 assert.ok(product);await product.handlers.click[0]();
 const action=root.find(x=>x.tag==="button"&&x.textContent==="Usar na simulação");
 assert.ok(action);action.handlers.click[0]();
 const confirm=root.find(x=>x.tag==="button"&&x.textContent==="Confirmar");
 assert.ok(confirm);await confirm.handlers.click[0]();
 assert.equal(events.filter(x=>x.type==="zuz:market:reference").length,1);
 assert.ok(root.all(x=>x.textContent==="Referência adicionada à simulação.").length);
});

test("produto moderno: anúncio semelhante visível, mas preço não vira média ou custo",async()=>{
 const api=async(_method,url)=>{
  if(url.includes("/market/v2/search"))return {commercial:[]};
  if(url.includes("/market/offers"))return {offers:[{title:"Celular Modelo X 128 GB",price:1599.9,
   seller:"Loja de exemplo",url:"https://example.com/celular",queriedAt:"2026-10-18T12:00:00Z"}]};
  throw Error("Rota inesperada "+url);
 };
 const {root,events}=setup("products",api);
 await search(root,"celular modelo x");
 const offer=root.find(x=>x.tag==="button"&&x.className.includes("zm-result"));
 assert.ok(offer);await offer.handlers.click[0]();
 assert.ok(root.all(x=>x.textContent?.includes?.("Preço anunciado")).length);
 assert.equal(root.all(x=>x.className==="zm-price-stats").length,0);
 const draft=root.find(x=>x.tag==="button"&&x.textContent==="Cadastrar com este nome");
 assert.ok(draft);draft.handlers.click[0]();
 const confirm=root.find(x=>x.tag==="button"&&x.textContent==="Confirmar");
 assert.ok(confirm);confirm.handlers.click[0]();
 assert.equal(events.filter(x=>x.type==="zuz:market:draft").length,1);
 assert.equal(events.find(x=>x.type==="zuz:market:draft").detail.price,undefined);
});

test("janela focada: pesquisa acessível e fechamento sem poluir a página",async()=>{
 const calls=[];
 const api=async(_method,url)=>{
  calls.push(url);
  if(url.includes("/market/v2/search"))return {commercial:[]};
  if(url.includes("/market/offers"))return {offers:[]};
  return {archived:[]};
 };
 const {root,host}=setup("products",api);
 const launcher=host.find(x=>x.className.includes("zm-launcher"));
 assert.ok(launcher);
 const overlay=host.find(x=>x.className==="zm-overlay");
 assert.ok(overlay);
 assert.equal(overlay.hidden,true);
 const publicInput=launcher.find(x=>x.className==="zm-launch-input");
 publicInput.value="vassoura";
 await launcher.find(x=>x.tag==="button"&&x.className==="zm-launch-submit").handlers.click[0]();
 assert.equal(overlay.hidden,false);
 assert.equal(root.find(x=>x.className==="zm-welcome").hidden,true);
 const close=overlay.find(x=>x.className==="zm-close");
 close.handlers.click[0]();
 assert.equal(overlay.hidden,true);
});
test("detalhes fiscais e históricos permanecem recolhidos ao selecionar produto",async()=>{
 const api=async(_method,url)=>{
  if(url.includes("/market/v2/search"))return {commercial:[{item_id:ID,display_name:"Macarrão",barcode:"7890000000001"}]};
  if(url.includes("/market/v2/item"))return {item:{id:ID,name:"Macarrão",type:"product",barcode:"7890000000001",attributes:{}}};
  if(url.includes("/market/quotes"))return {commercial:{offers:[],summary:null},quotes:[]};
  throw Error("Rota inesperada "+url);
 };
 const {root}=setup("simulations",api);
 await search(root,"macarrão");
 const found=root.find(x=>x.className?.includes("zm-result")&&x.tag==="button");
 await found.handlers.click[0]();
 const more=root.find(x=>x.className==="zm-more");
 assert.ok(more);
 assert.equal(more.open,undefined);
 assert.equal(root.find(x=>x.className==="zm-detail").hidden,false);
});
