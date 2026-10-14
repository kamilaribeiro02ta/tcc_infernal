(async function(){
  "use strict";
  const core=window.ZUZSimulationCore,api=window.ZUZAPI;
  const ids=["product","originalProduct","resetAll","resetScenario","scenarioTabs","price","margin","units",
    "changeMode","changePct","priceSlider","unitsSlider","priceSliderLabel","unitsSliderLabel",
    "suggested","cost","technical","net","contribution","breakEven","revenue","profit","range",
    "simulationStatus","use","chart","chartDescription","comparisonCards","goalType","goalAmount",
    "goalUnits","goalDetail","marketStats","referenceList","referenceName","referencePrice",
    "addReference","simulationName","saveSimulation","historyList","aiMessages","aiForm",
    "aiInput","askAI","aiProposal"];
  const E=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
  const money=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
  const integer=v=>new Intl.NumberFormat("pt-BR",{maximumFractionDigits:0}).format(v);
  let workspace;
  try{workspace=await window.ZUZCompanyData.load();}
  catch{window.location.replace("../Login/login.html");return;}
  if(!workspace.company){window.location.replace("../onboarding/onboarding.html");return;}
  const products=Array.isArray(workspace.products)?workspace.products:[];
  const settings=ZUZPricing.loadSettings();
  let selected="equilibrado",scenarios=[],references=[],history=[],lastResult=null,historyNotice="";
  const product=()=>products.find(p=>String(p.id)===E.product.value)||null;
  const active=()=>scenarios.find(s=>s.id===selected)||null;
  function status(message="",kind=""){
    E.simulationStatus.textContent=message;
    E.simulationStatus.className="workspace-status"+(kind?" is-"+kind:"");
  }
  function node(tag,text,className){
    const el=document.createElement(tag);
    if(text!==undefined)el.textContent=String(text);
    if(className)el.className=className;
    return el;
  }
  function makeButton(text,fn,label){
    const button=node("button",text);
    button.type="button";
    if(label)button.setAttribute("aria-label",label);
    button.addEventListener("click",fn);
    return button;
  }
  function originalScenario(id){
    const p=product();
    const item=core.defaults(p).find(x=>x.id===id);
    if(item&&(p.targetMargin===undefined||p.targetMargin===null))item.margin=settings.defaultMargin;
    return item;
  }
  function setInputValues(){
    const s=active();if(!s)return;
    for(const key of ["price","units","margin","changeMode","changePct"])E[key].value=s[key];
    E.priceSlider.max=String(Math.max(100,Math.ceil(Math.max(Number(s.price)||0,Number(product()?.salePrice)||0)*2+20)));
    E.unitsSlider.max=String(Math.max(200,Math.min(1000000,Math.ceil(Math.max(Number(s.units)||0,Number(product()?.units)||0)*2+50))));
    syncSliders();
  }
  function syncSliders(){
    const s=active();if(!s)return;
    E.priceSlider.max=String(Math.max(Number(E.priceSlider.max),Number(s.price)||0));
    E.unitsSlider.max=String(Math.max(Number(E.unitsSlider.max),Number(s.units)||0));
    E.priceSlider.value=Number(s.price)||0;
    E.unitsSlider.value=Number(s.units)||1;
    E.priceSliderLabel.textContent=Number.isFinite(Number(s.price))?money(Number(s.price)):"—";
    E.unitsSliderLabel.textContent=Number.isFinite(Number(s.units))?integer(Number(s.units))+" un.":"—";
  }
  function renderTabs(){
    E.scenarioTabs.replaceChildren();
    scenarios.forEach(s=>{
      const b=makeButton(s.label,()=>selectScenario(s.id),"Editar cenário "+s.label);
      b.className="sim-tab";b.id="sim-tab-"+s.id;
      b.setAttribute("role","tab");b.setAttribute("aria-selected",s.id===selected?"true":"false");
      b.setAttribute("aria-controls","settingsTitle");
      E.scenarioTabs.append(b);
    });
  }
  function selectScenario(id){
    selected=id;setInputValues();renderTabs();render();
  }
  function loadProduct(){
    const p=product();if(!p)return;
    scenarios=core.defaults(p);
    if(p.targetMargin===undefined||p.targetMargin===null)scenarios.forEach(s=>s.margin=settings.defaultMargin);
    selected="equilibrado";
    references=(settings.competitors||[]).map(x=>({...x}));
    E.originalProduct.textContent="Preço cadastrado: "+money(Number(p.salePrice)||0)+" · Custo direto: "+
      money(core.directCost(p))+" · "+integer(Math.max(1,Number(p.units)||1))+" un. cadastradas";
    setInputValues();renderTabs();render();
    status("O produto original não será alterado por nenhuma simulação.");
  }
  function evaluate(s){return core.calculate(product(),settings,s,references);}
  function clearResult(){
    ["suggested","cost","technical","net","contribution","breakEven","revenue","profit","range"].forEach(id=>E[id].textContent="—");
    E.chart.replaceChildren();E.chartDescription.textContent="Revise os parâmetros para exibir o gráfico.";
    E.goalUnits.textContent="—";E.goalDetail.textContent="";
    lastResult=null;
  }
  function applyMetric(result){
    E.suggested.textContent=money(result.suggestedPrice);
    E.cost.textContent=money(result.unitBaseCost);
    E.technical.textContent=money(result.technicalPrice);
    E.net.textContent=result.netMarginPct.toFixed(1)+"%";
    E.contribution.textContent=money(result.contributionMargin);
    E.breakEven.textContent=result.contributionMargin>0?
      integer(result.breakEvenUnits)+" un.":"Não atingível";
    E.revenue.textContent=money(result.revenue);
    E.profit.textContent=money(result.profit);
    E.profit.className=result.profit<0?"is-negative":"is-positive";
    E.range.textContent=money(result.recommendedRange.low)+" a "+money(result.recommendedRange.high);
  }
  function drawChart(result){
    const points=core.scenarioChartPoints(result,16),top=Math.max(1,...points.map(p=>Math.max(p.revenue,p.costs)))*1.12;
    const x0=72,y0=20,w=714,h=220,maxUnits=points[points.length-1].units||1;
    const x=n=>x0+(n/maxUnits)*w;
    const y=n=>y0+h-(n/top)*h;
    const plot=key=>points.map(p=>x(p.units).toFixed(2)+","+y(p[key]).toFixed(2)).join(" ");
    const revenueColor=getComputedStyle(E.chart).getPropertyValue("--sim-revenue")||
      getComputedStyle(document.querySelector(".sim")).getPropertyValue("--sim-revenue")||"#7652ea";
    const costColor=getComputedStyle(document.querySelector(".sim")).getPropertyValue("--sim-cost")||"#d68cae";
    let svg="";
    for(let i=0;i<=4;i++){
      const yy=y(top*i/4);
      svg+='<line x1="'+x0+'" y1="'+yy+'" x2="'+(x0+w)+'" y2="'+yy+'" stroke="currentColor" opacity=".11"/>';
      svg+='<text x="60" y="'+(yy+4)+'" text-anchor="end" fill="currentColor" opacity=".65" font-size="11">'+
        (top*i/4>=1000?(top*i/4000).toFixed(1)+" mil":Math.round(top*i/4))+'</text>';
    }
    for(let i=0;i<=4;i++){
      const xx=x(maxUnits*i/4);
      svg+='<text x="'+xx+'" y="264" text-anchor="middle" fill="currentColor" opacity=".65" font-size="11">'+
        integer(Math.round(maxUnits*i/4))+'</text>';
    }
    svg+='<polyline fill="none" stroke="'+revenueColor.trim()+'" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" points="'+plot("revenue")+'"/>';
    svg+='<polyline fill="none" stroke="'+costColor.trim()+'" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" points="'+plot("costs")+'"/>';
    if(result.contributionMargin>0&&result.breakEvenUnits<=maxUnits){
      const xx=x(result.breakEvenUnits);
      svg+='<line x1="'+xx+'" y1="'+y0+'" x2="'+xx+'" y2="'+(y0+h)+'" stroke="currentColor" opacity=".3" stroke-dasharray="5 5"/>';
      svg+='<text x="'+Math.min(xx+6,735)+'" y="18" font-size="11" fill="currentColor">Equilíbrio: '+integer(result.breakEvenUnits)+' un.</text>';
    }
    svg+='<text x="430" y="295" text-anchor="middle" font-size="12" fill="currentColor" opacity=".75">Unidades vendidas</text>';
    E.chart.innerHTML=svg;
    E.chartDescription.textContent="Cenário "+result.scenario.label+": "+integer(result.units)+" unidades, "+
      money(result.revenue)+" de receita e "+money(result.profit)+" de resultado mensal estimado.";
  }
  function renderComparison(){
    E.comparisonCards.replaceChildren();
    scenarios.forEach(s=>{
      const card=makeButton("",()=>selectScenario(s.id),"Editar cenário "+s.label);
      card.className="sim-compare-card"+(s.id===selected?" is-active":"");
      card.append(node("span",s.label,"sim-compare-title"));
      try{
        const result=evaluate(s);
        card.append(node("strong",money(result.salePrice)));
        card.append(node("small",integer(result.units)+" unidades · receita "+money(result.revenue)));
        card.append(node("small","Ponto de equilíbrio: "+(result.contributionMargin>0?integer(result.breakEvenUnits)+" un.":"inviável")));
        const label=node("b","Resultado: "+money(result.profit));
        if(result.profit<0)label.classList.add("is-negative");
        card.append(label);
      }catch(error){card.append(node("small",error.message,"is-negative"));}
      E.comparisonCards.append(card);
    });
  }
  function renderGoal(result){
    const kind=E.goalType.value,target=Number(E.goalAmount.value);
    try{
      const units=core.goal(result,target,kind);
      E.goalUnits.textContent=units===null?"Não atingível":integer(units)+" un.";
      E.goalDetail.textContent=units===null?
        "Com o preço atual, cada venda não contribui positivamente para cobrir os custos.":
        "Considerando o preço simulado de "+money(result.salePrice)+" por unidade e os custos informados.";
    }catch(error){E.goalUnits.textContent="—";E.goalDetail.textContent=error.message;}
  }
  function renderMarket(result){
    E.marketStats.replaceChildren();E.referenceList.replaceChildren();
    const prices=references.map(x=>Number(x.price)).filter(v=>Number.isFinite(v)&&v>0);
    if(prices.length){
      const mean=prices.reduce((a,b)=>a+b,0)/prices.length;
      [["Menor",Math.min(...prices)],["Média",mean],["Maior",Math.max(...prices)]].forEach(pair=>{
        const cell=node("div");cell.append(node("span",pair[0]),node("strong",money(pair[1])));E.marketStats.append(cell);
      });
      const delta=(result.salePrice/mean-1)*100;
      const text=node("p","Preço simulado "+(delta>=0?"+":"")+delta.toFixed(1)+"% em relação à média informada.","sim-muted");
      E.referenceList.append(text);
    }else{
      E.marketStats.append(node("p","Nenhuma referência cadastrada.","sim-muted"));
    }
    references.forEach((ref,index)=>{
      const line=node("div",undefined,"sim-reference-row");
      const label=node("span");
      label.append(node("strong",ref.name+": "),node("span",money(ref.price)));
      const btn=makeButton("×",()=>{references.splice(index,1);render();},"Remover referência somente desta simulação");
      btn.className="workspace-secondary";btn.style.minHeight="32px";
      line.append(label,btn);E.referenceList.append(line);
    });
  }
  function render(){
    if(!product())return;
    renderComparison();renderTabs();syncSliders();
    let result;
    try{result=evaluate(active());}
    catch(error){clearResult();status(error.message||"Parâmetros inválidos.","error");return;}
    lastResult=result;
    applyMetric(result);drawChart(result);renderGoal(result);renderMarket(result);
    if(E.simulationStatus.classList.contains("is-error"))status();
  }
  function appendChat(text,fromUser=false,source=""){
    const item=node("p",text,"sim-chat-entry"+(fromUser?" is-user":""));
    if(source)item.append(node("small",source==="ia"?"Análise da IA":"Análise calculada pela ZUZ"));
    E.aiMessages.append(item);E.aiMessages.scrollTop=E.aiMessages.scrollHeight;
  }
  async function refreshHistory(){
    try{
      const data=await api.request("GET","/simulations");
      history=Array.isArray(data.simulations)?data.simulations:[];
      renderHistory();
    }catch(error){E.historyList.replaceChildren(node("p","Não foi possível carregar o histórico: "+error.message,"sim-muted"));}
  }
  function showSaved(entry){
    const panel=node("div",undefined,"sim-insight");
    panel.append(node("strong",entry.name),node("p","Valores guardados na data "+new Date(entry.createdAt).toLocaleString("pt-BR")+".","sim-muted"));
    const saved=entry.snapshot?.results||[];
    if(saved.length){
      saved.forEach(s=>panel.append(node("p",s.label+": preço "+money(s.price)+
        " · "+integer(s.units)+" un. · receita "+money(s.revenue)+" · resultado "+money(s.profit),"sim-muted")));
    }else{
      panel.append(node("p","Este registro contém as premissas. Para resultados atuais, use Recalcular.","sim-muted"));
    }
    E.historyList.prepend(panel);
  }
  function renderHistory(){
    E.historyList.replaceChildren();
    if(!history.length){E.historyList.append(node("p","Nenhuma simulação salva ainda.","sim-muted"));return;}
    history.forEach(entry=>{
      const row=node("div",undefined,"sim-history-row"),summary=node("div"),actions=node("div",undefined,"sim-row-actions");
      summary.append(node("strong",entry.name),node("span",(entry.snapshot?.productName||"Produto")+
        " · "+new Date(entry.createdAt).toLocaleDateString("pt-BR")));
      actions.append(makeButton("Ver",()=>showSaved(entry),"Ver valores salvos"));
      actions.append(makeButton("Recalcular",()=>{
        if(!products.some(p=>String(p.id)===String(entry.productId))){
          status("Este produto não está mais cadastrado. Os valores antigos continuam no histórico.","error");return;
        }
        E.product.value=String(entry.productId);
        scenarios=entry.snapshot.scenarios.map(x=>({...x}));
        references=(entry.snapshot.references||[]).map(x=>({...x}));
        selected=scenarios.some(s=>s.id===entry.snapshot.selected)?entry.snapshot.selected:"equilibrado";
        const p=product();
        E.originalProduct.textContent="Preço cadastrado: "+money(Number(p.salePrice)||0)+
          " · Custo direto: "+money(core.directCost(p))+" · recalculando com custos atuais";
        setInputValues();render();status("Cenários recuperados e recalculados com os dados atuais. Cadastro preservado.","success");
        window.scrollTo({top:0,behavior:"smooth"});
      }));
      actions.append(makeButton("Excluir",async()=>{
        if(!window.confirm("Excluir esta simulação salva? Os produtos não serão afetados."))return;
        try{await api.request("DELETE","/simulations/"+encodeURIComponent(entry.id));await refreshHistory();}
        catch(error){status(error.message,"error");}
      }));
      row.append(summary,actions);E.historyList.append(row);
    });
  }
  function bind(){
    for(const key of ["price","units","margin","changeMode","changePct"]){
      E[key].addEventListener(key==="changeMode"?"change":"input",()=>{
        if(!active())return;
        active()[key]=key==="changeMode"?E[key].value:E[key].value;
        render();
      });
    }
    E.priceSlider.addEventListener("input",()=>{active().price=Number(E.priceSlider.value);E.price.value=active().price;render();});
    E.unitsSlider.addEventListener("input",()=>{active().units=Number(E.unitsSlider.value);E.units.value=active().units;render();});
    E.product.addEventListener("change",loadProduct);
    E.resetScenario.addEventListener("click",()=>{
      const index=scenarios.findIndex(s=>s.id===selected);
      if(index>=0){scenarios[index]=originalScenario(selected);setInputValues();render();status("Cenário restaurado.");}
    });
    E.resetAll.addEventListener("click",loadProduct);
    E.use.addEventListener("click",()=>{
      if(!lastResult)return;
      active().price=+lastResult.suggestedPrice.toFixed(2);
      E.price.value=active().price;render();status("Preço sugerido aplicado apenas ao cenário.","success");
    });
    E.goalType.addEventListener("change",render);
    E.goalAmount.addEventListener("input",render);
    E.addReference.addEventListener("click",()=>{
      const name=E.referenceName.value.trim(),price=Number(E.referencePrice.value);
      if(!name||!Number.isFinite(price)||price<=0||price>100000000){
        status("Informe a descrição e um preço válido para a referência.","error");return;
      }
      if(references.length>=30){status("Limite de 30 referências por simulação.","error");return;}
      references.push({name:name.slice(0,90),price});
      E.referenceName.value="";E.referencePrice.value="";render();status("Referência adicionada somente à simulação.","success");
    });
    E.saveSimulation.addEventListener("click",async()=>{
      if(!product())return;
      const name=E.simulationName.value.trim()||"Simulação "+new Date().toLocaleDateString("pt-BR");
      try{
        scenarios.forEach(s=>evaluate(s));
        E.saveSimulation.disabled=true;
        await api.request("POST","/simulations",{name,productId:product().id,snapshot:{scenarios,selected,references}});
        E.simulationName.value="";
        await refreshHistory();status("Simulação salva sem alterar os produtos.","success");
      }catch(error){status("Falha ao salvar: "+error.message,"error");}
      finally{E.saveSimulation.disabled=false;}
    });
    E.aiForm.addEventListener("submit",async(event)=>{
      event.preventDefault();
      const message=E.aiInput.value.trim();
      if(!message||!product()||!active())return;
      E.askAI.disabled=true;E.aiInput.value="";E.aiProposal.hidden=true;E.aiProposal.replaceChildren();
      appendChat(message,true);
      try{
        const response=await api.request("POST","/simulations/assistant",{message,
          context:{productId:product().id,scenario:active(),references}});
        appendChat(response.answer||"Não consegui analisar este cenário.",false,response.source);
        if(response.proposal){
          const suggestion=response.proposal;
          E.aiProposal.hidden=false;
          E.aiProposal.append(node("p","A ZUZ propôs preço de "+money(suggestion.price)+" e volume de "+
            integer(suggestion.units)+" un. Deseja usar esses valores neste cenário?"));
          const targetId=selected;
          const button=makeButton("Aplicar somente neste cenário",()=>{
            const target=scenarios.find(s=>s.id===targetId);
            if(!target)return;
            target.price=suggestion.price;target.units=suggestion.units;
            selectScenario(targetId);E.aiProposal.hidden=true;
            status("Proposta aplicada à simulação. Produto original preservado.","success");
          });
          button.className="workspace-primary";E.aiProposal.append(button);
        }
      }catch(error){appendChat("Não foi possível consultar a ZUZ: "+error.message);}
      finally{E.askAI.disabled=false;}
    });
  }
  bind();
  if(!products.length){
    E.product.append(node("option","Nenhum produto cadastrado"));
    status("Cadastre um produto em Produtos antes de simular.");
    document.querySelectorAll(".sim button,.sim input,.sim select").forEach(el=>el.disabled=true);
    E.historyList.append(node("p","Cadastre um produto para criar simulações.","sim-muted"));
    return;
  }
  products.forEach(p=>{
    const option=node("option",p.name||"Produto sem nome");option.value=String(p.id);E.product.append(option);
  });
  loadProduct();refreshHistory();
})();
