(function(){
"use strict";
if(!window.ZUZAPI)return;
const api=window.ZUZAPI;
const DOM=(tag,cls,value)=>{
 const n=document.createElement(tag);if(cls)n.className=cls;
 if(value!==undefined)n.textContent=value;return n;
};
const button=(name,fn,cls="")=>{
 const b=DOM("button","zuz-v3-btn "+cls,name);b.type="button";b.addEventListener("click",fn);return b;
};
const labels={openfoodfacts:"Open Food Facts",openbeautyfacts:"Open Beauty Facts",
 openproductsfacts:"Open Products Facts",openpetfoodfacts:"Open Pet Food Facts",
 comprasgov:"Compras.gov.br",catmat_archive_2018:"CATMAT · acervo 2018",openprices:"Open Prices"};
const source=s=>labels[s]||String(s||"Fonte pública");
const money=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n)||0);
const date=x=>{if(!x)return "não informado";const d=new Date(x);return Number.isFinite(d.getTime())?d.toLocaleDateString("pt-BR"):"não informado"};
const safeImage=url=>/^https:\/\/images\.openfoodfacts\.org\/images\//.test(String(url||""))?url:null;
function marketBox(parent,mode){
 const root=DOM("section","zuz-v3");root.setAttribute("aria-label","Referências de mercado");
 const header=DOM("div","zuz-v3-head");
 header.append(DOM("h3","zuz-v3-title","Consultar mercado"),
  DOM("p","zuz-v3-sub","Encontre produtos e seus detalhes. Preços aparecem somente quando existem cotações públicas verificáveis."));
 const form=DOM("form","zuz-v3-search");
 const search=DOM("input","zuz-v3-control");
 search.type="search";search.maxLength=80;search.placeholder="Produto, marca ou código de barras";search.setAttribute("aria-label","Pesquisar produtos ou serviços");
 const kind=DOM("select","zuz-v3-control zuz-v3-kind");kind.setAttribute("aria-label","Tipo de item");
 for(const [v,t] of [["","Todos"],["product","Produtos"],["service","Serviços"]]){const o=DOM("option","",t);o.value=v;kind.append(o)}
 const submit=DOM("button","zuz-v3-btn zuz-v3-primary","Pesquisar");submit.type="submit";
 form.append(search,kind,submit);
 const archiveInput=DOM("input");archiveInput.type="checkbox";archiveInput.checked=true;archiveInput.id="zuz-v3-historical-"+mode;
 const archiveLabel=DOM("label","zuz-v3-check","Incluir catálogo técnico antigo (2018)");archiveLabel.htmlFor=archiveInput.id;
 const archive=DOM("div","zuz-v3-archive");archive.append(archiveInput,archiveLabel);
 const status=DOM("p","zuz-v3-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const info=DOM("div","zuz-v3-info");info.hidden=true;
 const results=DOM("div","zuz-v3-results");
 root.append(header,form,archive,status,info,results);parent.append(root);
 const state={list:[],limit:8,selected:null,sequence:0,archivePage:0,archiveHasMore:false};
 function notice(t){status.textContent=t;}
 function empty(parent,message){parent.replaceChildren(DOM("p","zuz-v3-sub",message));}
 function resultCard(row){
  const card=button(" ",()=>loadProduct(row),"zuz-v3-option");
  const title=DOM("strong","zuz-v3-option-name",String(row.display_name||row.full_name||"Produto").slice(0,72));
  const details=[row.brand,row.model,row.barcode].filter(Boolean).join(" · ");
  const technical=row.full_name&&!details?String(row.full_name).split(",").slice(1,3).join(" · ").trim().slice(0,105):details;
  const meta=DOM("small","zuz-v3-option-meta",technical||source(row.source));
  const badge=DOM("small","zuz-v3-option-status",row.is_historical?"Histórico, sem preço atual garantido":row.has_price?"Com observações armazenadas":"Preço ainda não encontrado");
  card.replaceChildren(title,meta,badge);return card;
 }
 function paintList(){
  results.replaceChildren();
  if(!state.list.length){
   empty(results,"Nenhum item encontrado nas fontes consultadas. Você ainda pode cadastrar manualmente.");
   return;
  }
  const visible=state.list.slice(0,state.limit);
  let previous="";
  for(const row of visible){
   const group=row.is_historical?"historical":"current";
   if(group!==previous){
    results.append(DOM("h4","zuz-v3-group",group==="historical"?"Referências técnicas do CATMAT (2018)":"Produtos e serviços identificados"));
    if(group==="historical")results.append(DOM("p","zuz-v3-muted","São registros antigos, não anúncios comerciais. Selecione para consultar as especificações."));
    previous=group;
   }
   results.append(resultCard(row));
  }
  if(state.limit<state.list.length)results.append(button("Mostrar mais resultados ("+(state.list.length-state.limit)+")",()=>{
   state.limit=Math.min(state.limit+8,state.list.length);paintList();
  },"zuz-v3-more"));
  if(state.limit>=state.list.length&&state.archiveHasMore)results.append(button("Carregar mais referências técnicas",loadMoreArchive,"zuz-v3-more"));
 }
 form.addEventListener("submit",e=>{e.preventDefault();performSearch()});
 archiveInput.addEventListener("change",()=>{if(search.value.trim().length>=2)performSearch()});
 async function performSearch(){
  const q=search.value.trim();if(q.length<2){notice("Informe ao menos dois caracteres.");return;}
  const token=++state.sequence;submit.disabled=true;info.hidden=true;info.replaceChildren();results.replaceChildren();
  notice("Pesquisando no catálogo público...");
  document.dispatchEvent(new CustomEvent("zuz:market:search",{detail:{root,query:q,info}}));
  try{
   const params=new URLSearchParams({q,historical:String(archiveInput.checked)});
   if(kind.value)params.set("kind",kind.value);
   const response=await api.request("GET","/market/v2/search?"+params.toString());
   if(token!==state.sequence)return;
   state.list=[...(response.commercial||[]),...(response.archived||[])];
   state.archivePage=0;state.archiveHasMore=!!response.archiveHasMore;
   state.limit=8;paintList();
   const n=response.totals||{commercial:0,archived:0};
   notice(n.commercial+" item(ns) de catálogos atuais; "+n.archived+" registro(s) técnicos de 2018. "+(response.warnings||[]).join(" "));
  }catch(error){if(token===state.sequence){empty(results,"Não foi possível completar a pesquisa: "+error.message+". A precificação manual continua disponível.");notice("Falha na consulta.");}}
  finally{if(token===state.sequence)submit.disabled=false;}
 }
 async function loadMoreArchive(){
  const q=search.value.trim();
  if(q.length<2||!archiveInput.checked)return;
  const page=state.archivePage+1,token=++state.sequence;
  state.archiveHasMore=false;paintList();notice("Carregando mais referências...");
  try{
   const params=new URLSearchParams({q,historical:"true",page:String(page)});
   if(kind.value)params.set("kind",kind.value);
   const response=await api.request("GET","/market/v2/search?"+params.toString());
   if(token!==state.sequence)return;
   const previous=new Set(state.list.map(row=>row.item_id));
   for(const row of response.archived||[])if(!previous.has(row.item_id))state.list.push(row);
   state.archivePage=page;state.archiveHasMore=!!response.archiveHasMore;
   state.limit=state.list.length;paintList();
   notice("Mais referências carregadas. Registros técnicos não representam ofertas nem preços atuais.");
  }catch(error){
   if(token===state.sequence){state.archiveHasMore=true;paintList();notice("Não foi possível carregar mais registros: "+error.message);}
  }
 }
 function field(label,value){
  if(value===null||value===undefined||String(value).trim()==="")return null;
  const item=DOM("div","zuz-v3-field");item.append(DOM("small","",label),DOM("strong","",String(value).slice(0,250)));return item;
 }
 function renderFicha(item){
  info.replaceChildren();info.hidden=false;
  const card=DOM("section","zuz-v3-ficha");
  const kicker=DOM("div","zuz-v3-kicker","FICHA DO PRODUTO");
  const title=DOM("h4","zuz-v3-ficha-title",String(item.name||"Produto identificado"));
  card.append(kicker,title);
  const image=safeImage(item.attributes?.image_url);
  if(image){const photo=DOM("img","zuz-v3-photo");photo.src=image;photo.loading="lazy";photo.referrerPolicy="no-referrer";photo.alt="Imagem do produto cadastrada na fonte pública";card.append(photo);}
  const grid=DOM("div","zuz-v3-info-grid");
  for(const entry of [
    field("Categoria",item.category),field("Marca",item.brand),field("Modelo",item.model),
    field("Código de barras (GTIN)",item.barcode),field("Código da fonte",item.sourceId),
    field("Quantidade / embalagem",item.unit||item.attributes?.quantity),
    field("Base de dados",source(item.source)),field(item.isHistorical?"Data do acervo":"Última atualização da fonte",item.isHistorical?"2018":date(item.attributes?.last_source_update||item.updatedAt))
  ]){if(entry)grid.append(entry)}
  card.append(grid);
  if(item.fullName&&item.fullName!==item.name){
   const extra=DOM("details","zuz-v3-long");const summary=DOM("summary","","Descrição técnica completa");
   extra.append(summary,DOM("p","",item.fullName));card.append(extra);
  }
  if(item.attributes?.description)card.append(DOM("p","zuz-v3-muted",item.attributes.description));
  if(item.attributes?.ingredients){
   const extra=DOM("details","zuz-v3-long");
   extra.append(DOM("summary","","Ingredientes informados na fonte"),DOM("p","",item.attributes.ingredients));
   card.append(extra);
  }
  if(item.isHistorical)card.append(DOM("p","zuz-v3-warning","Registro histórico de 2018. Não significa que o produto ou seu preço esteja disponível hoje."));
  if(item.isHistorical&&/^https:\/\/github\.com\/ant-rod-silva\/catmat_compras_gov_pub/.test(String(item.attributes?.origin||""))){
   const a=DOM("a","zuz-v3-source","Consultar o repositório histórico");a.href=item.attributes.origin;a.target="_blank";a.rel="noopener noreferrer";card.append(a);
  }
  if(item.attributes?.product_url&&/^https:\/\/world\.open(food|beauty|products|petfood)facts\.org\/product\//.test(item.attributes.product_url)){
   const a=DOM("a","zuz-v3-source","Consultar identificação original");a.href=item.attributes.product_url;a.target="_blank";a.rel="noopener noreferrer";card.append(a);
  }
  const btns=DOM("div","zuz-v3-buttons");
  btns.append(button(mode==="products"?"Preencher cadastro com estes dados":"Cadastrar este produto",()=>useProduct(item),"zuz-v3-primary"));
  card.append(btns);
  info.append(card);
  const quotes=DOM("div","zuz-v3-market");
  quotes.append(DOM("h4","zuz-v3-group","Preços e estabelecimentos"),
    DOM("p","zuz-v3-muted","Consultando cotações por código de barras ou código público..."));
  info.append(quotes);
  return quotes;
 }
 function useProduct(item){
  const payload={id:item.id,name:String(item.name||"").slice(0,60),
   barcode:item.barcode||"",brand:item.brand||"",model:item.model||"",
   category:item.category||"",type:item.type||"product",source:item.source,
   isHistorical:!!item.isHistorical,unit:item.unit||"",imageUrl:safeImage(item.attributes?.image_url)};
  if(mode==="products"){
   window.dispatchEvent(new CustomEvent("zuz:market:prefill",{detail:payload}));
   const cost=document.querySelector("#costItems .cost-item-amount");
   info.querySelector(".zuz-v3-kicker").textContent="DADOS ADICIONADOS AO FORMULÁRIO";
   cost?.scrollIntoView({behavior:"smooth",block:"center"});
  }else{
   try{sessionStorage.setItem("zuz:market-import",JSON.stringify(payload));}
   catch(e){notice("Navegador não permitiu preparar o formulário. Abra Produtos para cadastrar.");return;}
   window.location.href="../produtos/produtos.html";
  }
 }
 function renderQuotes(quotes,container,item){
  container.replaceChildren(DOM("h4","zuz-v3-group","Preços e estabelecimentos"));
  if(!quotes.quotes?.length){
   container.append(DOM("p","zuz-v3-warning","Produto identificado, mas nenhuma cotação comercial verificável foi encontrada. Isso não impede o cadastro e o cálculo pelos seus custos."));
   if(quotes.warnings?.length)container.append(DOM("p","zuz-v3-muted",quotes.warnings.join(" ")));
   return;
  }
  for(const group of quotes.groups||[]){
   const title=DOM("p","zuz-v3-muted",(group.type==="public_purchase"?"Compra governamental":"Varejo")+
    " · "+(group.region||"região não informada")+" · "+(group.unit||"unidade desconhecida"));
   container.append(title);
   if(group.distinctStores<3||group.count<3){
    container.append(DOM("p","zuz-v3-muted","Amostra insuficiente ("+group.distinctStores+" estabelecimentos). Sem média representativa."));
    continue;
   }
   const g=DOM("div","zuz-v3-stats");
   for(const [name,num] of [["Mínimo",group.min],["Média",group.average],["Mediana",group.median],["Máximo",group.max]]){
    const cell=DOM("div","zuz-v3-stat");cell.append(DOM("small","",name),DOM("strong","",money(num)));g.append(cell);
   }
   container.append(g);
  }
  for(const q of quotes.quotes.slice(0,10)){
   const line=DOM("article","zuz-v3-quote");
   line.append(DOM("strong","",money(q.price)+" · "+(q.seller||source(q.source))),
    DOM("small","",(q.price_type==="public_purchase"?"Compra pública":"Preço colaborativo")+" · "+(q.region||"região não informada")+" · "+(q.unit||"unidade não informada")),
    DOM("small","","Observado "+date(q.observed_at)+" · Consultado "+date(q.last_checked_at||q.fetched_at)+" · "+(q.stale?"Desatualizado":"Recente")+" · Confiabilidade "+(q.confidence||"baixa")));
   if(q.url&&/^https:\/\//.test(q.url)){
    const a=DOM("a","zuz-v3-source","Ver origem do registro");a.href=q.url;a.target="_blank";a.rel="noopener noreferrer";line.append(a);
   }
   container.append(line);
  }
 }
 async function loadProduct(row){
  const token=++state.sequence;
  info.hidden=false;empty(info,"Abrindo a ficha do produto...");
  try{
   const response=await api.request("GET","/market/v2/item?id="+encodeURIComponent(row.item_id));
   if(token!==state.sequence)return;
   const item=response.item;
   state.selected=item;
   const container=renderFicha(item);
   document.dispatchEvent(new CustomEvent("zuz:market:selected",{detail:{item,info}}));
   container.id="zuz-v3-quote-status-"+mode;
   try{
    const prices=await api.request("GET","/market/quotes?id="+encodeURIComponent(row.item_id));
    if(token!==state.sequence)return;
    renderQuotes(prices,container,item);
   }catch(error){
    if(token===state.sequence)empty(container,"Cotações indisponíveis. Os detalhes do produto permanecem disponíveis; seus custos são informados por você.");
   }
  }catch(error){if(token===state.sequence)empty(info,"Não foi possível abrir esta ficha: "+error.message);}
 }
 const name=document.getElementById("nameInput");
 if(mode==="products"&&name){search.value=name.value;name.addEventListener("input",()=>{if(document.activeElement===name)search.value=name.value;});}
 if(mode==="simulations"){const p=document.getElementById("product");p?.addEventListener("change",()=>{search.value=p.selectedOptions[0]?.textContent||"";});}
}
const product=document.getElementById("nameInput")?.closest(".field");
if(product){const container=DOM("div");product.after(container);marketBox(container,"products");}
const cost=document.getElementById("compRows")?.parentElement;
if(cost)marketBox(cost,"costs");
const market=document.getElementById("marketStats");
if(market?.parentElement){const container=DOM("div");market.parentElement.insertBefore(container,market);marketBox(container,"simulations");}
})();