(function(){
"use strict";
if(!window.ZUZAPI)return;
const el=(tag,cls,value)=>{const n=document.createElement(tag);n.className=cls||"";if(value!==undefined)n.textContent=String(value);return n;};
const text=value=>String(value??"").trim();
const money=value=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(value);
const date=value=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleDateString("pt-BR",{timeZone:"UTC"}):"Não informada";
const button=(label,fn,cls="")=>{const b=el("button","zm-button "+cls,label);b.type="button";b.addEventListener("click",fn);return b;};
const safeURL=value=>{try{const u=new URL(value);return u.protocol==="https:"?u.href:null;}catch{return null;}};
const sourceNames={openfoodfacts:"Open Food Facts",openbeautyfacts:"Open Beauty Facts",openproductsfacts:"Open Products Facts",openpetfoodfacts:"Open Pet Food Facts",catmat_archive_2018:"CATMAT",comprasgov:"Compras.gov.br"};
let instance=0;
function mount(parent,mode){
 const root=el("section","zm-search-shell");root.setAttribute("aria-label","Pesquisa de preços de mercado");
 const head=el("header","zm-heading");head.append(el("h3","zm-title","Descubra os preços de mercado"),el("p","zm-subtitle","Pesquise um produto e abra uma referência para consultar o preço."));
 const form=el("form","zm-search-form");form.setAttribute("role","search");
 const label=el("label","zm-search-label","Produto, marca ou código de barras");
 const input=el("input","zm-search-input");input.id="zm-search-"+(++instance);input.type="search";input.minLength=3;input.maxLength=80;input.required=true;input.placeholder="Ex.: vassoura";label.htmlFor=input.id;
 const controls=el("div","zm-search-controls");const submit=el("button","zm-search-submit","Pesquisar");submit.type="submit";
 const cancel=button("Cancelar",()=>stop());cancel.hidden=true;
 controls.append(input,submit,cancel);form.append(label,controls);
 const status=el("p","zm-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const warnings=el("p","zm-caption zm-source-status");
 const results=el("div","zm-results"),comparison=el("section","zm-comparison");comparison.hidden=true;comparison.setAttribute("aria-label","Comparação de referências");
 const catalog=el("details","zm-catalog");catalog.hidden=true;
 const manual=button(mode==="products"?"Continuar precificação manual":"Precificar manualmente",()=>{
  if(mode==="products"){document.getElementById("newProductBtn")?.click();document.getElementById("nameInput")?.focus();}
  else window.location.href="../produtos/produtos.html";
 },"zm-secondary");
 const footer=el("div","zm-footer");footer.append(manual);
 root.append(head,form,status,warnings,results,comparison,catalog,footer);parent.append(root);
 let serial=0,controllers=[],offers=[],selected=new Set(),loading=false,visibleCount=8;
 function busy(value){loading=value;root.setAttribute("aria-busy",String(value));cancel.hidden=!value;submit.textContent=value?"Pesquisar novamente":"Pesquisar";}
 function stop(){serial++;controllers.forEach(c=>c.abort());controllers=[];busy(false);status.textContent="Consulta interrompida. Você pode pesquisar novamente.";}
 async function request(method,path,body,limit=20000){
  const controller=new AbortController();controllers.push(controller);
  let timer;
  try{
   return await Promise.race([
    window.ZUZAPI.request(method,path,body,{signal:controller.signal}),
    new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error("Tempo de consulta esgotado."));},limit);})
   ]);
  }finally{clearTimeout(timer);controllers=controllers.filter(c=>c!==controller);}
 }
 function fact(parent,label,value){const row=el("div","zm-fact");row.append(el("dt","",label),el("dd","",text(value)||"Indisponível na fonte"));parent.append(row);}
 function image(parent,url,title){const safe=safeURL(url);if(!safe)return;const img=el("img","zm-product-image");img.src=safe;img.alt=title;img.loading="lazy";img.referrerPolicy="no-referrer";img.addEventListener("error",()=>img.remove());parent.append(img);}
 function sourceLink(parent,url){const safe=safeURL(url);if(!safe)return;const a=el("a","zm-link","Verificar na fonte original");a.href=safe;a.target="_blank";a.rel="noopener noreferrer";parent.append(a);}
 function kind(offer){
  const label=offer.priceType==="public_purchase"?"Compra pública · não é preço de loja":offer.comparison==="gtin"?"Cotação por código de barras":offer.comparison==="possivel_similar"?"Anúncio semelhante · confirme a variação":"Referência de catálogo · confirme a unidade";
  return label+(offer.stale?" · observação antiga":"");
 }
 function describe(offer){const item=offer.item||{};return [offer.brand||item.brand,offer.model||item.model,offer.unit||item.unit,offer.region].filter(Boolean).join(" · ");}
 function payload(item){return {id:item.id,name:text(item.name).slice(0,60),source:item.source,barcode:item.barcode||"",brand:item.brand||"",model:item.model||"",category:item.category||"",type:item.type||"product",unit:item.unit||"",isHistorical:!!item.isHistorical,imageUrl:item.attributes?.image_url||null};}
 function useReference(offer,area){
  const confirm=el("div","zm-confirm");
  confirm.append(el("p","","Usar esta referência? Seus custos e seu preço de venda continuarão sob seu controle."));
  const apply=button("Confirmar",async()=>{
   apply.disabled=true;
   try{
    if(mode==="simulations"&&offer.verified){
     const result=await request("POST","/market/reference/verify",{itemId:offer.item.id,quoteId:offer.id});
     const ref={...result.reference,accepted:false};
     window.dispatchEvent(new CustomEvent("zuz:market:reference",{detail:ref}));
     if(!ref.accepted)throw new Error("Selecione um produto compatível na simulação antes de usar esta referência.");
     area.replaceChildren(el("p","zm-success","Referência adicionada à simulação."));
    }else{
     const item=offer.item;
     const data=item?payload(item):{name:text(offer.title).slice(0,60)};
     if(mode==="products"){
      window.dispatchEvent(new CustomEvent(item?"zuz:market:prefill":"zuz:market:draft",{detail:data}));
      area.replaceChildren(el("p","zm-success","Dados preenchidos. Informe seus custos e defina seu preço."));
      document.getElementById("nameInput")?.focus();
     }else{
      sessionStorage.setItem(item?"zuz:market-import":"zuz:market-draft",JSON.stringify(data));
      window.location.href="../produtos/produtos.html";
     }
    }
   }catch(error){area.replaceChildren(el("p","zm-error",error.message||"Não foi possível utilizar esta referência."),button("Tentar novamente",()=>useReference(offer,area),"zm-secondary"));}
   finally{apply.disabled=false;}
  },"zm-secondary");
  confirm.append(apply,button("Cancelar",()=>action(offer,area)));area.replaceChildren(confirm);
 }
 function action(offer,area){area.replaceChildren(button(mode==="simulations"&&offer.verified?"Usar na simulação":"Usar na minha precificação",()=>useReference(offer,area),"zm-secondary"));}
 function financialSimulation(offer){
  const disclosure=el("details","zm-financial-simulation");disclosure.append(el("summary","","Calcular para o meu negócio"));
  const body=el("div","zm-simulation-body");
  body.append(el("p","zm-caption","Simulação ZUZ com seus valores. Não revela custos, impostos ou lucro do fornecedor."));
  const fields=el("div","zm-simulation-fields"),inputs={};
  for(const [key,title] of [["cost","Seu custo por unidade (R$)"],["tax","Sua taxa estimada de imposto (%)"],["fee","Suas outras taxas sobre a venda (%)"]]){
   const label=el("label","",title),field=el("input","zm-simulation-input");field.type="number";field.min="0";field.max=key==="cost"?"100000000":"99";field.step="0.01";field.inputMode="decimal";field.placeholder="Informe, inclusive se for 0";inputs[key]=field;label.append(field);fields.append(label);
  }
  const out=el("div","zm-simulation-output");out.setAttribute("role","status");out.setAttribute("aria-live","polite");
  const calculate=button("Calcular",()=>{
   const values=Object.fromEntries(Object.entries(inputs).map(([key,input])=>[key,input.value.trim()===""?null:Number(input.value)]));
   if(Object.values(values).some(value=>value===null||!Number.isFinite(value)||value<0)||values.cost>1e8||values.tax+values.fee>=100){out.replaceChildren(el("p","zm-error","Informe os três valores. As taxas somadas devem ser menores que 100%."));return;}
   if(!window.ZUZPricingCore?.calculate){out.replaceChildren(el("p","zm-error","Cálculo indisponível. Continue pela precificação manual."));return;}
   const result=window.ZUZPricingCore.calculate({unitDirectCost:values.cost,salePrice:offer.price,targetMargin:0,units:1,settings:{taxesPct:values.tax,sellingFeesPct:values.fee,fixedCosts:[],defaultMargin:0}});
   const facts=el("dl","zm-facts");
   fact(facts,"Preço da referência usado na simulação",money(offer.price));
   fact(facts,"Imposto estimado informado",money(offer.price*values.tax/100));
   fact(facts,"Outras taxas estimadas",money(offer.price*values.fee/100));
   fact(facts,"Líquido após imposto e taxas",money(offer.price*(1-(values.tax+values.fee)/100)));
   fact(facts,"Seu custo informado",money(result.directCost));fact(facts,"Resultado estimado por unidade",money(result.unitProfit));
   out.replaceChildren(el("p","zm-simulation-heading","Simulação do seu negócio"),facts,el("p","zm-caption","O resultado considera somente o custo e as taxas informados. Inclua o rateio dos seus custos fixos no custo por unidade. Não é apuração fiscal nem lucro verificado de outra empresa."));
  },"zm-secondary");body.append(fields,calculate,out);disclosure.append(body);return disclosure;
 }
 function details(offer){
  const box=el("div","zm-offer-details");const item=offer.item||{},attrs=item.attributes||{};
  box.append(el("h4","zm-detail-name",offer.title));
  const primary=el("dl","zm-facts zm-primary-facts");
  fact(primary,"Preço registrado",money(offer.price));fact(primary,"Unidade do preço",offer.unit);
  fact(primary,offer.priceType==="public_purchase"?"Fornecedor / órgão informado":"Loja / fornecedor",offer.seller);
  fact(primary,"Fonte",offer.source);fact(primary,"Data do preço",date(offer.observedAt));fact(primary,"Consulta da fonte",date(offer.queriedAt));
  box.append(primary,el("p","zm-caption",kind(offer)));sourceLink(box,offer.url);
  const financial=el("dl","zm-financial-facts");
  for(const title of ["Impostos","Valor líquido","Custos de aquisição","Ganho do fornecedor"])fact(financial,title,null);
  box.append(financial,el("p","zm-caption","Esta fonte não informa a composição financeira do fornecedor. Preço registrado não é custo nem lucro."));
  const more=el("details","zm-reference-data");more.append(el("summary","","Identificação e condições da referência"));
  const facts=el("dl","zm-facts");
  fact(facts,"Identificador da referência",offer.sourceRef||offer.id);fact(facts,"Identificador do produto",item.sourceId||item.id);fact(facts,"Código de barras",item.barcode);
  for(const [label,value] of [["Marca",offer.brand||item.brand],["Modelo / variação",offer.model||item.model],["Categoria",item.category],["Quantidade / embalagem",attrs.quantity||item.unit],["Desconto",null],["Frete",null],["Composição de custos",null]])fact(facts,label,value);
  if(offer.offerDescription&&offer.offerDescription!==offer.title)fact(facts,"Descrição do registro de preço",offer.offerDescription);
  if(offer.metadata?.purchaseQuantity)fact(facts,"Quantidade da compra pública",offer.metadata.purchaseQuantity);
  if(offer.metadata?.procurementDiscountPercent!==null&&offer.metadata?.procurementDiscountPercent!==undefined)fact(facts,"Percentual de desconto registrado na licitação",offer.metadata.procurementDiscountPercent+"% (não é imposto)");
  more.append(facts);box.append(more);
  if(offer.unit)box.append(financialSimulation(offer));
  else box.append(el("p","zm-caption","A fonte não informou a unidade: confirme a quantidade antes de usar este valor em um cálculo."));
  const area=el("div","zm-product-action");action(offer,area);box.append(area);return box;
 }
 function renderComparison(){
  comparison.replaceChildren();const chosen=offers.filter(o=>selected.has(o.key));comparison.hidden=chosen.length<2;if(chosen.length<2)return;
  comparison.append(el("h4","","Comparar referências"),el("p","zm-caption","Confira modelo, quantidade, unidade e condições. Compras públicas, anúncios semelhantes e preços antigos não são equivalentes nem formam uma média."));
  const grid=el("div","zm-compare-grid");
  for(const o of chosen){const item=el("article","zm-compare-item");item.append(el("strong","",o.title),el("p","zm-offer-price",money(o.price)),el("p","",o.seller),el("p","zm-caption",describe(o)||"Unidade / variação não informada"),el("p","zm-caption",kind(o)),el("p","zm-caption","Preço: "+date(o.observedAt)+" · Consulta: "+date(o.queriedAt)));sourceLink(item,o.url);grid.append(item);}
  comparison.append(grid,button("Limpar comparação",()=>{selected.clear();render();},"zm-secondary"));
 }
 function offerRow(offer){
  const row=el("article","zm-offer-row");const disclosure=el("details","zm-offer");disclosure.dataset.key=offer.key;
  const summary=el("summary","zm-offer-summary");image(summary,offer.imageUrl||offer.item?.attributes?.image_url,offer.title);
  const copy=el("span","zm-result-copy");copy.append(el("strong","zm-result-name",offer.title),el("span","zm-result-meta",[offer.seller,offer.source].filter(Boolean).join(" · ")));
  if(describe(offer))copy.append(el("span","zm-result-meta",describe(offer)));
  copy.append(el("span","zm-result-meta",(offer.observedAt?"Preço: "+date(offer.observedAt):"Atualização da loja não informada")+" · Consulta: "+date(offer.queriedAt)),el("span","zm-kind",kind(offer)));
  summary.append(copy,el("strong","zm-offer-price",money(offer.price)),el("span","zm-expand-label","Ver detalhes"));disclosure.append(summary);
  let populated=false;disclosure.addEventListener("toggle",()=>{if(disclosure.open&&!populated){disclosure.append(details(offer));populated=true;}});
  const toggle=button("",()=>{
   if(!selected.has(offer.key)&&selected.size>=3){status.textContent="Compare até três referências por vez.";return;}
   if(selected.has(offer.key))selected.delete(offer.key);else selected.add(offer.key);
   sync();renderComparison();
  },"zm-compare-toggle");
  const sync=()=>{const active=selected.has(offer.key);toggle.setAttribute("aria-pressed",String(active));toggle.setAttribute("aria-label",(active?"Remover da comparação: ":"Comparar: ")+offer.title+" de "+offer.seller);toggle.replaceChildren(el("span","zm-compare-symbol",active?"✓":"+"),el("span","",active?"Selecionado":"Comparar"));};
  sync();const actions=el("div","zm-result-actions");actions.append(toggle);row.append(disclosure,actions);return row;
 }
 function render(){
  const open=new Set([...results.querySelectorAll("details[open]")].map(x=>x.dataset.key));
  results.replaceChildren();
  if(offers.length){results.append(el("p","zm-results-title",offers.length+(offers.length===1?" referência com preço":" referências com preço")));for(const o of offers.slice(0,visibleCount)){const row=offerRow(o);results.append(row);if(open.has(o.key))row.querySelector("details").open=true;}}
  if(offers.length>visibleCount)results.append(button("Ver mais referências ("+(offers.length-visibleCount)+")",()=>{visibleCount+=8;render();},"zm-secondary"));
  renderComparison();
 }
 function add(rows){
  const seen=new Set(offers.map(x=>x.key));
  for(const o of rows||[]){
   if(!text(o.title)||!text(o.seller)||!safeURL(o.url)||!Number.isFinite(Number(o.price))||Number(o.price)<=0||o.currency!=="BRL")continue;
   // Keep separate observations from different sources, sellers and dates.
   const key=[o.sourceCode||o.source,o.id||o.sourceRef||o.url,o.observedAt||o.queriedAt].join("|");
   if(seen.has(key))continue;seen.add(key);offers.push({...o,key,price:Number(o.price)});
  }
  offers.sort((a,b)=>Number(!!a.stale)-Number(!!b.stale)||(Date.parse(b.observedAt||b.queriedAt)||0)-(Date.parse(a.observedAt||a.queriedAt)||0));
  render();
 }
 function renderCatalog(items){
  catalog.replaceChildren();catalog.open=true;const withoutPrice=(items||[]).filter(item=>!offers.some(o=>o.item?.id===item.id));catalog.hidden=!withoutPrice.length;if(!withoutPrice.length)return;
  catalog.append(el("summary","","Produtos encontrados sem cotação ("+withoutPrice.length+")"));
  for(const item of withoutPrice){
   const d=el("details","zm-catalog-item");d.append(el("summary","",item.fullName||item.name));
   const facts=el("dl","zm-facts");fact(facts,"Fonte",sourceNames[item.source]||item.source);fact(facts,"Código",item.sourceId||item.id);fact(facts,"Marca",item.brand);fact(facts,"Modelo",item.model);fact(facts,"Quantidade",item.unit);fact(facts,"Código de barras",item.barcode);fact(facts,"Preço","Ainda sem cotação nesta consulta");
   d.append(facts,el("p","zm-caption","Produto identificado no catálogo. A ausência de cotação não significa preço zero."));sourceLink(d,item.attributes?.product_url);
   const outcome=el("div","zm-catalog-quotes");
   const lookup=button("Consultar preços públicos",async()=>{
    lookup.disabled=true;outcome.replaceChildren(el("p","zm-caption","Consultando a fonte..."));
    try{const result=await request("GET","/market/lookup?id="+encodeURIComponent(item.id));
     if(result.references?.length){add(result.references);outcome.replaceChildren(el("p","zm-success","Encontramos "+result.references.length+" referências. Os preços aparecem na lista acima."));}
     else outcome.replaceChildren(el("p","zm-caption","Esta fonte não retornou uma cotação para o produto. Você pode usar a precificação manual."));
    }catch{outcome.replaceChildren(el("p","zm-error","Fonte indisponível agora. Tente novamente ou continue manualmente."));}
    finally{lookup.disabled=false;}
   },"zm-secondary zm-catalog-load");
   d.append(lookup,outcome);catalog.append(d);
  }
 }
 form.addEventListener("submit",async event=>{
  event.preventDefault();event.stopPropagation?.();const term=input.value.trim();if(term.length<3||term.length>80){status.textContent="Digite entre 3 e 80 caracteres.";input.focus();return;}
  controllers.forEach(c=>c.abort());controllers=[];const token=++serial;
  offers=[];visibleCount=8;selected.clear();results.replaceChildren();catalog.hidden=true;comparison.hidden=true;warnings.textContent="";
  busy(true);status.textContent="Consultando referências e ofertas...";
  const messages=[],catalogItems=[];let successes=0;
  const query=encodeURIComponent(term);
  await Promise.allSettled([
   (async()=>{
    try{const data=await request("GET","/market/references?q="+query);if(token!==serial)return;successes++;add(data.references);catalogItems.push(...(data.catalog||[]));
     if(data.warnings?.length)messages.push("Algumas fontes estão indisponíveis; parte dos dados pode vir de consultas anteriores.");
     if(data.limited)messages.push("Exibindo as primeiras referências. Refine a marca ou o modelo para ampliar a precisão.");
    }catch{if(token===serial)messages.push("Não foi possível consultar as referências salvas agora.");}
   })(),
   (async()=>{
    try{const data=await request("GET","/market/offers?q="+query);if(token!==serial)return;successes++;add(data.offers);
     if(data.enabled===false)messages.push("A consulta de anúncios de lojas está indisponível neste momento.");
     else if(data.warnings?.length)messages.push("Não foi possível consultar os anúncios de lojas agora.");
    }catch{if(token===serial)messages.push("Não foi possível consultar os anúncios de lojas agora.");}
   })()
  ]);
  if(token!==serial)return;busy(false);renderCatalog(catalogItems);warnings.textContent=[...new Set(messages)].join(" ");
  status.textContent=offers.length?"Consulta concluída. Abra os detalhes ou marque até três referências para comparar.":catalogItems.length?"Encontramos "+catalogItems.length+" produtos no catálogo. Abra um resultado para consultar a identificação e procurar preços.":successes?"Não encontramos preços verificáveis para esta pesquisa. Tente outra descrição ou continue com a precificação manual.":"Não foi possível concluir a consulta. Tente novamente ou continue com a precificação manual.";
 });
}
// Reuse the existing page mounts; no overlay, new page or automatic navigation on selection.
const products=document.getElementById("marketSearchMountProducts");if(products)mount(products,"products");
const costs=document.getElementById("marketSearchMountCosts");if(costs)mount(costs,"costs");
else{const comp=document.getElementById("compRows")?.parentElement;if(comp){const host=el("div","zm-mount");comp.append(host);mount(host,"costs");}}
const simulation=document.getElementById("marketSearchMount");if(simulation)mount(simulation,"simulations");
else{const stats=document.getElementById("marketStats");if(stats?.parentElement){const host=el("div","zm-mount");stats.parentElement.insertBefore(host,stats);mount(host,"simulations");}}
})();
