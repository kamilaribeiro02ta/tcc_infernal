(function(){
"use strict";
if(!window.ZUZAPI)return;
const api=window.ZUZAPI;
const el=(tag,cls,t)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(t!==undefined)n.textContent=t;return n};
const btn=(t,fn,cls="")=>{const b=el("button","zuz-v2-btn "+cls,t);b.type="button";b.addEventListener("click",fn);return b};
const reais=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n)||0);
const data=v=>{const d=new Date(v);return Number.isFinite(d.getTime())?d.toLocaleDateString("pt-BR"):"não informada"};
const source=s=>({openprices:"Open Prices",openfoodfacts:"Open Food Facts",comprasgov:"Compras.gov.br",catmat_archive_2018:"CATMAT — histórico de 2018"})[s]||s;
function widget(parent,mode){
 const root=el("section","zuz-v2");root.setAttribute("aria-label","Referências de mercado");
 const title=el("h3","zuz-v2-title","Referências de mercado");
 const desc=el("p","zuz-v2-help","Consulte produtos e serviços. Preços públicos não substituem seus custos e margens.");
 const form=el("form","zuz-v2-form");
 const term=el("input","zuz-v2-input");term.type="search";term.maxLength=80;term.placeholder="Produto, marca, modelo ou código";term.setAttribute("aria-label","Pesquisar produto ou serviço");
 const kind=el("select","zuz-v2-input");kind.setAttribute("aria-label","Tipo de item");
 for(const [v,t] of [["","Todos"],["product","Produtos"],["service","Serviços"]]){const o=el("option","",t);o.value=v;kind.append(o);}
 const submit=el("button","zuz-v2-btn zuz-v2-primary","Pesquisar");submit.type="submit";form.append(term,kind,submit);
 const check=el("input");check.type="checkbox";check.setAttribute("aria-label","Incluir acervo histórico");
 const historical=el("label","zuz-v2-historical");historical.append(check,document.createTextNode("Mostrar acervo histórico (2018)"));
 const status=el("p","zuz-v2-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const list=el("div","zuz-v2-list"),details=el("div","zuz-v2-details");details.hidden=true;
 root.append(title,desc,form,historical,status,list,details);parent.append(root);
 let serial=0;const say=t=>status.textContent=t,empty=(w,msg)=>w.replaceChildren(el("p","zuz-v2-help",msg));
 form.addEventListener("submit",e=>{e.preventDefault();search()});
 async function search(){
  const q=term.value.trim();if(q.length<2){say("Digite ao menos dois caracteres.");return;}
  const token=++serial;submit.disabled=true;list.replaceChildren();details.replaceChildren();details.hidden=true;say("Pesquisando...");
  try{
   const params=new URLSearchParams({q,historical:String(check.checked)});if(kind.value)params.set("kind",kind.value);
   const result=await api.request("GET","/market/v2/search?"+params);
   if(token!==serial)return;
   for(const item of (result.items||[]).slice(0,12)){
    const b=btn("",()=>select(item),"zuz-v2-option");
    const name=String(item.display_name||"Item sem nome");
    b.append(el("strong","",name.slice(0,105)));
    b.append(el("small","",[item.brand,item.model,item.barcode].filter(Boolean).join(" · ")||source(item.source)));
    b.append(el("small","",item.is_historical?"Acervo histórico — não é uma oferta atual":item.has_price?"Cotações armazenadas":"Sem preço verificado"));
    list.append(b);
   }
   if(!result.items?.length)empty(list,check.checked?"Nenhum registro encontrado. Continue manualmente.":"Sem produtos comerciais atuais. Experimente outra busca, consulte o acervo histórico ou precifique manualmente.");
   say((result.items||[]).length+" item(ns). "+(result.warnings||[]).join(" "));
  }catch(e){say("Não foi possível pesquisar: "+e.message);empty(list,"A precificação manual continua disponível.");}
  finally{if(token===serial)submit.disabled=false;}
 }
 async function select(item,filter){
  const token=++serial;list.replaceChildren();details.hidden=false;empty(details,"Consultando cotações...");
  if(mode==="products"&&!item.is_historical){
   const name=el("span","",item.display_name||"").textContent.slice(0,60);
   window.ZUZMarketSelected={id:item.item_id,name,barcode:item.barcode||"",brand:item.brand||"",model:item.model||"",type:item.kind||"product"};
   const input=document.getElementById("nameInput");if(input){input.value=name;input.dispatchEvent(new Event("input",{bubbles:true}));}
  }
  try{
   const qs=new URLSearchParams({id:item.item_id});if(filter){if(filter.region)qs.set("region",filter.region);if(filter.minimum)qs.set("minimum",filter.minimum);if(filter.maximum)qs.set("maximum",filter.maximum);}
   const result=await api.request("GET","/market/quotes?"+qs);
   if(token!==serial)return;render(item,result);
  }catch(e){if(token===serial)empty(details,"Fonte indisponível. A precificação manual continua funcionando.");}
 }
 function render(item,result){
  details.replaceChildren();
  details.append(el("h4","zuz-v2-title",String(item.display_name||"Item identificado").slice(0,110)));
  details.append(el("p","zuz-v2-help","Catálogo: "+source(item.source)+(item.is_historical?" · dado histórico de 2018":"")));
  for(const warning of result.warnings||[])details.append(el("p","zuz-v2-warning",warning));
  if(result.availableRegions?.length){
   const filters=el("form","zuz-v2-form");
   const region=el("select","zuz-v2-input");region.setAttribute("aria-label","Filtrar região");
   for(const name of ["",...result.availableRegions]){const o=el("option","",name||"Todas as regiões");o.value=name;region.append(o);}
   region.value=result.filters?.region||"";
   const minimum=el("input","zuz-v2-input");minimum.type="number";minimum.step=".01";minimum.min="0";minimum.placeholder="Preço mínimo";minimum.setAttribute("aria-label","Preço mínimo");minimum.value=result.filters?.minimum??"";
   const maximum=el("input","zuz-v2-input");maximum.type="number";maximum.step=".01";maximum.min="0";maximum.placeholder="Preço máximo";maximum.setAttribute("aria-label","Preço máximo");maximum.value=result.filters?.maximum??"";
   const apply=el("button","zuz-v2-btn","Filtrar");apply.type="submit";
   filters.append(region,minimum,maximum,apply);details.append(filters);
   filters.addEventListener("submit",e=>{e.preventDefault();select(item,{region:region.value,minimum:minimum.value,maximum:maximum.value})});
  }

  if(!result.quotes?.length){details.append(el("p","zuz-v2-help","Item identificado, mas não há preços comerciais verificáveis. Continue com seus custos manuais."));return;}
  for(const group of (result.groups||[]).slice(0,5)){
   if(group.count<3||group.distinctStores<3){
    details.append(el("p","zuz-v2-help","Dados insuficientes para média representativa ("+group.count+" observações, "+group.distinctStores+" lojas)."));continue;
   }
   const box=el("div","zuz-v2-stats");
   box.append(el("p","zuz-v2-help",(group.type==="public_purchase"?"Compra pública (não é preço de varejo)":"Varejo")+" · "+(group.region||"Região não informada")+" · "+group.unit+" · "+group.distinctStores+" lojas"));
   const grid=el("div","zuz-v2-grid");
   for(const [label,value] of [["Mínimo",group.min],["Média",group.average],["Mediana",group.median],["Máximo",group.max]]){
    const cell=el("div","zuz-v2-cell");cell.append(el("small","",label),el("strong","",reais(value)));grid.append(cell);
   }
   box.append(grid);details.append(box);
  }
  for(const q of result.quotes.slice(0,8)){
   const row=el("article","zuz-v2-quote");
   row.append(el("strong","",reais(q.price)),el("span","",q.seller||"Estabelecimento não identificado"));
   row.append(el("small","",source(q.source)+" · "+(q.unit||"Unidade não informada")+" · "+(q.region||"Região não informada")));
   row.append(el("small","","Observado: "+data(q.observed_at)+" · Consultado: "+data(q.last_checked_at||q.fetched_at)+" · "+(q.stale?"Desatualizado":"Recente")+" · Confiabilidade "+(q.confidence||"baixa")));
   if(q.url&&/^https:\/\//.test(q.url)){const a=el("a","","Consultar registro da fonte");a.href=q.url;a.target="_blank";a.rel="noopener noreferrer";row.append(a);}
   details.append(row);
  }
  details.append(el("p","zuz-v2-help","Valores de compra pública não representam preços de varejo. Observações colaborativas não são ofertas em tempo real."));
 }
 const name=document.getElementById("nameInput");
 if(mode==="products"&&name){term.value=name.value;name.addEventListener("input",()=>{if(document.activeElement===name)term.value=name.value;});}
 if(mode==="simulations"){const select=document.getElementById("product");if(select)select.addEventListener("change",()=>{term.value=select.selectedOptions?.[0]?.textContent||"";});}
}
const product=document.getElementById("nameInput")?.closest(".field");if(product){const holder=el("div");product.after(holder);widget(holder,"products");}
const costs=document.getElementById("compRows")?.parentElement;if(costs)widget(costs,"costs");
const stats=document.getElementById("marketStats");if(stats?.parentElement){const holder=el("div");stats.parentElement.insertBefore(holder,stats);widget(holder,"simulations");}
})();