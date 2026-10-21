(function(){
 "use strict";
 const root=document.getElementById("zuzSalesInventory");
 if(!root||!window.ZUZAPI||!window.ZUZCompanyData)return;
 const currency=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const date=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
 let products=[],inventory=[],sales=[],busy=false;
 root.innerHTML='<div class="zuz-sales__head"><div><h2>Vendas e estoque</h2><p>Separe os resultados previstos das vendas já realizadas.</p></div></div><div class="zuz-sales__grid" id="zuzSalesMetrics"></div><div class="zuz-sales__body"><form id="zuzStockForm" class="zuz-sales__form"><h3>Controlar estoque</h3><p>Informe o total de unidades disponíveis do produto. Isso não altera a previsão de vendas.</p><div class="zuz-sales__fields"><label>Produto<select name="productId" required></select></label><label>Unidades disponíveis<input name="quantity" type="number" min="0" step="1" required></label></div><button type="submit">Salvar estoque</button><div class="zuz-sales__feedback" aria-live="polite"></div></form><form id="zuzSaleForm" class="zuz-sales__form"><h3>Registrar venda realizada</h3><p>Ao registrar uma venda, o sistema desconta automaticamente as unidades do estoque.</p><div class="zuz-sales__fields"><label>Produto<select name="productId" required></select></label><label>Quantidade vendida<input name="quantity" type="number" min="1" step="1" required></label><label>Preço unitário vendido (R$)<input name="unitPrice" type="number" min="0.01" step="0.01" required></label><label>Data da venda<input name="soldAt" type="date" required></label></div><button type="submit">Registrar venda</button><div class="zuz-sales__feedback" aria-live="polite"></div></form></div><div class="zuz-sales__table"><h3>Estoque por produto</h3><div id="zuzStockTable"></div></div><div class="zuz-sales__table"><h3>Últimas vendas registradas</h3><div id="zuzSalesTable"></div></div>';
 const stockForm=root.querySelector("#zuzStockForm"),saleForm=root.querySelector("#zuzSaleForm"),metrics=root.querySelector("#zuzSalesMetrics");
 saleForm.elements.soldAt.value=date();
 function feedback(form,message){form.querySelector(".zuz-sales__feedback").textContent=message;}
 function snapshot(){return new Map(inventory.map(x=>[String(x.product_id),Number(x.quantity)]));}
 function render(){
  const byId=new Map(products.map(p=>[String(p.id),p]));
  const balances=snapshot();
  const options='<option value="">Selecione um produto</option>'+products.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join("");
  for(const form of [stockForm,saleForm]){
   const select=form.elements.productId,previous=select.value;
   select.innerHTML=options;select.value=previous&&byId.has(previous)?previous:"";
   form.querySelector("button[type=submit]").disabled=busy||!products.length;
  }
  const projections=products.reduce((a,p)=>{const q=Number(p.units)||0,price=Number(p.salePrice)||0,cost=Number(p.baseCost||0)+(Array.isArray(p.additionalCosts)?p.additionalCosts.reduce((s,x)=>s+(Number(x.value)||0),0):0);a.revenue+=q*price;a.profit+=q*(price-cost);return a;},{revenue:0,profit:0});
  const actual=sales.reduce((a,s)=>{const q=Number(s.quantity)||0,price=Number(s.unit_price)||0,cost=Number(s.unit_cost)||0;a.revenue+=q*price;a.profit+=q*(price-cost);a.units+=q;return a;},{revenue:0,profit:0,units:0});
  metrics.innerHTML=[["Faturamento previsto",currency(projections.revenue)],["Lucro bruto previsto",currency(projections.profit)],["Faturamento realizado",currency(actual.revenue)],["Lucro realizado*",currency(actual.profit)]].map(([label,value])=>'<article class="zuz-sales__metric"><span>'+label+'</span><strong>'+value+'</strong></article>').join("");
  metrics.insertAdjacentHTML("afterend",'<p class="zuz-sales__hint" id="zuzProfitHint">*Estimativa calculada sobre as vendas registradas, descontando custos unitários e encargos conhecidos; não é lucro líquido contábil. Os totais realizados consideram os últimos 500 registros.</p>');
  root.querySelectorAll("#zuzProfitHint").forEach((n,i)=>{if(i>0)n.remove();});
  const list=products.map(p=>'<tr><td>'+esc(p.name)+'</td><td>'+String(balances.get(String(p.id))??0)+'</td></tr>').join("");
  root.querySelector("#zuzStockTable").innerHTML=products.length?'<table><thead><tr><th>Produto</th><th>Disponível</th></tr></thead><tbody>'+list+'</tbody></table>':'<p class="zuz-sales__empty">Cadastre um produto para começar.</p>';
  root.querySelector("#zuzSalesTable").innerHTML=sales.length?'<table><thead><tr><th>Data</th><th>Produto</th><th>Qtd.</th><th>Total</th></tr></thead><tbody>'+sales.slice(0,15).map(s=>'<tr><td>'+esc(String(s.sold_at).slice(0,10).split("-").reverse().join("/"))+'</td><td>'+esc(byId.get(String(s.product_id))?.name||"Produto")+'</td><td>'+esc(s.quantity)+'</td><td>'+currency(Number(s.quantity)*Number(s.unit_price))+'</td></tr>').join("")+'</tbody></table>':'<p class="zuz-sales__empty">Nenhuma venda real registrada.</p>';
 }
 async function load(){
  const [company,data]=await Promise.all([window.ZUZCompanyData.load(),window.ZUZAPI.request("GET","/company/inventory")]);
  products=company.products||[];inventory=data.inventory||[];sales=data.sales||[];render();
 }
 async function submit(form,method,path,data,success){
  if(busy)return;busy=true;feedback(form,"Salvando...");render();
  try{await window.ZUZAPI.request(method,path,data);await load();feedback(form,success);window.dispatchEvent(new CustomEvent("zuz:sales:updated"));}catch(e){feedback(form,e.message||"Falha ao salvar.");}finally{busy=false;render();}
 }
 stockForm.addEventListener("submit",e=>{e.preventDefault();const productId=stockForm.elements.productId.value;const quantity=Number(stockForm.elements.quantity.value);if(!productId||!Number.isSafeInteger(quantity)||quantity<0)return feedback(stockForm,"Informe produto e quantidade válida.");submit(stockForm,"PUT","/company/inventory/"+encodeURIComponent(productId),{quantity},"Estoque atualizado.");});
 saleForm.elements.productId.addEventListener("change",()=>{const p=products.find(x=>String(x.id)===saleForm.elements.productId.value);if(p)saleForm.elements.unitPrice.value=Number(p.salePrice||0).toFixed(2);});
 saleForm.addEventListener("submit",e=>{e.preventDefault();const productId=saleForm.elements.productId.value,quantity=Number(saleForm.elements.quantity.value),unitPrice=Number(saleForm.elements.unitPrice.value),soldAt=saleForm.elements.soldAt.value;if(!productId||!Number.isSafeInteger(quantity)||quantity<1||!Number.isFinite(unitPrice)||unitPrice<=0||!soldAt)return feedback(saleForm,"Informe os dados válidos da venda.");submit(saleForm,"POST","/company/sales",{productId,quantity,unitPrice,soldAt},"Venda registrada e estoque atualizado.");});
 window.addEventListener("zuz:products:updated",load);
 load().catch(e=>feedback(stockForm,e.message||"Não foi possível consultar o estoque."));
})();
