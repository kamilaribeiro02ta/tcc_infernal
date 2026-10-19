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
 const events=[],sessionWrites=[],window={ZUZAPI:{request},location:{href:""},dispatchEvent:e=>{events.push(e);e.detail.accepted=true;}};
 const document={createElement:t=>new FakeNode(t),getElementById:id=>id==="marketSearchMount"?mount:null};
 vm.runInNewContext(code,{window,document,CustomEvent:class{constructor(type,arg){this.type=type;this.detail=arg.detail;}},URL,AbortController,URLSearchParams,sessionStorage:{setItem(key,value){sessionWrites.push({key,value});}},Date,Intl,setTimeout:timer,clearTimeout});
 return {root:host.find(x=>x.className==="zm-search-shell"),host,events,window,sessionWrites};
}
const ID="a".repeat(32),QID="b".repeat(32);
const offer={id:QID,title:"Vassoura de piaçava",price:14.9,seller:"Loja A",currency:"BRL",source:"Open Prices",sourceCode:"openprices",sourceRef:"123",url:"https://prices.openfoodfacts.org/api/v1/prices/123",observedAt:"2026-10-17",queriedAt:"2026-10-18",verified:true,comparison:"gtin",item:{id:ID,name:"Vassoura",barcode:"7891234567895",attributes:{}}};
async function search(root,term="vassoura"){
 root.find(x=>x.className==="zm-search-input").value=term;
 await root.find(x=>x.tag==="form").handlers.submit[0]({preventDefault(){}});
}
test("consulta referências sem chamar provedores removidos; preços ficam na própria página",async()=>{
 const calls=[];const {root,host,window}=setup(async(_,url)=>{calls.push(url);return url.includes("/references")?{references:[offer],catalog:[]}:{enabled:true,offers:[{...offer,id:"shop",source:"Shopping",verified:false,comparison:"possivel_similar"}]};});
 await search(root);assert.equal(calls.length,1);assert.ok(calls[0].includes("/market/references"));assert.equal(root.all(x=>x.className==="zm-offer").length,1);assert.equal(host.all(x=>x.className==="zm-overlay").length,0);assert.equal(window.location.href,"");
 const d=root.find(x=>x.className==="zm-offer");d.open=true;d.handlers.toggle[0]();assert.ok(d.find(x=>x.textContent==="Custos de aquisição"));assert.equal(root.all(x=>x.className==="zm-offer").length,1);
});
test("falha nas referências libera a tela e oferece precificação manual",async()=>{
 const {root}=setup(async()=>{throw Error("offline");});
 await search(root);assert.equal(root.all(x=>x.className==="zm-offer").length,0);assert.ok(root.find(x=>x.className==="zm-source-status"||x.className.includes("zm-source-status")).textContent.includes("referências salvas"));assert.ok(root.find(x=>x.textContent==="Precificar manualmente"));assert.equal(root["aria-busy"],"false");
});
test("ausência de preços não apresenta catálogo como oferta",async()=>{
 const {root}=setup(async(_,url)=>url.includes("/references")?{references:[],catalog:[offer.item]}:{enabled:false,offers:[]});
 await search(root);assert.equal(root.all(x=>x.className==="zm-offer").length,0);assert.ok(root.find(x=>x.className==="zm-status").textContent.includes("Preço indisponível"));assert.equal(root.find(x=>x.className==="zm-catalog").hidden,false);
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
test("consulta mostra oito referências por vez sem descartar as demais",async()=>{
 const {root}=setup(async(_,url)=>url.includes("/references")?{references:Array.from({length:12},(_,i)=>({...offer,id:String(i),unit:"un"}))}:{offers:[]});await search(root);
 assert.equal(root.all(x=>x.className==="zm-offer").length,8);
 root.find(x=>x.tag==="button"&&x.textContent==="Ver mais referências (4)").handlers.click[0]();assert.equal(root.all(x=>x.className==="zm-offer").length,12);
});
test("valores privados ausentes não viram zero e simulação exige valores explícitos",async()=>{
 const {root}=setup(async(_,url)=>url.includes("/references")?{references:[{...offer,unit:"un"}]}:{offers:[]});await search(root);
 const d=root.find(x=>x.className==="zm-offer");d.open=true;d.handlers.toggle[0]();
 const finance=d.find(x=>x.className==="zm-financial-facts");assert.equal(finance.all(x=>x.tag==="dd"&&x.textContent==="Indisponível na fonte").length,4);
 const calc=d.find(x=>x.tag==="button"&&x.textContent==="Calcular");calc.handlers.click[0]();assert.ok(d.find(x=>x.className==="zm-error").textContent.includes("três valores"));
});
test("registro público antigo mantém o aviso de idade visível",async()=>{
 const {root}=setup(async(_,url)=>url.includes("/references")?{references:[{...offer,priceType:"public_purchase",stale:true}]}:{offers:[]});await search(root);assert.ok(root.find(x=>x.className==="zm-kind").textContent.includes("observação antiga"));
});
test("Comparar é um único botão com estado acessível, sem checkbox solto",async()=>{
 const {root}=setup(async(_,url)=>url.includes('/references')?{references:[offer,{...offer,id:'outro',seller:'Loja B'}]}:{offers:[]});await search(root);
 const toggles=root.all(x=>x.tag==='button'&&x.className.includes('zm-compare-toggle'));assert.equal(toggles.length,2);assert.equal(root.all(x=>x.tag==='input'&&x.type==='checkbox').length,0);
 assert.equal(toggles[0]['aria-pressed'],'false');toggles[0].handlers.click[0]();assert.equal(toggles[0]['aria-pressed'],'true');toggles[1].handlers.click[0]();assert.equal(root.find(x=>x.className==='zm-comparison').hidden,false);
});
test("catálogo sem preço fica visível e oferece consulta na fonte",async()=>{
 const {root}=setup(async(_,url)=>url.includes('/references')?{references:[],catalog:[offer.item]}:{offers:[]});await search(root,'macarrao');
 const catalog=root.find(x=>x.className==='zm-catalog');assert.equal(catalog.hidden,false);assert.equal(catalog.tag,'section');assert.ok(root.find(x=>x.tag==='button'&&x.textContent==='Consultar preço novamente'));assert.ok(root.find(x=>x.className==='zm-status').textContent.includes('produto encontrado'));
});
test("produto sem cotação apresenta nome, marca, embalagem e fonte no card antes de abrir",async()=>{
 const item={...offer.item,name:"Macarrão integral",brand:"Marca informada",unit:"500 g",source:"openfoodfacts",sourceId:"123",category:"Massas"};
 const {root,window}=setup(async()=>({references:[],catalog:[item]}));await search(root,"macarrão");
 const card=root.find(x=>x.className==="zm-catalog-item"),summary=card.find(x=>x.className==="zm-catalog-summary");
 assert.equal(card.tag,"details");assert.ok(!card.open);assert.ok(summary.find(x=>x.textContent==="Macarrão integral"));
 assert.ok(summary.find(x=>x.textContent.includes("Marca informada")&&x.textContent.includes("500 g")));
 assert.ok(summary.find(x=>x.textContent==="Open Food Facts"));assert.ok(summary.find(x=>x.textContent==="Sem preço disponível"));
 assert.ok(card.find(x=>x.className==="zm-catalog-body").find(x=>x.textContent==="Código de barras"));assert.equal(window.location.href,"");
});
test("nova cotação permanece dentro do card escolhido sem deslocar o resultado para outra lista",async()=>{
 const item={...offer.item,source:"openfoodfacts"};
 const {root,window}=setup(async(_,url)=>url.includes("lookup")?{references:[offer]}:{references:[],catalog:[item]});await search(root);
 const card=root.find(x=>x.className==="zm-catalog-item");
 await card.find(x=>x.tag==="button"&&x.textContent==="Consultar preço novamente").handlers.click[0]();
 assert.ok(card.find(x=>x.className==="zm-inline-quote"));assert.equal(root.find(x=>x.className==="zm-results").children.length,0);
 assert.equal(window.location.href,"");assert.equal(card.find(x=>x.className==="zm-catalog-quotes")["aria-busy"],"false");
});
test("ausência de identificação tem mensagem distinta da ausência de preço",async()=>{
 const {root}=setup(async()=>({references:[],catalog:[]}));await search(root,"termo sem registro");
 assert.ok(root.find(x=>x.className==="zm-status").textContent.startsWith("Nenhum produto encontrado"));assert.equal(root.find(x=>x.className==="zm-catalog").hidden,true);
});
test("data de preço é preservada como dia civil, sem retroceder por fuso horário",async()=>{
 const {root}=setup(async(_,url)=>url.includes('/references')?{references:[offer]}:{offers:[]});await search(root);assert.ok(root.all(x=>x.className==='zm-result-meta').some(x=>x.textContent.includes('17/10/2026')));
});
test("catálogo sem preço pode iniciar precificação própria com confirmação e sem valores inventados",async()=>{
 const {root,window,sessionWrites}=setup(async()=>({references:[],catalog:[offer.item]}));await search(root,"produto");
 root.find(x=>x.tag==="button"&&x.textContent==="Precificar com meus custos").handlers.click[0]();
 assert.equal(window.location.href,"");
 await root.find(x=>x.tag==="button"&&x.textContent==="Confirmar").handlers.click[0]();
 assert.equal(sessionWrites.length,1);assert.equal(sessionWrites[0].key,"zuz:market-import");
 const draft=JSON.parse(sessionWrites[0].value);assert.equal(draft.id,ID);assert.equal(draft.price,undefined);assert.equal(draft.baseCost,undefined);
 assert.equal(window.location.href,"../produtos/produtos.html");
});
