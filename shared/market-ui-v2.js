(function(){
"use strict";
if(!window.ZUZAPI)return;
const api=window.ZUZAPI;
const make=(tag,cls,content)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(content!==undefined)node.textContent=String(content);
 return node;
};
const money=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n));
const date=n=>{if(!n)return null;const d=new Date(n);return Number.isFinite(d.valueOf())?d.toLocaleDateString("pt-BR"):null;};
const text=n=>String(n??"").trim();
const safeLink=(label,url)=>{
 try{
  const u=new URL(url);
  if(u.protocol!=="https:")return null;
  const a=make("a","zm-link",label);a.href=u.href;a.target="_blank";a.rel="noopener noreferrer";return a;
 }catch{return null;}
};
const btn=(title,action,extra="")=>{
 const b=make("button","zm-button "+extra,title);b.type="button";b.addEventListener("click",action);return b;
};
const rowText=(parent,label,value)=>{
 if(!text(value))return;
 const line=make("div","zm-fact");
 line.append(make("span","zm-fact-label",label),make("span","zm-fact-value",value));
 parent.append(line);
};
function marketBox(parent,mode){
 const root=make("section","zm-search-shell");root.setAttribute("aria-label","Consulta de preços de mercado");
 const headline=make("header","zm-heading");
 headline.append(make("h3","zm-title","Consulta de preços"),
  make("p","zm-subtitle","Pesquise um produto, compare preços e decida como utilizá-los."));
 const form=make("form","zm-search-form");
 const inputLabel=make("label","zm-sr-only","Produto, marca ou código de barras");
 const input=make("input","zm-search-input");input.type="search";input.minLength=2;input.maxLength=80;
 input.placeholder="Ex.: vassoura, macarrão, marca ou código";input.autocomplete="off";
 input.setAttribute("aria-label","Produto, marca ou código de barras");
 const searchButton=make("button","zm-search-submit","Buscar");searchButton.type="submit";
 inputLabel.append(input);form.append(inputLabel,searchButton);
 const status=make("p","zm-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const results=make("div","zm-results");results.setAttribute("aria-label","Resultados da pesquisa");
 const detail=make("div","zm-detail");detail.hidden=true;detail.setAttribute("aria-live","polite");
 root.append(headline,form,status,results,detail);parent.append(root);
 let sequence=0,currentTerm="",chosen=null;
 function inform(message){status.textContent=message||"";}
 function empty(el,message){el.replaceChildren(make("p","zm-empty",message));}
 function payloadOf(item){
  return {id:item.id,name:text(item.name).slice(0,60),barcode:item.barcode||"",brand:item.brand||"",
   model:item.model||"",category:item.category||"",type:item.type||"product",source:item.source,
   isHistorical:!!item.isHistorical,unit:item.unit||"",imageUrl:item.attributes?.image_url||null};
 }
 function useProduct(item){
  const payload=payloadOf(item);
  if(mode==="products"){
   window.dispatchEvent(new CustomEvent("zuz:market:prefill",{detail:payload}));
   inform("Produto preenchido no cadastro. Revise os dados e informe seus custos.");
   document.getElementById("nameInput")?.focus({preventScroll:true});
   return;
  }
  try{sessionStorage.setItem("zuz:market-import",JSON.stringify(payload));}
  catch{inform("Não foi possível preparar o cadastro automaticamente.");return;}
  window.location.href="../produtos/produtos.html";
 }
 function confirmProduct(item,parent){
  const confirm=make("div","zm-confirm");
  confirm.append(make("p","","Usar os dados deste produto no cadastro? Seus custos e seu preço de venda não serão alterados."));
  confirm.append(btn("Confirmar",()=>useProduct(item),"zm-primary"),
   btn("Cancelar",()=>parent.replaceChildren(btn(mode==="products"?"Usar na precificação":"Cadastrar este produto",()=>confirmProduct(item,parent),"zm-primary")),"zm-secondary"));
  parent.replaceChildren(confirm);
 }
 function resultButton(row){
  const title=text(row.display_name||row.full_name||"Produto identificado");
  const b=btn("",()=>selectProduct(row),"zm-result");
  const copy=make("span","zm-result-copy");
  copy.append(make("strong","zm-result-name",title.slice(0,110)));
  const secondary=[row.brand,row.model].filter(Boolean).join(" · ");
  if(secondary)copy.append(make("small","zm-result-meta",secondary));
  else if(row.kind==="service")copy.append(make("small","zm-result-meta","Serviço"));
  else if(row.barcode)copy.append(make("small","zm-result-meta","Produto identificado por código"));
  b.append(copy,make("span","zm-result-chevron","›"));
  return b;
 }
 function offerButton(offer){
  const b=btn("",()=>selectOffer(offer),"zm-result");
  const copy=make("span","zm-result-copy");
  copy.append(make("strong","zm-result-name",text(offer.title).slice(0,110)),
    make("small","zm-result-meta",text(offer.seller)+" · "+money(offer.price)+" · conferir na loja"));
  b.append(copy,make("span","zm-result-chevron","›"));
  return b;
 }
 function renderOffers(rows){
  results.replaceChildren(make("p","zm-results-title","Ofertas encontradas"));
  const list=make("div","zm-product-list");
  for(const offer of (rows||[]).slice(0,8))list.append(offerButton(offer));
  results.append(list,make("p","zm-caption","Anúncios semelhantes: confirme o modelo e as condições antes de utilizar o preço."));
 }
 function useOfferDraft(offer){
  const payload={name:text(offer.title).slice(0,60)};
  if(mode==="products"){
   window.dispatchEvent(new CustomEvent("zuz:market:draft",{detail:payload}));
   inform("Nome preenchido para revisão. Informe seus custos e confirme o produto.");
   document.getElementById("nameInput")?.focus({preventScroll:true});
  }else{
   try{sessionStorage.setItem("zuz:market-draft",JSON.stringify(payload));}
   catch{inform("Não foi possível preparar o cadastro automaticamente.");return;}
   window.location.href="../produtos/produtos.html";
  }
 }
 function selectOffer(offer){
  ++sequence;results.hidden=true;detail.hidden=false;detail.replaceChildren();
  const back=btn("← Voltar aos resultados",()=>{
   ++sequence;results.hidden=false;detail.hidden=true;detail.replaceChildren();input.focus();
  },"zm-back");
  const head=make("div","zm-product-heading");
  head.append(make("h3","zm-selected-title",offer.title),
   make("p","zm-product-identity",offer.seller));
  const prices=block("Preço anunciado");
  const amount=make("p","zm-advertised-price",money(offer.price));
  prices.append(amount,make("p","zm-caption","Consulta em "+(date(offer.queriedAt)||"data não informada")+
    ". A loja não informou necessariamente quando o anúncio foi atualizado."));
  const original=safeLink("Conferir preço na loja",offer.url);if(original)prices.append(original);
  const action=make("div","zm-product-action");
  action.append(btn("Cadastrar com este nome",()=>{
   const box=make("div","zm-confirm");
   box.append(make("p","","Preencher apenas o nome para cadastro? O preço anunciado não substituirá seus custos ou seu preço de venda."),
    btn("Confirmar",()=>useOfferDraft(offer),"zm-primary"),
    btn("Cancelar",()=>action.replaceChildren(btn("Cadastrar com este nome",()=>selectOffer(offer),"zm-primary")),"zm-secondary"));
   action.replaceChildren(box);
  },"zm-primary"));
  detail.append(back,head,prices,action,
   make("p","zm-caption","Oferta possivelmente semelhante, sem identificação inequívoca por GTIN ou variante. Não entra na média comercial validada."));
  inform("");
 }
 function renderList(rows){
  results.replaceChildren();
  const seen=new Set(),unique=[];
  for(const row of rows||[]){
   const key=row.barcode?"gtin:"+row.barcode:
    "name:"+[row.display_name,row.brand,row.model,row.kind].map(x=>text(x).toLocaleLowerCase("pt-BR")).join("|");
   if(seen.has(key))continue;seen.add(key);unique.push(row);
   if(unique.length>=12)break;
  }
  if(!unique.length){
   empty(results,"Não encontramos um produto comercial correspondente. Você pode cadastrá-lo manualmente.");
   return;
  }
  const list=make("div","zm-product-list");
  for(const row of unique)list.append(resultButton(row));
  results.append(make("p","zm-results-title",unique.length===1?"1 produto encontrado":"Produtos encontrados"),list);
  if((rows||[]).length>unique.length)results.append(make("p","zm-caption","Mostrando os resultados mais relevantes. Refine a pesquisa para encontrar um modelo específico."));
 }
 function renderTechnical(target,rows){
  target.replaceChildren();
  const seen=new Set();
  for(const row of rows||[]){
   const descriptions=text(row.full_name||row.display_name||"").split(",").map(part=>part.trim()).filter(Boolean);
   const name=descriptions.slice(0,3).join(" · ").toLocaleLowerCase("pt-BR").replace(/^./,x=>x.toUpperCase()).slice(0,110);
   const key=name.toLocaleLowerCase("pt-BR");
   if(!name||seen.has(key))continue;
   seen.add(key);target.append(resultButton({...row,display_name:name}));
   if(seen.size>=5)break;
  }
  if(!seen.size)empty(target,"Nenhuma referência de material encontrada.");
 }
 function technicalOption(term){
  const advanced=make("details","zm-optional zm-technical");
  advanced.append(make("summary","","Ver materiais relacionados"));
  const content=make("div","zm-optional-content");advanced.append(content);
  let loaded=false;
  advanced.addEventListener("toggle",async()=>{
   if(!advanced.open||loaded)return;loaded=true;
   empty(content,"Buscando materiais relacionados...");
   try{
    const r=await api.request("GET","/market/v2/search?"+new URLSearchParams({q:term,historical:"true"}));
    if(currentTerm!==term)return;
    renderTechnical(content,r.archived);
   }catch{empty(content,"Não foi possível consultar materiais relacionados.");}
  });
  return advanced;
 }
 function manualAction(){
  const caption=mode==="products"?"Continuar cadastro manual":"Cadastrar manualmente";
  return btn(caption,()=>{
   if(mode==="products"){document.getElementById("nameInput")?.focus();return;}
   window.location.href="../produtos/produtos.html";
  },"zm-secondary");
 }
 async function search(e){
  e?.preventDefault();
  const term=input.value.trim();
  if(term.length<2){inform("Digite pelo menos dois caracteres para pesquisar.");input.focus();return;}
  const token=++sequence;currentTerm=term;chosen=null;
  searchButton.disabled=true;detail.hidden=true;results.hidden=false;detail.replaceChildren();
  empty(results,"Procurando produtos...");inform("");
  try{
   const query=new URLSearchParams({q:term,historical:"false"});
   const data=await api.request("GET","/market/v2/search?"+query);
   if(token!==sequence)return;
   const commercial=data.commercial||[];
   if(commercial.length){
    renderList(commercial);
    if(commercial.length<=2)results.append(technicalOption(term));
    inform("Selecione um produto para consultar os preços.");
   }else{
    let shop=[];
    try{
     const response=await api.request("GET","/market/offers?q="+encodeURIComponent(term));
     if(token!==sequence)return;
     shop=Array.isArray(response.offers)?response.offers:[];
    }catch{shop=[];}
    if(shop.length){
     renderOffers(shop);
     results.append(technicalOption(term));
     inform("Selecione uma opção e confira o anúncio da loja.");
     return;
    }
    empty(results,"Procurando materiais relacionados...");
    try{
     const additional=await api.request("GET","/market/v2/search?"+new URLSearchParams({q:term,historical:"true"}));
     if(token!==sequence)return;
     const related=additional.archived||[];
     if(related.length){
      const list=make("div","zm-product-list");
      renderTechnical(list,related);
      results.replaceChildren(make("p","zm-results-title","Materiais relacionados"),list,
       make("p","zm-caption","Modelos identificados em referências de materiais. Os preços comerciais serão consultados após a seleção."),
       manualAction());
      inform("Selecione um material ou continue o cadastro manual.");
     }else{
      empty(results,"Não encontramos produtos correspondentes nesta pesquisa.");
      results.append(manualAction());inform("");
     }
    }catch{
     if(token!==sequence)return;
     empty(results,"Não encontramos produtos comerciais nesta pesquisa.");
     results.append(manualAction());inform("");
    }
   }
  }catch{
   if(token!==sequence)return;
   empty(results,"Não conseguimos completar a pesquisa agora. Você pode cadastrar o produto manualmente.");
   inform("Não foi possível concluir a consulta.");
  }finally{if(token===sequence)searchButton.disabled=false;}
 }
 function block(title,contentClass=""){
  const s=make("section","zm-section "+contentClass);
  s.append(make("h4","zm-section-title",title));return s;
 }
 function progressive(title,fn){
  const box=make("details","zm-optional");
  box.append(make("summary","",title));
  const body=make("div","zm-optional-content");box.append(body);
  let loaded=false;
  box.addEventListener("toggle",()=>{
   if(!box.open||loaded)return;loaded=true;fn(body);
  });
  return box;
 }
 function detailsPanel(item){
  const wrap=make("div","zm-small-facts");
  rowText(wrap,"Marca",item.brand);rowText(wrap,"Modelo",item.model);
  rowText(wrap,"Categoria",item.category);rowText(wrap,"Quantidade",item.unit||item.attributes?.quantity);
  rowText(wrap,"Código de barras",item.barcode);
  if(item.isHistorical)rowText(wrap,"Identificação","Catálogo de materiais");
  const notes=make("div","zm-extra-notes");
  if(item.fullName&&item.fullName!==item.name)notes.append(make("p","zm-caption",item.fullName.slice(0,450)));
  if(item.attributes?.ingredients)notes.append(make("p","zm-caption","Ingredientes: "+item.attributes.ingredients.slice(0,250)));
  if(item.attributes?.allergens?.length)notes.append(make("p","zm-caption","Alérgenos informados: "+item.attributes.allergens.slice(0,8).join(", ")));
  const link=safeLink("Consultar identificação original",item.attributes?.product_url);
  if(link)notes.append(link);
  wrap.append(notes);return wrap;
 }
 function historyPanel(item,target){
  empty(target,"Consultando histórico disponível...");
  Promise.allSettled([
   api.request("GET","/market/history?id="+encodeURIComponent(item.id)),
   item.barcode?api.request("GET","/market/keepa?gtin="+encodeURIComponent(item.barcode)):Promise.resolve({products:[]})
  ]).then(res=>{
   target.replaceChildren();
   const db=res[0].status==="fulfilled"?res[0].value:{years:[]};
   const keepa=res[1].status==="fulfilled"?res[1].value:{products:[]};
   const years=db.years||[];
   if(years.length){
    const list=make("div","zm-small-facts");
    for(const r of years.slice(-8))rowText(list,String(r.year),money(r.median)+" · "+r.count+" registro(s)");
    target.append(list);
   }
   const k=keepa.products?.find(p=>Array.isArray(p.history)&&p.history.length);
   if(k){
    const last=k.history.at(-1);
    target.append(make("p","zm-caption","Histórico Amazon: última observação "+date(last.date)+" · "+money(last.price)));
    const link=safeLink("Conferir histórico na loja",k.url);if(link)target.append(link);
   }
   if(!years.length&&!k)target.append(make("p","zm-caption","Ainda não há histórico de preços verificável para este produto."));
   target.append(make("p","zm-caption","Histórico e atualização pela inflação não representam um preço atual de loja."));
  }).catch(()=>empty(target,"Histórico indisponível no momento."));
 }
 function taxPanel(item,target){
  target.append(make("p","zm-caption","Os tributos dependem da atividade, regime fiscal, local da operação e classificação do produto."));
  const form=make("form","zm-tax-form");
  const regime=make("select","zm-field");
  for(const [value,label] of [["","Regime tributário"],["mei","MEI"],["simples","Simples Nacional"],["presumido","Lucro Presumido"],["real","Lucro Real"],["outro","Outro"]]){
   const o=make("option","",label);o.value=value;regime.append(o);
  }
  const activity=make("select","zm-field");
  for(const [value,label] of [["revenda","Revenda"],["producao","Produção"],["servico","Serviços"],["misto","Atividade mista"]]){
   const o=make("option","",label);o.value=value;activity.append(o);
  }
  if(item.type==="service")activity.value="servico";
  const uf=make("select","zm-field");
  const none=make("option","","Estado (UF)");none.value="";uf.append(none);
  for(const state of "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ")){
   const o=make("option","",state);o.value=state;uf.append(o);
  }
  const ncm=make("input","zm-field");ncm.placeholder="NCM confirmado (opcional)";ncm.maxLength=8;ncm.inputMode="numeric";
  const sale=make("input","zm-field");sale.type="number";sale.min="0.01";sale.step="0.01";sale.placeholder="Preço de venda (R$)";
  const rate=make("input","zm-field");rate.type="number";rate.min="0";rate.max="90";rate.step="0.01";rate.placeholder="Alíquota conhecida (%)";
  const run=make("button","zm-button zm-secondary","Ver estimativa");run.type="submit";
  const out=make("div","zm-tax-result");
  form.append(activity,regime,uf,ncm,sale,rate,run);
  form.addEventListener("submit",async e=>{
   e.preventDefault();run.disabled=true;empty(out,"Calculando estimativa...");
   try{
    const d=await api.request("POST","/market/tax-context",{
     activity:activity.value,regime:regime.value,uf:uf.value,ncm:ncm.value,
     salePrice:sale.value,estimatedBusinessRate:rate.value,productName:item.name
    });
    out.replaceChildren();
    if(d.manualSimulation){
     out.append(make("p","zm-tax-total","Impacto hipotético: "+money(d.manualSimulation.estimatedAmount)));
     out.append(make("p","zm-caption",d.manualSimulation.label));
    }else out.append(make("p","zm-caption","Sem alíquota informada, não é possível estimar o imposto devido."));
    out.append(make("p","zm-caption","Esta simulação não substitui a apuração tributária do negócio."));
   }catch{empty(out,"Não conseguimos calcular a estimativa. Revise os dados.");}
   finally{run.disabled=false;}
  });
  target.append(form,out);
 }
 function offersPanel(item,target){
  empty(target,"Buscando ofertas semelhantes...");
  api.request("GET","/market/offers?q="+encodeURIComponent(String(item.name||"").slice(0,80))).then(data=>{
   target.replaceChildren();
   if(!data.offers?.length){
    empty(target,"Nenhuma oferta semelhante disponível nesta consulta.");return;
   }
   target.append(make("p","zm-caption","Anúncios possivelmente semelhantes. Confirme modelo, unidade e preço na loja antes de comparar."));
   for(const offer of data.offers.slice(0,7)){
    const line=make("div","zm-offer");
    line.append(make("strong","",offer.title.slice(0,110)),
      make("span","",money(offer.price)+" · "+offer.seller),
      make("small","zm-quote-meta","Consultado em "+(date(offer.queriedAt)||"data não informada")+" · atualização da loja não informada"));
    const a=safeLink("Abrir anúncio",offer.url);if(a)line.append(a);target.append(line);
   }
  }).catch(()=>empty(target,"Não foi possível consultar anúncios de lojas agora."));
 }
 function publicPanel(records,target){
  target.replaceChildren();
  const eligible=(records||[]).filter(q=>q.price_type==="public_purchase").slice(0,7);
  if(!eligible.length){empty(target,"Nenhuma referência de compra pública disponível.");return;}
  target.append(make("p","zm-caption","Valores de compras governamentais, não ofertas de varejo."));
  for(const q of eligible){
   const div=make("div","zm-offer");
   div.append(make("strong","",money(q.price)),make("span","",text(q.seller).slice(0,100)));
   div.append(make("small","",date(q.observed_at)||"Data não informada"));
   const l=safeLink("Conferir fonte",q.url);if(l)div.append(l);target.append(div);
  }
 }
 function quoteAction(item,quote,parent){
  const confirmation=make("div","zm-confirm");
  confirmation.append(make("p","","Adicionar esta cotação à simulação selecionada? O preço de venda e os custos continuarão inalterados."));
  const save=btn("Confirmar",async()=>{
   save.disabled=true;
   try{
    const verified=await api.request("POST","/market/reference/verify",{itemId:item.id,quoteId:quote.id});
    const entry={...verified.reference,accepted:false};
    window.dispatchEvent(new CustomEvent("zuz:market:reference",{detail:entry}));
    if(!entry.accepted)throw new Error("Selecione um produto compatível na simulação antes de usar esta cotação.");
    parent.replaceChildren(make("p","zm-success","Referência adicionada à simulação."));
   }catch(error){parent.replaceChildren(make("p","zm-error",error.message||"Não foi possível validar esta cotação."));}
   finally{save.disabled=false;}
  },"zm-primary");
  confirmation.append(save,btn("Cancelar",()=>parent.replaceChildren(),"zm-secondary"));
  parent.replaceChildren(confirmation);
 }
 function showPrices(item,response,container,advanced){
  container.replaceChildren();
  const market=response.commercial||{offers:[],summary:null};
  const quotes=Array.isArray(market.offers)?market.offers:[];
  const summary=market.summary||null;
  if(summary){
   const stats=make("div","zm-price-stats");
   for(const [label,val] of [["Mínimo",summary.min],["Média",summary.average],["Máximo",summary.max]]){
    const block=make("div","zm-price-stat");
    block.append(make("small","",label),make("strong","",money(val)));stats.append(block);
   }
   container.append(stats,make("p","zm-caption",summary.offers+" lojas comparáveis · "+summary.region+" · Cotações recentes"));
  }
  if(quotes.length){
   container.append(make("p","zm-mini-title","Preços encontrados"));
   const list=make("div","zm-prices");
   for(const quote of quotes.slice(0,8)){
    const entry=make("article","zm-price-line"),lead=make("div","zm-price-lead");
    lead.append(make("strong","zm-price-value",money(quote.price)),
     make("span","zm-seller",quote.seller));
    const meta=make("span","zm-quote-meta","Observado em "+(date(quote.observedAt)||"data não informada")+" · "+quote.region);
    const actions=make("div","zm-quote-actions");
    const link=safeLink("Ver fonte",quote.url);if(link)actions.append(link);
    if(mode==="simulations"){
     const area=make("div","zm-inline-confirm");
     actions.append(btn("Usar na simulação",()=>quoteAction(item,quote,area),"zm-secondary"),area);
    }
    entry.append(lead,meta,actions);list.append(entry);
   }
   container.append(list);
   if(!summary)container.append(make("p","zm-caption","Amostra insuficiente para um preço médio confiável. Consulte os valores individuais."));
  }else{
   empty(container,"Ainda não há cotação comercial verificável para este produto.");
   container.append(make("p","zm-caption","Você pode continuar a precificação informando seus próprios custos."));
  }
  if((response.quotes||[]).some(q=>q.price_type==="public_purchase")){
   const historical=make("details","zm-optional");
   historical.append(make("summary","","Ver referências de compras públicas"));
   const body=make("div","zm-optional-content");historical.append(body);
   historical.addEventListener("toggle",()=>{if(historical.open)publicPanel(response.quotes,body);});
   advanced.append(historical);
  }
 }
 async function selectProduct(row){
  const token=++sequence;chosen=null;detail.hidden=false;results.hidden=true;
  empty(detail,"Abrindo produto...");inform("");
  try{
   const response=await api.request("GET","/market/v2/item?id="+encodeURIComponent(row.item_id));
   if(token!==sequence)return;
   const item=response.item;chosen=item;detail.replaceChildren();
   const back=btn("← Voltar aos resultados",()=>{
    sequence++;chosen=null;detail.hidden=true;results.hidden=false;detail.replaceChildren();input.focus();
   },"zm-back");
   const head=make("div","zm-product-heading");
   head.append(make("h3","zm-selected-title",item.name),
    make("p","zm-product-identity",[item.brand,item.model,item.unit].filter(Boolean).join(" · ")||"Produto selecionado"));
   const actionBox=make("div","zm-product-action");
   actionBox.append(btn(mode==="products"?"Usar na precificação":"Cadastrar este produto",()=>confirmProduct(item,actionBox),"zm-primary"));
   const priceSection=block("Preços de mercado","zm-market-prices");
   const priceContent=make("div","zm-price-content");priceSection.append(priceContent);
   empty(priceContent,"Consultando preços...");
   const extra=make("div","zm-advanced");
   extra.append(progressive("Informações do produto",body=>body.append(detailsPanel(item))));
   extra.append(progressive("Histórico de preços",body=>historyPanel(item,body)));
   extra.append(progressive("Informações tributárias",body=>taxPanel(item,body)));
   extra.append(progressive("Possíveis ofertas semelhantes",body=>offersPanel(item,body)));
   detail.append(back,head,priceSection,actionBox,extra);
   try{
    const prices=await api.request("GET","/market/quotes?id="+encodeURIComponent(item.id));
    if(token!==sequence)return;
    showPrices(item,prices,priceContent,extra);
   }catch{
    if(token===sequence)empty(priceContent,"Não foi possível consultar preços agora. Você ainda pode cadastrar e precificar manualmente.");
   }
  }catch{
   if(token===sequence)empty(detail,"Não conseguimos abrir este produto. Tente selecionar outro resultado.");
  }
 }
 form.addEventListener("submit",search);
 const productField=document.getElementById("nameInput");
 if(mode==="products"&&productField&&!input.value)input.value=productField.value||"";
}
const product=document.getElementById("nameInput")?.closest(".field");
if(product){const target=make("div","zm-mount");product.after(target);marketBox(target,"products");}
const cost=document.getElementById("compRows")?.parentElement;
if(cost){const target=make("div","zm-mount");cost.append(target);marketBox(target,"costs");}
const simulationMount=document.getElementById("marketSearchMount");
if(simulationMount)marketBox(simulationMount,"simulations");
else{
 const simulations=document.getElementById("marketStats");
 if(simulations?.parentElement){
  const target=make("div","zm-mount");simulations.parentElement.insertBefore(target,simulations);
  marketBox(target,"simulations");
 }
}
})();
