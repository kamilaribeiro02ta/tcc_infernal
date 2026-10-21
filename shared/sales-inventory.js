(function(){
 "use strict";
 const root=document.getElementById("zuzSalesInventory");
 if(!root||!window.ZUZAPI||!window.ZUZCompanyData)return;
 const currency=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const date=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
 let products=[],inventory=[],sales=[],busy=false,loaded=false,failed=false;
 root.innerHTML=`
 <div class="zuz-sales__head"><div><span class="zuz-sales__eyebrow">GESTÃO DE PRODUTOS</span><h2>Vendas e estoque</h2><p>Registre suas vendas e acompanhe as unidades disponíveis.</p></div></div>
 <div class="zuz-sales__grid" id="zuzSalesMetrics"></div><div class="zuz-sales__stock-overview" id="zuzStockOverview"></div>
 <div class="zuz-sales__workspace">
   <div class="zuz-sales__tabs" role="tablist" aria-label="Operação">
     <button type="button" class="zuz-sales__tab is-active" id="zuzTabSale" role="tab" aria-selected="true" aria-controls="zuzSaleForm">Registrar venda</button>
     <button type="button" class="zuz-sales__tab" id="zuzTabStock" role="tab" aria-selected="false" aria-controls="zuzStockForm">Atualizar estoque</button>
   </div>
   <div class="zuz-sales__body">
     <form id="zuzSaleForm" class="zuz-sales__form" role="tabpanel" aria-labelledby="zuzTabSale">
       <div class="zuz-sales__form-head"><h3>Registrar venda</h3><p>Informe os dados da venda. O estoque será atualizado automaticamente.</p></div>
       <div class="zuz-sales__fields">
         <label>Produto<select name="productId" required></select></label>
         <label>Quantidade vendida<input name="quantity" type="number" min="1" step="1" placeholder="Ex.: 3" required></label>
         <label>Preço por unidade (R$)<input name="unitPrice" type="number" min="0.01" step="0.01" placeholder="0,00" required></label>
         <label>Data da venda<input name="soldAt" type="date" required></label>
       </div>
       <div class="zuz-sales__operation-summary" id="zuzSaleSummary" aria-live="polite">Selecione um produto para consultar o saldo disponível.</div>
       <div class="zuz-sales__form-footer"><div class="zuz-sales__feedback" aria-live="polite"></div><button type="submit">Registrar venda</button></div>
     </form>
     <form id="zuzStockForm" class="zuz-sales__form" role="tabpanel" aria-labelledby="zuzTabStock" hidden>
       <div class="zuz-sales__form-head"><h3>Atualizar estoque</h3><p>Defina a quantidade total disponível, sem alterar as projeções de venda.</p></div>
       <div class="zuz-sales__fields">
         <label>Produto<select name="productId" required></select></label>
         <label>Quantidade em estoque<input name="quantity" type="number" min="0" step="1" placeholder="Ex.: 50" required></label>
       </div>
       <div class="zuz-sales__operation-summary" id="zuzStockSummary" aria-live="polite">Selecione um produto para consultar o estoque atual.</div>
       <div class="zuz-sales__form-footer"><div class="zuz-sales__feedback" aria-live="polite"></div><button type="submit">Salvar estoque</button></div>
     </form>
   </div>
 </div>
 <div class="zuz-sales__records"><div class="zuz-sales__table"><h3>Estoque por produto</h3><div id="zuzStockTable"><p class="zuz-sales__empty">Carregando estoque...</p></div></div><div class="zuz-sales__table"><h3>Últimas vendas registradas</h3><div id="zuzSalesTable"><p class="zuz-sales__empty">Carregando vendas...</p></div></div></div>`;

 const stockForm=root.querySelector("#zuzStockForm"),saleForm=root.querySelector("#zuzSaleForm"),metrics=root.querySelector("#zuzSalesMetrics");
 saleForm.elements.soldAt.value=date();
 const tabs=[root.querySelector("#zuzTabSale"),root.querySelector("#zuzTabStock")];
 function selectTab(index,focus=false){
  [saleForm,stockForm].forEach((form,i)=>{form.hidden=i!==index;});
  tabs.forEach((tab,i)=>{tab.classList.toggle("is-active",i===index);tab.setAttribute("aria-selected",String(i===index));tab.tabIndex=i===index?0:-1;});
  if(focus)tabs[index].focus();
 }
 tabs.forEach((tab,i)=>{tab.addEventListener("click",()=>selectTab(i));tab.addEventListener("keydown",event=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?tabs.length-1:(i+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;selectTab(next,true);});});
 selectTab(0);
 function updateSummary(){
  const balances=snapshot();
  const saleId=saleForm.elements.productId.value,stockId=stockForm.elements.productId.value;
  const saleBalance=balances.get(saleId);
  const quantity=Number(saleForm.elements.quantity.value);
  const unitPrice=Number(saleForm.elements.unitPrice.value);
  const saleText=!saleId?"Selecione um produto para consultar o saldo disponível.":saleBalance===undefined?"Estoque ainda não informado para este produto.":"Disponível: "+saleBalance+" unidade(s)"+(quantity>0&&Number.isInteger(quantity)?" · Saldo após venda: "+(saleBalance-quantity)+" unidade(s)"+(quantity>saleBalance?" — estoque insuficiente":""):"")+(quantity>0&&unitPrice>0?" · Total: "+currency(quantity*unitPrice):"");
  const saleSummary=root.querySelector("#zuzSaleSummary");saleSummary.textContent=saleText;saleSummary.classList.toggle("is-warning",saleId!==""&&saleBalance!==undefined&&quantity>saleBalance);
  root.querySelector("#zuzStockSummary").textContent=!stockId?"Selecione um produto para consultar o estoque atual.":"Estoque atual: "+(balances.get(stockId)??"não informado")+" unidade(s). O novo valor substituirá o atual.";
 }
 [saleForm,stockForm].forEach(form=>form.addEventListener("input",updateSummary));
 [saleForm,stockForm].forEach(form=>form.addEventListener("change",updateSummary));

 function feedback(form,message,type="info"){const el=form.querySelector(".zuz-sales__feedback");el.textContent=message;el.dataset.state=message?type:"";el.setAttribute("role",type==="error"?"alert":"status");}
 function snapshot(){return new Map(inventory.map(x=>[String(x.product_id),Number(x.quantity)]));}
 function render(){
  const byId=new Map(products.map(p=>[String(p.id),p]));
  const balances=snapshot();
  const options='<option value="">Selecione um produto</option>'+products.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join("");
  for(const form of [stockForm,saleForm]){
   const select=form.elements.productId,previous=select.value;
   select.innerHTML=options;select.value=previous&&byId.has(previous)?previous:"";
   form.querySelector("button[type=submit]").disabled=busy||!products.length||!loaded||failed;
  }
  const projections=products.reduce((a,p)=>{if(!window.ZUZPricing?.calculate)return a;let v;try{v=window.ZUZPricing.calculate({unitDirectCost:(Number(p.baseCost)||0)+(Array.isArray(p.additionalCosts)?p.additionalCosts.reduce((s,x)=>s+(Number(x.value)||0),0):0),salePrice:Number(p.salePrice)||0,targetMargin:Number(p.targetMargin??30),units:Number(p.units)||0,category:p.category,productId:p.id,productName:p.name});}catch{return a;}a.revenue+=Number(v.revenue)||0;a.profit+=Number(v.profit)||0;return a;},{revenue:0,profit:0});
  const totalStock=Array.from(balances.values()).reduce((sum,q)=>sum+q,0);
  root.querySelector("#zuzStockOverview").innerHTML='<div><span>Em estoque</span><strong>'+totalStock.toLocaleString("pt-BR")+'</strong></div><div><span>Unidades vendidas (histórico consultado)</span><strong>'+sales.reduce((sum,s)=>sum+Number(s.quantity||0),0).toLocaleString("pt-BR")+'</strong></div>';
  const actual=sales.reduce((a,s)=>{const q=Number(s.quantity)||0,price=Number(s.unit_price)||0,cost=Number(s.unit_cost)||0;a.revenue+=q*price;a.profit+=q*(price-cost);a.units+=q;return a;},{revenue:0,profit:0,units:0});
  metrics.innerHTML=[["Faturamento previsto",currency(projections.revenue)],["Lucro previsto*",currency(projections.profit)],["Faturamento realizado",currency(actual.revenue)],["Lucro realizado*",currency(actual.profit)]].map(([label,value])=>'<article class="zuz-sales__metric"><span>'+label+'</span><strong>'+value+'</strong></article>').join("");
  let hint=root.querySelector("#zuzProfitHint");if(!hint){hint=document.createElement("p");hint.id="zuzProfitHint";hint.className="zuz-sales__hint";metrics.after(hint);}hint.textContent="*Valores estimados com base nos custos, taxas e configurações informados. O lucro realizado é calculado pelas vendas registradas, sem representar lucro contábil fechado. O histórico exibido contém até 500 vendas.";
  updateSummary();
  const list=products.map(p=>'<tr><td>'+esc(p.name)+'</td><td>'+(balances.has(String(p.id))?String(balances.get(String(p.id))):"Não informado")+'</td></tr>').join("");
  root.querySelector("#zuzStockTable").innerHTML=failed?'<div class="zuz-sales__empty-state"><span>Não foi possível carregar o estoque.</span><button type="button" data-retry-sales>Tentar novamente</button></div>':!loaded?'<p class="zuz-sales__empty">Carregando estoque...</p>':products.length?'<table><thead><tr><th>Produto</th><th>Disponível</th></tr></thead><tbody>'+list+'</tbody></table>':'<p class="zuz-sales__empty">Cadastre um produto para começar.</p>';
  root.querySelector("#zuzSalesTable").innerHTML=failed?'<div class="zuz-sales__empty-state"><span>Não foi possível carregar as vendas.</span><button type="button" data-retry-sales>Tentar novamente</button></div>':!loaded?'<p class="zuz-sales__empty">Carregando vendas...</p>':sales.length?'<table><thead><tr><th>Data</th><th>Produto</th><th>Qtd.</th><th>Preço un.</th><th>Total</th><th>Lucro estimado</th></tr></thead><tbody>'+sales.slice(0,15).map(s=>'<tr><td>'+esc(String(s.sold_at).slice(0,10).split("-").reverse().join("/"))+'</td><td>'+esc(byId.get(String(s.product_id))?.name||"Produto")+'</td><td>'+esc(s.quantity)+'</td><td>'+currency(s.unit_price)+'</td><td>'+currency(Number(s.quantity)*Number(s.unit_price))+'</td><td>'+currency(Number(s.quantity)*(Number(s.unit_price)-Number(s.unit_cost)))+'</td></tr>').join("")+'</tbody></table>':'<p class="zuz-sales__empty">Nenhuma venda real registrada.</p>';
 }
 async function load(){
  try{
   const company=await window.ZUZCompanyData.load();
   products=Array.isArray(company.products)?company.products:[];
   const data=await window.ZUZAPI.request("GET","/company/inventory");
   if(!Array.isArray(data.inventory)||!Array.isArray(data.sales))throw new Error("Resposta inválida.");
   inventory=data.inventory;sales=data.sales;loaded=true;failed=false;
   feedback(stockForm,"");
  }catch(e){loaded=false;failed=true;inventory=[];sales=[];feedback(stockForm,"","error");}
  render();
 }
 root.addEventListener("click",event=>{if(event.target.closest("[data-retry-sales]"))load();});
 async function submit(form,method,path,data,success){
  if(busy||!loaded||failed)return;busy=true;feedback(form,"Salvando...");render();
  try{await window.ZUZAPI.request(method,path,data);await load();feedback(form,success,"success");window.dispatchEvent(new CustomEvent("zuz:sales:updated"));}catch(e){feedback(form,e.message||"Falha ao salvar.","error");}finally{busy=false;render();}
 }
 stockForm.addEventListener("submit",e=>{e.preventDefault();const productId=stockForm.elements.productId.value;const quantity=Number(stockForm.elements.quantity.value);if(!productId||!Number.isSafeInteger(quantity)||quantity<0)return feedback(stockForm,"Informe produto e quantidade válida.");submit(stockForm,"PUT","/company/inventory/"+encodeURIComponent(productId),{quantity},"Estoque atualizado.");});
 saleForm.elements.productId.addEventListener("change",()=>{const p=products.find(x=>String(x.id)===saleForm.elements.productId.value);if(p)saleForm.elements.unitPrice.value=Number(p.salePrice||0).toFixed(2);});
 saleForm.addEventListener("submit",e=>{e.preventDefault();const productId=saleForm.elements.productId.value,quantity=Number(saleForm.elements.quantity.value),unitPrice=Number(saleForm.elements.unitPrice.value),soldAt=saleForm.elements.soldAt.value;if(!productId||!Number.isSafeInteger(quantity)||quantity<1||!Number.isFinite(unitPrice)||unitPrice<=0||!soldAt)return feedback(saleForm,"Informe os dados válidos da venda.");(snapshot().get(productId)===undefined?feedback(saleForm,"Cadastre o estoque antes de registrar a venda."):quantity>snapshot().get(productId)?feedback(saleForm,"Estoque insuficiente para esta venda."):submit(saleForm,"POST","/company/sales",{productId,quantity,unitPrice,soldAt},"Venda registrada e estoque atualizado."));});
 window.addEventListener("zuz:products:updated",load);
 load();
})();
