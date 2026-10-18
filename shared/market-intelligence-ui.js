(function(){
"use strict";
if(!window.ZUZAPI)return;
const api=window.ZUZAPI;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const price=x=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(x)||0);
const pct=x=>new Intl.NumberFormat("pt-BR",{maximumFractionDigits:2}).format(Number(x)||0)+"%";
const iso=x=>{const d=new Date(x);return x&&Number.isFinite(d.getTime())?d.toLocaleDateString("pt-BR"):"não informada";};
const link=(label,url)=>{const a=el("a","zuz-v3-source",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;};
const button=(caption,callback)=>{const b=el("button","zuz-v3-btn zuz-v3-primary",caption);b.type="button";b.addEventListener("click",callback);return b;};
const field=(parent,label,element)=>{const wrap=el("label","zuz-market-intel-field");wrap.append(el("span","",label),element);parent.append(wrap);return element;};
const input=(placeholder,type="text")=>{const n=el("input","zuz-v3-control");n.type=type;n.placeholder=placeholder;return n;};
const select=(opts)=>{const s=el("select","zuz-v3-control");for(const [v,t] of opts){const o=el("option","",t);o.value=v;s.append(o)}return s;};
function mountTaxes(parent,{name="",kind="product",salePrice=null,gtin=""}={}){
 const section=el("section","zuz-market-intel-panel");
 section.append(el("h4","zuz-v3-group","Tributos e contexto do negócio"),
  el("p","zuz-v3-muted","O imposto da empresa depende do regime, atividade, UF, operação e classificação fiscal. A carga IBPT do produto é informação diferente do tributo que a empresa recolhe."));
 const form=el("form","zuz-market-intel-form");
 const operation=field(form,"Atividade",select([["","Selecione"],["revenda","Revenda"],["producao","Produção própria"],["servico","Prestação de serviço"],["misto","Atividade mista"]]));
 if(kind==="service")operation.value="servico";
 const regime=field(form,"Regime tributário",select([["","Selecione"],["mei","MEI"],["simples","Simples Nacional"],["presumido","Lucro Presumido"],["real","Lucro Real"],["outro","Outro"]]));
 const uf=field(form,"UF da operação",select([["","Selecione"],...("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ").map(x=>[x,x]))]));
 const ncm=field(form,"NCM do produto (8 dígitos)",input("Informe código validado"));
 ncm.maxLength=8;ncm.inputMode="numeric";
 const ncmLookup=el("details","zuz-market-intel-ncm");
 const searchNcm=input("Pesquisar NCM por descrição ou código");searchNcm.value=name;
 const ncmButton=button("Buscar possíveis NCMs",async()=>{
  ncmList.replaceChildren(el("p","zuz-v3-muted","Consultando códigos candidatos..."));ncmButton.disabled=true;
  try{
   let d=await api.request("GET","/market/classif?q="+encodeURIComponent(searchNcm.value.trim()));
   if(!d.items?.length){
    const backup=await api.request("GET","/market/ncm?q="+encodeURIComponent(searchNcm.value.trim()));
    d={...backup,note:"Fonte auxiliar BrasilAPI. Confirme o código no Classif oficial antes de utilizar."};
   }
   ncmList.replaceChildren();
   if(!d.items?.length){ncmList.append(el("p","zuz-v3-muted",d.warning||"Não foram encontrados códigos candidatos. Consulte a classificação fiscal com um contador."));return;}
   ncmList.append(el("p","zuz-v3-muted",d.note));
   for(const row of d.items){
    const option=el("button","zuz-v3-option");option.type="button";
    option.append(el("strong","zuz-v3-option-name",row.code+" · "+row.description),
     el("small","zuz-v3-option-meta","Código candidato — confirmar classificação"));
    option.addEventListener("click",()=>{ncm.value=row.code;ncmList.replaceChildren(el("p","zuz-v3-muted","NCM preenchido como candidato. Confirme antes de usar."));});
    ncmList.append(option);
   }
  }catch(error){ncmList.replaceChildren(el("p","zuz-v3-muted","Busca indisponível: "+error.message));}
  finally{ncmButton.disabled=false;}
 });
 const ncmList=el("div","zuz-market-intel-ncm-results");
 ncmLookup.append(el("summary","","Encontrar código NCM (opcional)"),searchNcm,ncmButton,ncmList);
 form.append(ncmLookup);
 const serviceCode=field(form,"Código do serviço (NBS/LC 116)",input("Código validado"));
 const sale=field(form,"Preço de venda (R$)",input("Ex.: 150,00","number"));
 sale.step="0.01";sale.min="0";if(Number(salePrice)>0)sale.value=String(salePrice);
 const rate=field(form,"Alíquota efetiva informada (%) — opcional",input("Não é calculada automaticamente","number"));
 rate.step="0.01";rate.min="0";rate.max="90";
 const consent=el("label","zuz-market-intel-consent");
 const check=input("","checkbox");consent.append(check,el("span","","Consultar estimativa IBPT (se houver chave configurada), usando CNPJ informado voluntariamente"));
 const cnpj=field(form,"CNPJ para consulta opcional ao IBPT",input("Somente números"));
 cnpj.inputMode="numeric";cnpj.maxLength=18;cnpj.disabled=true;cnpj.closest("label").hidden=true;
 check.addEventListener("change",()=>{cnpj.disabled=!check.checked;cnpj.closest("label").hidden=!check.checked;});
 form.append(consent);
 const run=el("button","zuz-v3-btn zuz-v3-primary","Simular com estes dados");run.type="submit";
 form.append(run);
 const report=el("div","zuz-market-intel-report");report.setAttribute("aria-live","polite");
 form.addEventListener("submit",async event=>{
  event.preventDefault();run.disabled=true;report.replaceChildren(el("p","zuz-v3-muted","Consultando referência tributária..."));
  const body={activity:operation.value,regime:regime.value,uf:uf.value,ncm:ncm.value,serviceCode:serviceCode.value,
   salePrice:sale.value,estimatedBusinessRate:rate.value,productName:name,gtin,useIbpt:check.checked,cnpj:check.checked?cnpj.value:""};
  try{
   const d=await api.request("POST","/market/tax-context",body);
   report.replaceChildren();
   if(d.manualSimulation){
    report.append(el("p","zuz-market-intel-strong","Impacto hipotético: "+price(d.manualSimulation.estimatedAmount)+" ("+pct(d.manualSimulation.rate)+")"));
    report.append(el("p","zuz-v3-muted",d.manualSimulation.label));
   }else report.append(el("p","zuz-v3-muted","Sem alíquota informada: não há valor de imposto a calcular automaticamente."));
   if(d.ibpt?.available){
    report.append(el("p","zuz-market-intel-strong","IBPT — carga aproximada no preço: "+price(d.ibpt.approximateAmount)+" ("+pct(d.ibpt.total)+")"));
    report.append(el("p","zuz-v3-muted",d.ibpt.note+" Vigência: "+String(d.ibpt.validFrom||"não informada")+" a "+String(d.ibpt.validTo||"não informada")+"." ));
   }else if(d.ibpt?.warning)report.append(el("p","zuz-v3-muted",d.ibpt.warning));
   for(const item of d.warnings||[])report.append(el("p","zuz-v3-muted","• "+item));
   report.append(el("p","zuz-v3-warning",d.disclaimer));
   const sources=el("div","zuz-market-intel-links");
   for(const s of d.sources||[])sources.append(link(s.label,s.url));
   report.append(sources);
  }catch(error){report.replaceChildren(el("p","zuz-v3-warning","Não foi possível simular: "+error.message));}
  finally{run.disabled=false;}
 });
 section.append(form,report);
 parent.append(section);
}
async function timeline(parent,item){
 const section=el("section","zuz-market-intel-panel");
 section.append(el("h4","zuz-v3-group","Comparação de preços por ano"),
  el("p","zuz-v3-muted","O ano 2018 do catálogo técnico não significa que existe uma cotação de 2018."));
 const body=el("div","zuz-market-intel-years");section.append(body);parent.append(section);
 try{
  const d=await api.request("GET","/market/history?id="+encodeURIComponent(item.id));
  for(const year of [2018,2026]){
   const x=(d.years||[]).find(r=>r.year===year),cell=el("div","zuz-market-intel-year");
   cell.append(el("small","",String(year)),el("strong","",x?price(x.median):"Sem cotação"));
   cell.append(el("span","",x?x.count+" registro(s) para o mesmo item":"Nenhum preço verificado deste ano"));
   body.append(cell);
  }
  if(d.hasComparable2018and2026){
   const a=d.years.find(x=>x.year===2018),b=d.years.find(x=>x.year===2026);
   body.after(el("p","zuz-market-intel-strong","Variação nominal observada: "+pct((b.median/a.median-1)*100)+" (sem ajuste de inflação)."));
  }else body.after(el("p","zuz-v3-muted",d.note));
  const other=d.years.filter(x=>x.year!==2018&&x.year!==2026);
  if(other.length)section.append(el("p","zuz-v3-muted","Outros anos com preços: "+other.map(x=>x.year).join(", ")+"."));
 }catch(error){body.replaceChildren(el("p","zuz-v3-muted","Histórico temporariamente indisponível."));}
}
function offerInfo(info,offer){
 info.hidden=false;info.replaceChildren();
 const card=el("section","zuz-v3-ficha");
 card.append(el("div","zuz-v3-kicker","OFERTA ENCONTRADA EM LOJA"),
  el("h4","zuz-v3-ficha-title",offer.title),
  el("p","zuz-market-intel-strong",price(offer.price)+" · "+offer.seller),
  el("p","zuz-v3-muted","Consulta: "+iso(offer.observedAt)+" · "+offer.source),
  el("p","zuz-v3-warning",offer.warning),link("Abrir anúncio e conferir preço",offer.url));
 const add=document.getElementById("newProductBtn");
 if(add)card.append(button("Cadastrar este item manualmente",()=>{
  add.click();const field=document.getElementById("nameInput");
  if(field){field.value=offer.title.slice(0,60);field.dispatchEvent(new Event("input",{bubbles:true}));}
 }));
 info.append(card);
 mountTaxes(info,{name:offer.title,salePrice:offer.price});
 info.scrollIntoView({behavior:"smooth",block:"nearest"});
}
document.addEventListener("zuz:market:search",async event=>{
 const {root,query,info}=event.detail||{};
 if(!root||!query)return;
 let container=root.querySelector(".zuz-market-intel-offers");
 if(!container){container=el("section","zuz-market-intel-offers");root.append(container);}
 container.replaceChildren(el("p","zuz-v3-muted","Consultando ofertas de lojas, quando a API estiver habilitada..."));
 try{
  const d=await api.request("GET","/market/offers?q="+encodeURIComponent(query));
  container.replaceChildren(el("h4","zuz-v3-group","Ofertas de lojas e produtos similares"));
  if(!d.offers?.length){
   container.append(el("p","zuz-v3-muted",d.warnings?.join(" ")||"Nenhum anúncio comparável retornado pela fonte configurada."));
   return;
  }
  container.append(el("p","zuz-v3-muted","Anúncios semelhantes, não necessariamente produtos idênticos. Confirme modelo, condição, preço e entrega na loja."));
  for(const offer of d.offers){
   const card=el("button","zuz-v3-option zuz-market-intel-offer");card.type="button";
   card.append(el("strong","zuz-v3-option-name",offer.title),
    el("small","zuz-v3-option-meta",offer.seller+" · "+offer.source),
    el("small","zuz-v3-option-status",price(offer.price)));
   card.addEventListener("click",()=>offerInfo(info||root.querySelector(".zuz-v3-info"),offer));
   container.append(card);
  }
 }catch{container.replaceChildren(el("p","zuz-v3-muted","Consulta de ofertas externas indisponível. O catálogo local permanece disponível."));}
});
async function itemOffers(parent,item,info){
 const section=el("section","zuz-market-intel-panel");
 section.append(el("h4","zuz-v3-group","Preços anunciados para produtos semelhantes"));
 const rows=el("div");
 rows.append(el("p","zuz-v3-muted","Pesquisando ofertas atuais quando o provedor estiver configurado..."));
 section.append(rows);parent.append(section);
 try{
  const d=await api.request("GET","/market/offers?q="+encodeURIComponent(String(item.name||"").slice(0,80)));
  rows.replaceChildren();
  if(!d.offers?.length){
   rows.append(el("p","zuz-v3-muted",d.warnings?.join(" ")||"Sem anúncios semelhantes retornados."));return;
  }
  rows.append(el("p","zuz-v3-muted","Preços atuais observados na consulta, sem comprovação de equivalência à descrição histórica do catálogo."));
  for(const offer of d.offers.slice(0,8)){
   const card=el("button","zuz-v3-option");card.type="button";
   card.append(el("strong","zuz-v3-option-name",offer.title),
    el("small","zuz-v3-option-meta",offer.seller+" · "+iso(offer.observedAt)),
    el("small","zuz-v3-option-status",price(offer.price)));
   card.addEventListener("click",()=>offerInfo(info,offer));
   rows.append(card);
  }
 }catch{rows.replaceChildren(el("p","zuz-v3-muted","Ofertas externas indisponíveis no momento."));}
}
document.addEventListener("zuz:market:selected",event=>{
 const {item,info}=event.detail||{};
 if(!item||!info)return;
 const wrapper=el("div","zuz-market-intel-details");info.append(wrapper);
 timeline(wrapper,item);
 itemOffers(wrapper,item,info);
 mountTaxes(wrapper,{name:item.name,kind:item.type,gtin:item.barcode});
});
})();