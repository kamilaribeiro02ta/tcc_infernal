(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const money = value => new Intl.NumberFormat("pt-BR", {style:"currency",currency:"BRL"}).format(Number(value)||0);
  const number = value => {const n=Number.parseFloat(value);return Number.isFinite(n)?n:0;};
  const elements = {
    product:$("product"),margin:$("margin"),price:$("price"),units:$("units"),suggested:$("suggested"),
    cost:$("cost"),technical:$("technical"),net:$("net"),contribution:$("contribution"),
    breakEven:$("breakEven"),profit:$("profit"),range:$("range"),use:$("use"),status:$("simulationStatus")
  };
  let products=[];
  try {
    const saved=JSON.parse(localStorage.getItem("zuz-pricing-products-v2")||"[]");
    products=Array.isArray(saved)?saved:[];
  } catch {
    elements.status.textContent="Não foi possível ler os produtos salvos. Verifique os dados do navegador.";
    elements.status.classList.add("is-error");
  }
  const product=()=>products.find(item=>String(item.id)===elements.product.value)||products[0]||null;
  const directCost=item=>Math.max(0,number(item?.baseCost))+(Array.isArray(item?.additionalCosts)?item.additionalCosts:[]).reduce((sum,cost)=>sum+Math.max(0,number(cost.value)),0);
  function calculate() {
    const current=product();
    if(!current)return null;
    const margin=number(elements.margin.value);
    const units=number(elements.units.value);
    const price=number(elements.price.value);
    if(margin<0||margin>90||!Number.isInteger(units)||units<1||price<0){
      elements.status.textContent="Informe margem de 0 a 90%, preço não negativo e quantidade inteira maior que zero.";
      elements.status.className="workspace-status is-error";
      return null;
    }
    elements.status.textContent="";
    elements.status.className="workspace-status";
    const result=ZUZPricing.calculate({unitDirectCost:directCost(current),salePrice:price,targetMargin:margin,units});
    elements.suggested.textContent=money(result.suggestedPrice);
    elements.cost.textContent=money(result.unitBaseCost);
    elements.technical.textContent=money(result.technicalPrice);
    elements.net.textContent=result.netMarginPct.toFixed(1)+"%";
    elements.contribution.textContent=money(result.contributionMargin);
    elements.breakEven.textContent=result.breakEvenUnits?result.breakEvenUnits+" un.":"Não calculado";
    elements.profit.textContent=money(result.profit);
    elements.range.textContent=money(result.recommendedRange.low)+" a "+money(result.recommendedRange.high);
    return result;
  }
  function loadProduct() {
    const current=product();
    if(!current)return;
    elements.margin.value=current.targetMargin??ZUZPricing.loadSettings().defaultMargin;
    elements.price.value=current.salePrice??"";
    elements.units.value=current.units??100;
    calculate();
  }
  if(!products.length){
    const option=document.createElement("option");
    option.value="";option.textContent="Nenhum produto cadastrado";
    elements.product.append(option);
    elements.status.textContent="Cadastre um produto em Produtos para utilizar as simulações.";
    elements.status.className="workspace-status";
    elements.use.disabled=true;
    [elements.product,elements.margin,elements.price,elements.units].forEach(el=>el.disabled=true);
    return;
  }
  products.forEach(item=>{
    const option=document.createElement("option");
    option.value=String(item.id);
    option.textContent=String(item.name||"Produto sem nome");
    elements.product.append(option);
  });
  [elements.margin,elements.price,elements.units].forEach(input=>input.addEventListener("input",calculate));
  elements.product.addEventListener("change",loadProduct);
  elements.use.addEventListener("click",()=>{
    const result=calculate();
    if(!result)return;
    elements.price.value=result.suggestedPrice.toFixed(2);
    calculate();
  });
  loadProduct();
})();