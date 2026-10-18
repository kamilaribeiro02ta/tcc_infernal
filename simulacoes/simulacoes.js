(async function(){
  "use strict";
  const core=window.ZUZSimulationCore,api=window.ZUZAPI;
  const ids=["product","originalProduct","resetAll","resetScenario","scenarioTabs","price","margin","units",
    "changeMode","changePct","priceSlider","unitsSlider","priceSliderLabel","unitsSliderLabel",
    "suggested","cost","technical","net","contribution","breakEven","revenue","profit","range",
    "simulationStatus","use","chart","chartDescription","comparisonCards","goalType","goalAmount",
    "goalUnits","goalDetail","marketStats","referenceList","referenceName","referencePrice",
    "addReference","simulationName","saveSimulation","historyList","aiMessages","aiForm",
    "aiInput","askAI","aiProposal","simGuide","guideToggle","guideContent","guideCounter","guideProgressLabel","guideProgressBar","guideHeading","guideText","guideNext","guideBack","guideJump","guideSkip","guideOpenFromSettings"];
  const E=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
  const money=v=>Number.isFinite(v)?new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v):"—";
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
    E.range.textContent=Number.isFinite(result.recommendedRange.high)?money(result.recommendedRange.low)+" a "+money(result.recommendedRange.high):"A partir de "+money(result.recommendedRange.low)+" · sem teto validado";
  }
  function drawChart(result){
    const points=core.scenarioChartPoints(result,16),top=Math.max(1,...points.map(p=>Math.max(p.revenue,p.costs)))*1.12;
    const shellWidth=E.chart.parentElement?.clientWidth || window.innerWidth;
    const compact=shellWidth<560;
    const chartWidth=compact?430:820,chartHeight=compact?285:300;
    E.chart.setAttribute("viewBox","0 0 "+chartWidth+" "+chartHeight);
    const x0=compact?60:72,y0=20,w=compact?345:714,h=compact?205:220,
      maxUnits=points[points.length-1].units||1;
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
        (top*i/4>=1000000?(top*i/4000000).toFixed(1)+" mi":top*i/4>=1000?(top*i/4000).toFixed(1)+" mil":Math.round(top*i/4))+'</text>';
    }
    const xTicks=compact?2:4;
    for(let i=0;i<=xTicks;i++){
      const xx=x(maxUnits*i/xTicks);
      svg+='<text x="'+xx+'" y="264" text-anchor="middle" fill="currentColor" opacity=".65" font-size="11">'+
        integer(Math.round(maxUnits*i/xTicks))+'</text>';
    }
    svg+='<polyline fill="none" stroke="'+revenueColor.trim()+'" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" points="'+plot("revenue")+'"/>';
    svg+='<polyline fill="none" stroke="'+costColor.trim()+'" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" points="'+plot("costs")+'"/>';
    if(result.contributionMargin>0&&result.breakEvenUnits<=maxUnits){
      const xx=x(result.breakEvenUnits);
      svg+='<line x1="'+xx+'" y1="'+y0+'" x2="'+xx+'" y2="'+(y0+h)+'" stroke="currentColor" opacity=".3" stroke-dasharray="5 5"/>';
      svg+='<text x="'+Math.min(xx+6,compact?275:735)+'" y="18" font-size="11" fill="currentColor">Equilíbrio: '+integer(result.breakEvenUnits)+' un.</text>';
    }
    svg+='<text x="'+(compact?chartWidth/2:430)+'" y="'+(chartHeight-5)+'" text-anchor="middle" font-size="12" fill="currentColor" opacity=".75">Unidades vendidas</text>';
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
    const kind=E.goalType.value,target=E.goalAmount.value;
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
    const current=product();
    const matching=references.filter(x=>!x.productId||String(x.productId)===String(current?.id));
    const byRegion=new Map(),storeKeys=new Set();
    for(const ref of matching){
      if(!ref.verified||!ref.marketQuoteId||!ref.marketProductId||!ref.seller||!ref.region||
        !Number.isFinite(Number(ref.price))||Number(ref.price)<=0)continue;
      const observed=new Date(ref.observedAt).getTime();
      if(!Number.isFinite(observed)||observed>Date.now()+86400000||Date.now()-observed>30*86400000)continue;
      const region=String(ref.region).trim().toLowerCase();
      const unique=[ref.marketProductId,region,String(ref.seller).trim().toLowerCase()].join("|");
      if(storeKeys.has(unique))continue;storeKeys.add(unique);
      const key=ref.marketProductId+"|"+region;
      if(!byRegion.has(key))byRegion.set(key,[]);
      byRegion.get(key).push(Number(ref.price));
    }
    const group=[...byRegion.values()].filter(x=>x.length>=3).sort((a,b)=>b.length-a.length)[0];
    if(group){
      const mean=group.reduce((a,b)=>a+b,0)/group.length;
      [["Menor",Math.min(...group)],["Média",mean],["Maior",Math.max(...group)]].forEach(([label,value])=>{
        const cell=node("div");cell.append(node("span",label),node("strong",money(value)));E.marketStats.append(cell);
      });
      E.referenceList.append(node("p","Média de "+group.length+" lojas para o mesmo produto e região.","sim-muted"));
    }else{
      E.marketStats.append(node("p","Sem três cotações de varejo equivalentes para calcular uma média confiável.","sim-muted"));
    }
    matching.forEach(ref=>{
      const index=references.indexOf(ref);
      const line=node("div",undefined,"sim-reference-row"),label=node("span");
      const title=ref.verified?"Cotação consultada":"Referência informada";
      label.append(node("strong",(ref.name||"Referência")+": "),node("span",money(Number(ref.price))),
        node("small"," · "+title+(ref.verified&&ref.observedAt?" · "+new Date(ref.observedAt).toLocaleDateString("pt-BR"):"")));
      const remove=makeButton("×",()=>{references.splice(index,1);render();},"Remover referência somente desta simulação");
      remove.className="workspace-secondary";remove.style.minHeight="32px";
      line.append(label,remove);E.referenceList.append(line);
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
    E.historyList.querySelectorAll(".sim-saved-preview").forEach(el=>el.remove());
    const panel=node("div",undefined,"sim-insight sim-saved-preview");
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
        scenarios=Array.isArray(entry.snapshot?.scenarios)?entry.snapshot.scenarios.map(x=>({...x})):core.defaults(product());
        references=(entry.snapshot?.references||[]).map(x=>({...x}));
        selected=scenarios.some(s=>s.id===entry.snapshot?.selected)?entry.snapshot.selected:"equilibrado";
        const p=product();
        E.originalProduct.textContent="Preço cadastrado: "+money(Number(p.salePrice)||0)+
          " · Custo direto: "+money(core.directCost(p))+" · recalculando com custos atuais";
        setInputValues();render();status("Cenários recuperados e recalculados com os dados atuais. Cadastro preservado.","success");
        document.getElementById("settingsTitle")?.scrollIntoView({behavior:"smooth",block:"center"});
      }));
      actions.append(makeButton("Renomear",async()=>{
        const name=window.prompt("Novo nome da simulação:",entry.name);
        if(name===null)return;
        if(!name.trim()){status("Informe um nome válido.","error");return;}
        try{
          await api.request("PATCH","/simulations/"+encodeURIComponent(entry.id),{name:name.trim()});
          await refreshHistory();
        }catch(error){status(error.message,"error");}
      }));
      actions.append(makeButton("Duplicar",async()=>{
        if(!products.some(p=>String(p.id)===String(entry.productId))){
          status("Não é possível duplicar: o produto não existe mais.","error");return;
        }
        try{
          await api.request("POST","/simulations",{name:entry.name+" (cópia)",
            productId:entry.productId,snapshot:entry.snapshot});
          await refreshHistory();status("Cópia salva sem alterar o produto.","success");
        }catch(error){status(error.message,"error");}
      }));
      actions.append(makeButton("Excluir",async()=>{
        if(!window.confirm("Excluir esta simulação salva? Os produtos não serão afetados."))return;
        try{await api.request("DELETE","/simulations/"+encodeURIComponent(entry.id));await refreshHistory();}
        catch(error){status(error.message,"error");}
      }));
      row.append(summary,actions);E.historyList.append(row);
    });
  }
  // Ajuda progressiva: acessível a qualquer momento e sem impedir a edição dos campos.
  const guideSteps=[
    {title:"Escolha o produto",text:"Comece escolhendo o produto que deseja testar. O preço cadastrado será usado como referência, mas não será alterado.",button:"Ir para o produto",target:"product"},
    {title:"Selecione um cenário",text:"Conservador testa um preço menor, Equilibrado parte do valor cadastrado e Premium testa um valor maior. São hipóteses: selecione uma delas para editar.",button:"Ver cenários",target:"scenarioTabs"},
    {title:"Ajuste preço e vendas",text:"Mude primeiro o preço e as unidades estimadas. O resultado ao lado é recalculado automaticamente. Depois, se quiser, experimente margem e custos.",button:"Editar o preço",target:"price"},
    {title:"Entenda os resultados",text:"Receita é o total vendido; resultado mensal desconta os custos variáveis e os fixos informados. Ponto de equilíbrio é a quantidade mínima para cobrir os custos. Compare os três cenários antes de decidir.",button:"Ver o resultado",target:"resultTitle"}
  ];
  let guideStep=0;
  const guideKey="zuz.simulacoes.guia.v1";
  function guideStore(value){try{localStorage.setItem(guideKey,value);}catch{}}
  function guideRead(){try{return localStorage.getItem(guideKey);}catch{return null;}}
  function paintGuide(){
    const step=guideSteps[guideStep];
    E.guideCounter.textContent="Passo "+(guideStep+1)+" de "+guideSteps.length;
    E.guideProgressLabel.textContent=step.title;
    E.guideProgressBar.style.width=(100*(guideStep+1)/guideSteps.length)+"%";
    E.guideHeading.textContent=step.title;
    E.guideText.textContent=step.text;
    E.guideNext.textContent=guideStep===guideSteps.length-1?"Concluir guia":"Próximo";
    E.guideBack.disabled=guideStep===0;
    E.guideJump.textContent=step.button;
  }
  function setGuideOpen(open){
    E.guideContent.hidden=!open;
    E.guideToggle.setAttribute("aria-expanded",String(open));
    E.guideToggle.textContent=open?"Minimizar":"Abrir guia";
    E.simGuide.classList.toggle("is-minimized",!open);
  }
  function bindGuide(){
    paintGuide();
    // Sem janelas sobrepostas: o guia começa recolhido e abre apenas por escolha.
    setGuideOpen(guideRead()==="open");
    const show=scroll=>{
      setGuideOpen(true);
      guideStore("open");
      if(scroll){
        E.simGuide.scrollIntoView({
          behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",
          block:"start"
        });
      }
    };
    E.guideToggle.addEventListener("click",()=>{
      const opening=E.guideContent.hidden;
      setGuideOpen(opening);
      guideStore(opening?"open":"closed");
    });
    E.guideOpenFromSettings?.addEventListener("click",()=>show(true));
    E.guideSkip.addEventListener("click",()=>{
      setGuideOpen(false);guideStore("closed");
    });
    E.guideBack.addEventListener("click",()=>{
      guideStep=Math.max(0,guideStep-1);
      paintGuide();
    });
    E.guideNext.addEventListener("click",()=>{
      if(guideStep===guideSteps.length-1){
        setGuideOpen(false);
        guideStore("closed");
        guideStep=0;
      }else{
        guideStep++;
      }
      paintGuide();
    });
    E.guideJump.addEventListener("click",()=>{
      const step=guideSteps[guideStep],target=document.getElementById(step.target);
      if(!target)return;
      const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
      if(target.matches("input,select"))target.focus({preventScroll:true});
    });
  }
  function bind(){
    for(const key of ["price","units","margin","changeMode","changePct"]){
      E[key].addEventListener(key==="changeMode"?"change":"input",()=>{
        if(!active())return;
        active()[key]=E[key].value;
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
    window.addEventListener("zuz:market:reference",event=>{
      const ref=event.detail,current=product();
      if(!current){status("Selecione primeiro um produto da sua empresa.","error");return;}
      if(!ref||!ref.verified||!/^[a-f0-9]{32}$/.test(ref.marketQuoteId||"")||
        !Number.isFinite(Number(ref.price))||Number(ref.price)<=0){
        status("A cotação não está validada.","error");return;
      }
      if(references.some(x=>x.marketQuoteId===ref.marketQuoteId)){
        status("Esta cotação já foi adicionada à simulação.","error");return;
      }
      if(references.length>=30){status("Limite de 30 referências nesta simulação.","error");return;}
      const currentCode=String(current.barcode||current.gtin||"").trim();
      if(currentCode&&currentCode!==ref.gtin){
        status("A cotação não corresponde ao código do produto selecionado.","error");return;
      }
      references.push({
        name:String(ref.name||"Produto").slice(0,90),price:Number(ref.price),
        productId:String(current.id),productName:current.name||"",
        verified:true,marketQuoteId:ref.marketQuoteId,marketProductId:ref.marketProductId,
        seller:ref.seller,source:ref.source,region:ref.region,observedAt:ref.observedAt,url:ref.url,
        unit:ref.unit,gtin:ref.gtin
      });
      ref.accepted=true;
      render();status("Cotação validada adicionada apenas às referências desta simulação.","success");
    });
    E.addReference.addEventListener("click",()=>{
      const name=E.referenceName.value.trim(),price=Number(E.referencePrice.value);
      if(!name||!Number.isFinite(price)||price<=0||price>100000000){
        status("Informe a descrição e um preço válido para a referência.","error");return;
      }
      if(references.length>=30){status("Limite de 30 referências por simulação.","error");return;}
      references.push({name:name.slice(0,90),price,productId:String(product().id),productName:product().name||""});
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
          E.aiProposal.append(node("p","A ZUZ propôs preço de "+money(suggestion.price)+", volume de "+
            integer(suggestion.units)+" un. e variação de custos de "+suggestion.changePct+
            "% ("+(suggestion.changeMode==="fixed"?"custos fixos":"custos variáveis")+"). Deseja usar estes valores somente no cenário?"));
          const targetId=selected;
          const button=makeButton("Aplicar somente neste cenário",()=>{
            const target=scenarios.find(s=>s.id===targetId);
            if(!target)return;
            target.price=suggestion.price;target.units=suggestion.units;
            target.changePct=suggestion.changePct;target.changeMode=suggestion.changeMode;
            selectScenario(targetId);E.aiProposal.hidden=true;
            status("Proposta aplicada à simulação. Produto original preservado.","success");
          });
          button.className="workspace-primary";E.aiProposal.append(button);
        }
      }catch(error){appendChat("Não foi possível consultar a ZUZ: "+error.message);}
      finally{E.askAI.disabled=false;}
    });
  }
  bindGuide();
  bind();
  // Rotação do celular, redimensionamento de janela e split-screen atualizam
  // a geometria do gráfico sem alterar os valores da simulação.
  let resizeFrame=0;
  window.addEventListener("resize",()=>{
    cancelAnimationFrame(resizeFrame);
    resizeFrame=requestAnimationFrame(()=>{if(lastResult)drawChart(lastResult);});
  },{passive:true});
  if(!products.length){
    E.product.append(node("option","Nenhum produto cadastrado"));
    status("Cadastre um produto em Produtos antes de simular.");
    document.querySelectorAll(".sim button,.sim input,.sim select").forEach(el=>{if(!el.closest("#simGuide")&&!el.matches("#guideOpenFromSettings")&&!el.matches(".sim-help-trigger")&&!el.closest(".sim-tutorial"))el.disabled=true;});
    E.historyList.append(node("p","Cadastre um produto para criar simulações.","sim-muted"));
    return;
  }
  products.forEach(p=>{
    const option=node("option",p.name||"Produto sem nome");option.value=String(p.id);E.product.append(option);
  });
  loadProduct();refreshHistory();
})();
