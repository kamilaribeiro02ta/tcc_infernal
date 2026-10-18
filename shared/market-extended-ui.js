(function(){
"use strict";
if(!window.ZUZAPI)return;
const api=window.ZUZAPI;
const DOM=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
const BRL=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n)||0);
const D=t=>{const x=new Date(t);return Number.isFinite(x.valueOf())?x.toLocaleDateString("pt-BR"):"sem data"};
const section=(parent,title,desc)=>{
 const s=DOM("section","zuz-market-x-panel"),h=DOM("h4","zuz-v3-group",title);
 s.append(h);if(desc)s.append(DOM("p","zuz-v3-muted",desc));parent.append(s);return s;
};
const link=(label,url)=>{const a=DOM("a","zuz-v3-source",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;};
const status=(container,message)=>container.replaceChildren(DOM("p","zuz-v3-muted",message));
const exactMedian=list=>{const a=list.slice().sort((x,y)=>x-y);return a.length?(a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2):null;};
function yearlyPoints(rows){
 const data=new Map();
 for(const item of rows||[]){
  const year=String(item.date||"").slice(0,4),v=Number(item.price);
  if(!/^\d{4}$/.test(year)||!Number.isFinite(v)||v<=0)continue;
  if(!data.has(year))data.set(year,[]);
  data.get(year).push(v);
 }
 return [...data].map(([year,prices])=>({year:Number(year),median:exactMedian(prices),count:prices.length})).sort((a,b)=>a.year-b.year);
}
function sparkline(parent,points){
 if(!Array.isArray(points)||points.length<2)return;
 const valid=points.filter(x=>Number(x.price)>0&&Number.isFinite(Date.parse(x.date))).slice(-120);
 if(valid.length<2)return;
 const min=Math.min(...valid.map(x=>x.price)),max=Math.max(...valid.map(x=>x.price)),span=Math.max(.01,max-min);
 const start=Date.parse(valid[0].date),end=Date.parse(valid.at(-1).date),period=Math.max(1,end-start);
 const ns="http://www.w3.org/2000/svg";
 const svg=document.createElementNS(ns,"svg");
 svg.setAttribute("viewBox","0 0 460 112");svg.setAttribute("role","img");
 svg.setAttribute("aria-label","Gráfico histórico de preços observados, sem interpolação de cotações ausentes");
 svg.classList.add("zuz-market-x-chart");
 const line=document.createElementNS(ns,"polyline");
 const coords=valid.map(p=>{
  const x=10+(Date.parse(p.date)-start)/period*440,y=100-((p.price-min)/span*86);
  return x.toFixed(2)+","+y.toFixed(2);
 }).join(" ");
 line.setAttribute("points",coords);line.setAttribute("fill","none");line.setAttribute("stroke","currentColor");
 line.setAttribute("stroke-width","2");line.setAttribute("stroke-linecap","round");
 line.setAttribute("stroke-linejoin","round");svg.append(line);
 parent.append(svg);
}
async function loadKeepa(parent,item){
 const s=section(parent,"Keepa · histórico de preços da Amazon Brasil",
  "Quando a oferta é localizada por código de barras, é possível consultar a série histórica do mesmo item. A série não é comparável automaticamente a um produto apenas semelhante.");
 const result=DOM("div");s.append(result);
 const barcode=item.barcode||item.gtin||"";
 if(!barcode){
  status(result,"Este item não possui GTIN/EAN identificado. A consulta Keepa por nome não foi ativada para a loja brasileira; não foi possível confirmar o mesmo produto.");
  s.append(link("Consultar informações da Keepa","https://keepa.com/api-docs/product.html"));return;
 }
 status(result,"Consultando identificação e histórico Keepa...");
 try{
  const d=await api.request("GET","/market/keepa?gtin="+encodeURIComponent(barcode));
  result.replaceChildren();
  if(!d.products?.length){
   status(result,d.warning||"Nenhum histórico Keepa encontrado por este código.");return;
  }
  for(const p of d.products){
   const card=DOM("article","zuz-market-x-card");
   card.append(DOM("strong","zuz-v3-option-name",p.title||"Produto identificado na Amazon Brasil"));
   card.append(DOM("p","zuz-v3-muted","ASIN: "+p.asin+" · Marca: "+(p.brand||"não informada")+" · Fonte: "+p.source));
   card.append(DOM("p","zuz-market-intel-strong",p.latest!==null?"Último valor registrado: "+BRL(p.latest):"Sem preço válido atualmente"));
   card.append(link("Conferir produto na Amazon Brasil",p.url));
   const timeline=yearlyPoints(p.history);
   const years=DOM("div","zuz-market-x-years");
   for(const year of [2018,2026]){
    const y=timeline.find(x=>x.year===year);
    const cell=DOM("div","zuz-market-x-year");
    cell.append(DOM("small","",String(year)),DOM("strong","",y?BRL(y.median):"Sem registro"),
     DOM("span","",y?y.count+" alteração(ões) observadas":"Nenhum preço daquele ano"));
    years.append(cell);
   }
   card.append(years);
   sparkline(card,p.history);
   card.append(DOM("p","zuz-v3-muted","Os pontos indicam alterações registradas, não vendas, nem preços diários garantidos. Médias por ano são medianas das alterações registradas, não médias de preços praticados no ano."));
   result.append(card);
  }
 }catch{status(result,"Keepa indisponível nesta consulta. Nenhum preço foi criado artificialmente.");}
}
async function loadSectors(parent,item){
 const name=String(item.name||"").slice(0,90);
 const medical=/medic|seringa|agulha|curativ|luva cirurg|farmac|hospital|equipamento medic/i.test(name+" "+(item.category||""));
 const build=/cimento|areia|tijolo|argamassa|vergalh|telha|concreto|obra|construc|tinta acrilica/i.test(name+" "+(item.category||""));
 if(!medical&&!build)return;
 const sector=medical?"bps":"sinapi",title=medical?"BPS · aquisições de saúde":"SINAPI · custos de construção";
 const sectionEl=section(parent,title,"Referências setoriais não representam preços de varejo. Unidades, estados e datas devem ser compatíveis.");
 const result=DOM("div");sectionEl.append(result);status(result,"Buscando registros oficiais importados...");
 try{
  const d=await api.request("GET","/market/sector-prices?source="+sector+"&q="+encodeURIComponent(name));
  result.replaceChildren();
  if(!d.items?.length){status(result,d.warning||"Sem preços setoriais importados para esta pesquisa.");return;}
  for(const x of d.items.slice(0,12)){
   const card=DOM("article","zuz-market-x-card");
   card.append(DOM("strong","zuz-v3-option-name",x.product_name),DOM("p","zuz-market-intel-strong",BRL(x.price)+" / "+x.unit),
    DOM("p","zuz-v3-muted","Referência: "+D(x.reference_date)+" · UF: "+(x.uf||"não informada")+" · "+(medical?"Aquisição em saúde":"Referência de insumos de construção")),
    link("Ver origem oficial",x.provenance_url));
   result.append(card);
  }
 }catch{status(result,"Não foi possível consultar esta base setorial.");}
}
async function loadInflation(parent){
 const s=section(parent,"Inflação · IPCA do Banco Central",
 "O IPCA permite atualizar monetariamente um valor antigo; não cria uma cotação de mercado de 2018.");
 const out=DOM("div");s.append(out);status(out,"Consultando série mensal SGS 433...");
 try{
  const d=await api.request("GET","/market/ipca?fromYear=2018");
  out.replaceChildren();
  const rows=d.series||[],start="2018-01";
  const last=rows.at(-1)?.date?.slice(0,7);
  if(!last||rows[0]?.date?.slice(0,7)!==start){status(out,d.warning||"Série mensal incompleta; não será calculado o acumulado.");return;}
  const count=(Number(last.slice(0,4))-2018)*12+Number(last.slice(5));
  if(rows.length!==count){status(out,"Existem meses ausentes na série: não é possível calcular a inflação acumulada com segurança.");return;}
  const factor=rows.reduce((value,row)=>value*(1+Number(row.rate)/100),1);
  out.append(DOM("p","zuz-market-intel-strong","IPCA acumulado de jan/2018 até "+last.replace("-","/")+": "+((factor-1)*100).toLocaleString("pt-BR",{maximumFractionDigits:2})+"%"));
  out.append(DOM("p","zuz-v3-muted","Indicador macroeconômico (IBGE/BCB), não aumento observado do preço deste produto."));
  out.append(link("Fonte: Banco Central — SGS 433",d.url||"https://dadosabertos.bcb.gov.br/dataset/433"));
 }catch{status(out,"Série IPCA indisponível; não foi feita extrapolação.");}
}
function loadLegal(parent){
 const s=section(parent,"Tributação e legislação oficial",
 "Mercadorias como vassouras, celulares e alimentos podem ser tributadas. O valor depende do NCM confirmado, regime, UF, operação e data de vigência.");
 s.append(DOM("p","zuz-v3-warning","Uma descrição genérica de catálogo não define a alíquota da sua empresa. Consulte o NCM oficial e preencha o contexto tributário antes de simular."));
 const links=DOM("div","zuz-market-intel-links");
 links.append(link("Classif — tabela NCM oficial","https://portalunico.siscomex.gov.br/classif/#/nomenclatura?perfil=publico"),
  link("Calculadora RTC — Receita Federal","https://consumo.tributos.gov.br/servico/calcular-tributos-consumo/calculadora"),
  link("Simples Nacional — Receita Federal","https://www8.receita.fazenda.gov.br/SimplesNacional/"),
  link("IBPT — transparência tributária","https://deolhonoimposto.ibpt.org.br/Site/API"));
 s.append(links,DOM("p","zuz-v3-muted","A Calculadora RTC não disponibiliza API pública online de cálculo; o módulo offline precisa ser hospedado separadamente antes de uma integração automática."));
}
document.addEventListener("zuz:market:selected",event=>{
 const {item,info}=event.detail||{};
 if(!item||!info)return;
 const wrap=DOM("div","zuz-market-x");info.append(wrap);
 loadLegal(wrap);
 loadKeepa(wrap,item);
 loadSectors(wrap,item);
 loadInflation(wrap);
});
})();