(()=>{"use strict";const $=id=>document.getElementById(id),money=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0),num=v=>Number.parseFloat(v)||0,E={form:$("form"),segment:$("segment"),operationType:$("operationType"),positioning:$("positioning"),targetCustomer:$("targetCustomer"),monthlyUnits:$("monthlyUnits"),defaultMargin:$("defaultMargin"),taxesPct:$("taxesPct"),sellingFeesPct:$("sellingFeesPct"),fixed:$("fixedRows"),comp:$("compRows"),addFixed:$("addFixed"),addComp:$("addComp"),fixedTotal:$("fixedTotal"),market:$("market"),summary:$("summary"),status:$("status")};function row(parent,a="",b="",kind="fixed"){const r=document.createElement("div");r.className="row";r.innerHTML='<input class="a" aria-label="Descrição do gasto ou referência"><input class="b" aria-label="Valor em reais" type="number" min="0" step=".01"><button type="button" aria-label="Remover linha">×</button>';r.querySelector(".a").placeholder=kind==="fixed"?"Ex: Aluguel":"Concorrente";r.querySelector(".a").value=a;r.querySelector(".b").value=b;r.querySelectorAll("input").forEach(i=>i.addEventListener("input",update));r.querySelector("button").onclick=()=>{r.remove();update()};parent.appendChild(r)}function rows(parent,kind){return [...parent.querySelectorAll(".row")].map(r=>kind==="fixed"?{label:r.querySelector(".a").value||"Custo fixo",value:num(r.querySelector(".b").value)}:{name:r.querySelector(".a").value||"Concorrente",price:num(r.querySelector(".b").value)}).filter(x=>(kind==="fixed"?x.value:x.price)>0)}function read(){return{segment:E.segment.value.trim(),operationType:E.operationType.value,positioning:E.positioning.value,targetCustomer:E.targetCustomer.value.trim(),monthlyUnits:Math.max(1,Math.round(num(E.monthlyUnits.value)||1)),defaultMargin:Math.min(90,num(E.defaultMargin.value)),taxesPct:num(E.taxesPct.value),sellingFeesPct:num(E.sellingFeesPct.value),fixedCosts:rows(E.fixed,"fixed"),competitors:rows(E.comp,"comp")}}function update(){const s=read(),fixed=s.fixedCosts.reduce((a,i)=>a+i.value,0),prices=s.competitors.map(i=>i.price);E.fixedTotal.textContent=money(fixed);E.market.textContent=prices.length?"Média de mercado: "+money(prices.reduce((a,b)=>a+b,0)/prices.length):"Nenhuma referência cadastrada.";E.summary.textContent=(s.segment||"Seu negócio")+" · "+
  (s.fixedCosts.length&&Number.isInteger(Number(E.monthlyUnits.value))&&Number(E.monthlyUnits.value)>0
    ?"rateio estimado "+money(fixed/Number(E.monthlyUnits.value))+" por unidade"
    :"rateio ainda não informado")+
  " · "+(s.taxesPct+s.sellingFeesPct).toFixed(1)+"% em taxas · margem desejada "+s.defaultMargin+
  "%. Estes dados não são um preço de venda.";}function fill(){E.fixed.replaceChildren();E.comp.replaceChildren();const s=ZUZPricing.loadSettings();["segment","operationType","positioning","targetCustomer","monthlyUnits","defaultMargin","taxesPct","sellingFeesPct"].forEach(k=>E[k].value=s[k]);s.fixedCosts.forEach(i=>row(E.fixed,i.label,i.value,"fixed"));if(!s.fixedCosts.length){row(E.fixed,"Aluguel","","fixed");row(E.fixed,"Energia","","fixed")}s.competitors.forEach(i=>row(E.comp,i.name,i.price,"comp"));if(!s.competitors.length)row(E.comp,"","","comp");update()}E.addFixed.onclick=()=>row(E.fixed,"","","fixed");E.addComp.onclick=()=>row(E.comp,"","","comp");E.form.querySelectorAll("input,select").forEach(i=>i.addEventListener("input",update));E.form.onsubmit=async e=>{
  e.preventDefault();
  const margin=Number(E.defaultMargin.value),units=Number(E.monthlyUnits.value);
  const taxes=Number(E.taxesPct.value),fees=Number(E.sellingFeesPct.value);
  E.status.className="workspace-status";
  if(E.monthlyUnits.value.trim()===""||!Number.isInteger(units)||units<1||
     E.defaultMargin.value.trim()===""||!Number.isFinite(margin)||margin<0||margin>90||
     E.taxesPct.value.trim()===""||E.sellingFeesPct.value.trim()===""||
     !Number.isFinite(taxes)||!Number.isFinite(fees)||taxes<0||fees<0||
     taxes+fees+margin>=100){
    E.status.textContent="Confira o volume mensal, a margem (0 a 90%) e as taxas. A soma de tributos, taxas e margem deve ser menor que 100%.";
    E.status.classList.add("is-error");return;
  }
  const button=E.form.querySelector('button[type="submit"]');
  if(button)button.disabled=true;
  E.status.textContent="Salvando no banco de dados...";
  try{
    await ZUZPricing.saveSettings(read());
    E.status.textContent="Perfil salvo no banco. Produtos e simulações poderão usar estas informações.";
    E.status.classList.add("is-success");
  }catch(error){
    E.status.textContent=error?.message||"Não foi possível salvar. Confira a conexão e tente novamente.";
    E.status.classList.add("is-error");
  }finally{if(button)button.disabled=false;}
};fill();if(window.ZUZAPI){window.ZUZCompanyData.load().then(({company})=>{if(!company)return;const settings={...ZUZPricing.loadSettings(),...(company.settings||{}),segment:company.segment,operationType:company.operation_type};localStorage.setItem(ZUZPricing.SETTINGS_KEY,JSON.stringify(settings));fill();window.dispatchEvent(new Event("zuz:costs-loaded"));}).catch(()=>{});}})();