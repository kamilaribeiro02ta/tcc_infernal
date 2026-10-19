(function(){
"use strict";
if(!window.ZUZAPI)return;
const api=window.ZUZAPI;
const money=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n)||0);
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const button=(text,cls,fn)=>{const e=make("button",cls,text);e.type="button";e.addEventListener("click",fn);return e;};
const sourceName=s=>s==="openfoodfacts"?"Open Food Facts":s==="comprasgov"?"Compras.gov.br":s==="openprices"?"Open Prices":s==="catmat_archive_2018"?"CATMAT (acervo 2018)":s;
function init(anchor,mode){
 if(!anchor)return;
 const root=make("div","zuz-market");
 const heading=make("strong","zuz-market__title","Referências públicas de produtos e serviços");
 const hint=make("p","zuz-market__hint","Consulte o catálogo sem expor custos privados. Informações externas não substituem o cálculo financeiro.");
 const bar=make("div","zuz-market__search");
 const search=make("input","zuz-market__input");
 search.type="search";search.maxLength=72;search.autocomplete="off";search.setAttribute("aria-label","Nome, código de barras ou código de catálogo");
 search.placeholder="Produto, serviço ou código";
 const go=button("Pesquisar","zuz-market__btn",run);
 const status=make("p","zuz-market__status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const results=make("div","zuz-market__results"),details=make("div","zuz-market__data");
 details.hidden=true;bar.append(search,go);
 root.append(heading,hint,bar,status,results,details);anchor.append(root);
 let selected=null,serial=0;
 const message=t=>{status.textContent=t;};
 search.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();run();}});
 if(mode==="products"){
  const modal=document.getElementById("productModal");
  if(modal)new MutationObserver(()=>{
    if(!modal.classList.contains("open"))return;
    selected=null;results.replaceChildren();details.replaceChildren();details.hidden=true;
    search.value=document.getElementById("nameInput")?.value||"";
    message("A pesquisa é opcional. Seus custos permanecem privados.");
  }).observe(modal,{attributes:true,attributeFilter:["class"]});
  const name=document.getElementById("nameInput");
  if(name){
   search.placeholder="Digite o nome e clique em Pesquisar";
   name.addEventListener("input",()=>{
    search.value=name.value.trim();
    if(window.ZUZMarketSelected&&name.value.trim()!==window.ZUZMarketSelected.name.slice(0,60)){
     window.ZUZMarketSelected=null;selected=null;
    }
   });
  }
 }
 async function run(){
  const input=mode==="simulations"?(search.value||document.getElementById("product")?.selectedOptions[0]?.textContent||""):mode==="products"?(search.value||document.getElementById("nameInput")?.value||""):search.value;
  const term=input.trim().slice(0,72);
  if(term.length<3){message("Informe ao menos 3 caracteres para pesquisar.");return;}
  search.value=term;results.replaceChildren();details.replaceChildren();details.hidden=true;
  const ticket=++serial;go.disabled=true;message("Consultando catálogo público...");
  try{
   const data=await api.request("GET","/market/catalog?q="+encodeURIComponent(term));
   if(ticket!==serial)return;
   if(!data.items?.length)message("Nenhum item encontrado. Você pode continuar a precificação manualmente.");
   else{
    message(data.items.length+" item(ns) encontrado(s). Selecione um item equivalente para consultar preços.");
    for(const item of data.items.slice(0,15)){
     const label=[item.name,item.brand,item.model].filter(Boolean).join(" · ");
     const itemBtn=button(label,"zuz-market__option",()=>selectItem(item));
     itemBtn.append(make("small","",sourceName(item.source)+" · "+(item.type==="service"?"Serviço":"Produto")+(item.barcode?" · "+item.barcode:"")));
     results.append(itemBtn);
    }
   }
   if(data.warnings?.length)message(status.textContent+" Algumas fontes estão temporariamente indisponíveis.");
  }catch(e){if(ticket===serial)message("Pesquisa indisponível: "+e.message+". Continue manualmente.");}
  finally{if(ticket===serial)go.disabled=false;}
 }
 async function selectItem(item){
  selected=item;details.hidden=false;details.replaceChildren();results.replaceChildren();
  message("Item selecionado: "+item.name+". Consultando cotações...");
  if(mode==="products"){
   window.ZUZMarketSelected={...item};
   const name=document.getElementById("nameInput");if(name){name.value=item.name.slice(0,60);name.dispatchEvent(new Event("input",{bubbles:true}));}
  }
  try{
   const data=await api.request("GET","/market/quotes?id="+encodeURIComponent(item.id));
   if(selected!==item)return;
   present(item,data);
  }catch(e){message("A consulta de preços falhou: "+e.message+". Os cálculos manuais continuam disponíveis.");}
 }
 function present(item,data){
  details.replaceChildren();
  const h=make("strong","zuz-market__title",item.name);details.append(h);
  const attribution=make("p","zuz-market__fine","Catálogo: "+sourceName(item.source)+". "+(data.note||""));details.append(attribution);
  if(item.source==="catmat_archive_2018")details.append(make("p","zuz-market__fine","Cadastro histórico de 2018: a descrição não representa a disponibilidade atual no mercado."));
  if(data.warnings?.length)details.append(make("p","zuz-market__fine",data.warnings.join(" ")));
  if(!data.quotes?.length){details.append(make("p","zuz-market__fine","Não foram encontrados preços públicos para este item. A precificação manual continua disponível."));message("Sem preços verificáveis para o item.");if(mode==="products")addRecommendation(item,details);return;}
  message((data.summary?.current??0)+" referência(s) recentes de "+data.quotes.length+" armazenada(s). Valores antigos são identificados.");
  if(!data.groups?.length)details.append(make("p","zuz-market__fine","Não há cotações recentes para comparação; o preço deve ser calculado com os custos informados."));
  for(const group of data.groups.slice(0,4)){
   const type=group.type==="public_purchase"?"Contratação pública":group.type==="retail"?"Preço de varejo":"Atacado";
   const heading=make("p","zuz-market__fine",type+" · "+(group.unit||"unidade não informada")+" · "+(group.region||"região não informada")+" · "+group.count+" cotação(ões) · "+group.distinctStores+" estabelecimento(s)");
   const grid=make("div","zuz-market__stats");
   for(const [label,n] of [["Menor",group.min],["Média",group.average],["Mediana",group.median],["Maior",group.max]]){
    const box=make("div","zuz-market__stat");
    box.append(make("small","",label),make("strong","",money(n)));grid.append(box);
   }
   details.append(heading,grid);
  }
  const records=data.quotes.slice(0,8);
  for(const q of records){
   const line=make("div","zuz-market__source"),left=make("div");
   const d=new Date(q.observed_at),date=Number.isFinite(d.getTime())?d.toLocaleDateString("pt-BR"):"data não informada";
   const label=q.confidence==="alta"?"Alta":q.confidence==="media"?"Média":"Baixa";
   const kind=q.price_type==="public_purchase"?"Compra pública":"Varejo";
   left.append(make("strong","",(q.seller||"Estabelecimento não identificado")+" · "+money(q.price)),
    make("small","",sourceName(q.source)+" · "+kind+" · "+(q.unit||"unidade não definida")+
     " · "+(q.region||"região não informada")+" · preço de "+date+" · "+(q.stale?"Desatualizado":"Recente")),
    make("small","","Confiabilidade "+label+(q.reasons?.length?" — "+q.reasons.join("; "):"")));
   line.append(left);
   if(q.url&&/^https:\/\//.test(q.url)){const a=make("a","","Consultar origem");a.href=q.url;a.rel="noopener noreferrer";a.target="_blank";line.append(a);}
   details.append(line);
  }
  if(data.quotes.some(q=>q.stale))details.append(make("p","zuz-market__fine","Registros fora da janela de atualização não participam das estatísticas: 30 dias para varejo e 180 dias para compras públicas."));
  if(mode==="products")addRecommendation(item,details);
  if(mode==="simulations")addSimulationImport(item,data,details);
 }
 function addRecommendation(item,container){
  const b=button("Calcular sugestão com meus custos","zuz-market__btn zuz-market__action",async()=>{
   const direct=[...document.querySelectorAll("#costItems .cost-item-amount")].reduce((sum,el)=>sum+(Number(el.value)||0),0);
   const margin=Number(document.getElementById("targetMarginInput")?.value||30);
   if(!direct||direct<0){message("Cadastre os custos do produto antes de solicitar uma sugestão.");return;}
   b.disabled=true;
   try{
    const result=await api.request("POST","/market/recommend",{itemId:item.id,directCost:direct,targetMargin:margin});
    const msg="Custo informado "+money(direct)+" · mínimo sustentável "+money(result.minimumSustainablePrice)+" · sugerido "+money(result.suggestedPrice)+(result.marketMedian===null?" (somente custos e margem)":" (inclui referências equivalentes verificadas)");
    const p=make("p","zuz-market__fine",msg);container.append(p);
    const apply=button("Usar preço sugerido","zuz-market__btn zuz-market__action",()=>{
     const field=document.getElementById("salePriceInput");if(!field)return;
     field.value=Number(result.suggestedPrice).toFixed(2);field.dispatchEvent(new Event("input",{bubbles:true}));
     message("Preço aplicado somente ao formulário. Salve o produto para confirmar.");
     apply.disabled=true;
    });container.append(apply);
   }catch(e){message("Não foi possível calcular a sugestão: "+e.message);}
   finally{b.disabled=false;}
  });container.append(b);
 }
 function addSimulationImport(item,data,container){
  const selectedId=document.getElementById("product")?.value;
  if(!selectedId)return;
  const selectBarcode=item.barcode||"",observations=data.quotes.filter(x=>!x.stale&&x.matching==="codigo_de_barras"&&x.confidence!=="baixa"&&x.price_type==="retail"&&x.unit==="un"&&x.condition==="new"&&x.seller);
  const distinct=new Map();for(const quote of observations)if(!distinct.has(quote.seller.toLowerCase()))distinct.set(quote.seller.toLowerCase(),quote);
  const regionBuckets=new Map();for(const quote of distinct.values()){const region=(quote.region||"sem_regiao").toLowerCase();if(!regionBuckets.has(region))regionBuckets.set(region,[]);regionBuckets.get(region).push(quote);}
  const records=[...regionBuckets.values()].sort((a,b)=>b.length-a.length)[0]||[];
  const b=button("Usar preços públicos no cenário","zuz-market__btn zuz-market__action",async()=>{
   try{
    const snapshot=await api.request("GET","/company");
    if(document.getElementById("product")?.value!==selectedId){message("O produto da simulação mudou. Faça uma nova pesquisa.");return;}
    const original=snapshot.products?.find(x=>String(x.id)===selectedId);
    if(!original?.barcode||original.barcode!==selectBarcode||records.length<3){
     message("Para incorporar preços ao cenário, vincule primeiro este produto ao mesmo código de barras em Produtos e tenha pelo menos 3 cotações recentes.");
     return;
    }
    if(!window.confirm("Adicionar até 8 preços públicos verificados somente à simulação atual?"))return;
    const add=document.getElementById("addReference"),name=document.getElementById("referenceName"),price=document.getElementById("referencePrice");
    let count=0;
    for(const ref of records.slice(0,8)){
     if(!add||!name||!price)break;
     name.value=(sourceName(ref.source)+" — "+(ref.seller||"referência")+" "+new Date(ref.observed_at).toLocaleDateString("pt-BR")).slice(0,90);
     price.value=String(ref.price);add.click();count++;
    }
    message(count+" preço(s) públicos importados para o cenário, sem alterar o produto.");
    b.disabled=true;
   }catch(e){message("Não foi possível importar referências: "+e.message);}
  });container.append(b);
  if(!records.length)container.append(make("p","zuz-market__fine","Sem preços recentes de varejo para importação. Compras públicas são apenas referência contextual."));
 }
 return {search:run};
}
const productTarget=document.getElementById("nameInput")?.closest(".field");
if(productTarget){const wrap=make("div");productTarget.after(wrap);init(wrap,"products");}
const costsTarget=document.getElementById("compRows")?.parentElement;
if(costsTarget)init(costsTarget,"costs");
const simTarget=document.getElementById("marketStats")?.parentElement;
if(simTarget){const wrap=make("div");simTarget.insertBefore(wrap,document.getElementById("marketStats"));init(wrap,"simulations");}
})();
