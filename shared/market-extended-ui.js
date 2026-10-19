(function(){
"use strict";
if(!window.ZUZAPI)return;
const api=window.ZUZAPI;
const DOM=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
const section=(parent,title,desc)=>{
 const s=DOM("section","zuz-market-x-panel"),h=DOM("h4","zuz-v3-group",title);
 s.append(h);if(desc)s.append(DOM("p","zuz-v3-muted",desc));parent.append(s);return s;
};
const link=(label,url)=>{const a=DOM("a","zuz-v3-source",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;};
const status=(container,message)=>container.replaceChildren(DOM("p","zuz-v3-muted",message));
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
 loadInflation(wrap);
});
})();