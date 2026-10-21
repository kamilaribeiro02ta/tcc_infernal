(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const money = value => new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(value);
  const T = {
    segment: {
      name:"Segmento", steps:[
        ["O que é?","É a atividade principal do negócio.","Uma confeitaria faz doces e bolos; uma barbearia presta serviços."],
        ["Por que importa?","Ajuda a interpretar custos e comparar negócios que trabalham de modo parecido.","Fabricar um bolo exige ingredientes; revender mercadorias exige preço de compra."],
        ["Como preencher?","Escreva sua atividade de forma específica, com poucas palavras.","Exemplo: 'Confeitaria artesanal', não apenas 'loja'."]
      ]
    },
    operationType:{
      name:"Tipo de operação", steps:[
        ["O que você vende?","A operação indica como o negócio entrega seu produto ou serviço.","Produção: você faz o produto. Revenda: compra pronto e vende."],
        ["Outros exemplos","Serviço é uma atividade executada para o cliente; misto combina tipos.","Uma papelaria que imprime e vende cadernos pode ser mista."],
        ["Como escolher?","Selecione o tipo que melhor representa o que você faz hoje.","A escolha organiza os custos, mas não define sozinha o preço."]
      ]
    },
    positioning:{
      name:"Posicionamento", steps:[
        ["O que significa?","É a forma como você quer que seus preços sejam percebidos.","Competir por preço, acompanhar o mercado ou valorizar diferenciais."],
        ["Por que importa?","A estratégia influencia a comparação de preços, mas não substitui os custos.","Um serviço personalizado pode ter preços diferentes de um serviço básico."],
        ["Como escolher?","Pense no seu público, nos diferenciais e nos preços realmente comparáveis.","Mesmo competindo por preço, não ignore seu custo mínimo calculado."]
      ]
    },
    targetCustomer:{
      name:"Público", steps:[
        ["Quem compra de você?","Seu público é o grupo de clientes para quem o negócio vende.","Exemplo: famílias que encomendam bolos de aniversário."],
        ["Qual a relação com o preço?","Conhecer o público ajuda a entender o tipo de produto e as referências de mercado.","Uma encomenda personalizada não é igual a um produto de prateleira."],
        ["Como preencher?","Descreva clientes e ocasiões de compra com palavras simples.","Exemplo: 'Moradores do bairro e festas infantis'."]
      ]
    },
    monthlyUnits:{
      name:"Volume mensal estimado", steps:[
        ["O que é?","É quantos produtos ou atendimentos você estima realizar em um mês.","Uma manicure que atende 5 pessoas por dia em 20 dias estima 100 atendimentos."],
        ["Como muda o custo?","Os gastos fixos são divididos pelo volume previsto.","R$ 600 por mês ÷ 100 unidades = R$ 6 por unidade."],
        ["Como preencher?","Use uma média realista do seu histórico. Se está começando, registre uma estimativa e revise depois.","Com apenas 50 unidades, os mesmos R$ 600 representam R$ 12 por unidade."]
      ]
    },
    defaultMargin:{
      name:"Margem desejada", steps:[
        ["O que é?","É a parte da receita que você deseja reservar como resultado após considerar os custos na formação do preço.","Margem de 20% não significa apenas somar 20% ao custo."],
        ["Exemplo simples","Se um preço de venda é R$ 100, uma margem de 20% representa R$ 20 nessa venda, conforme as premissas do cálculo.","É diferente de aplicar um acréscimo de 20% sobre um custo de R$ 100."],
        ["Como preencher?","Informe a porcentagem planejada entre 0 e 90. Considere sua realidade e as taxas da venda.","Para obter um preço, ainda será necessário informar o custo direto do produto."]
      ]
    },
    fixedCosts:{
      name:"Custos fixos mensais", steps:[
        ["O que são?","São gastos que continuam existindo mesmo quando as vendas diminuem.","Aluguel do espaço, internet do negócio e sistemas por assinatura."],
        ["Como entram no preço?","A ZUZ soma os valores mensais e divide pelo volume estimado.","Aluguel R$ 500 + internet R$ 100 = R$ 600; em 100 unidades, R$ 6 por unidade."],
        ["O que cadastrar?","Crie uma linha por gasto, com nome e valor total mensal. Evite registrar o mesmo custo duas vezes.","Ingredientes usados em cada produto normalmente entram como custos diretos na página Produtos."]
      ]
    },
    fixedLabel:{
      name:"Nome do gasto", steps:[
        ["Identifique o gasto","O nome ajuda você a reconhecer o que está pagando.","Use 'Aluguel', 'Internet da empresa' ou 'Sistema de agendamento'."],
        ["Evite duplicações","Não coloque o mesmo gasto em duas linhas ou também no custo direto do produto.","Se a energia já foi atribuída ao custo unitário, não some novamente o mesmo valor."],
        ["Como preencher?","Digite uma descrição curta e compreensível.","Exemplo: 'Aluguel da cozinha'."]
      ]
    },
    fixedAmount:{
      name:"Valor mensal do gasto", steps:[
        ["Qual valor informar?","Informe o gasto total referente a um mês, em reais.","Internet empresarial de R$ 120 por mês → digite 120."],
        ["E se a cobrança variar?","Use uma média representativa e revise seus valores periodicamente.","Uma conta de luz de R$ 100, R$ 130 e R$ 120 tem média mensal de R$ 116,67."],
        ["O que evitar?","Não divida previamente esse gasto pela quantidade de produtos: a ZUZ faz o rateio.","Digite 120, e não 1,20, para uma internet de R$ 120 por mês."]
      ]
    },
    taxesPct:{
      name:"Tributos sobre as vendas", steps:[
        ["O que são tributos?","São impostos ou contribuições incidentes na atividade ou nas vendas, conforme o regime do negócio.","A alíquota depende do enquadramento e das regras aplicáveis."],
        ["Como afetam uma venda?","Em um exemplo hipotético, 5% sobre R$ 100 corresponde a R$ 5.","Esse número é apenas um exemplo, não uma alíquota recomendada."],
        ["Como preencher com segurança?","Consulte seu contador, guia de recolhimento ou documento fiscal para descobrir o percentual que se aplica.","Não copie a porcentagem de outra empresa; se não souber, procure confirmação antes de salvar."]
      ]
    },
    sellingFeesPct:{
      name:"Taxas e comissões", steps:[
        ["Que taxas são essas?","São cobranças ligadas à forma de venda, como maquininha, marketplace ou comissão.","Pix pode ter tarifa zero ou tarifa contratada; cartão pode cobrar percentual."],
        ["Exemplo com cartão","Se o cartão cobra 3% sobre R$ 100, a taxa é R$ 3 e restam R$ 97 antes dos outros custos.","Se Pix é gratuito no seu contrato, sua taxa nessa venda seria 0%."],
        ["Como informar?","Confira suas tarifas reais. Se usa vários meios, calcule uma média ponderada pelas vendas ou trate os meios separadamente.","Não some 3% de cartão e 0% de Pix como se toda venda pagasse ambos."]
      ]
    },
    competitors:{
      name:"Referências de mercado", steps:[
        ["Para que servem?","São preços observados em outros negócios para produtos semelhantes.","Exemplo: comparar bolos de 1 kg com bolos de 1 kg da mesma região."],
        ["O que elas não mostram?","O preço de outra loja não revela seus custos nem garante que o mesmo valor funcionará para você.","Uma promoção pode reduzir temporariamente o preço de um concorrente."],
        ["Como preencher?","Adicione uma referência por linha com origem e preço, preferindo itens comparáveis.","A média aparece como panorama, não como limite máximo garantido."]
      ]
    },
    competitorName:{
      name:"Origem da referência", steps:[
        ["O que informar?","Nomeie onde você encontrou um preço para consultá-lo depois.","Exemplo: 'Padaria da rua - bolo 1 kg'."],
        ["Compare o mesmo tipo","Apenas nomes não bastam: peso, qualidade, serviço e região mudam os preços.","Um bolo decorado não é igual a um bolo simples."],
        ["Como preencher?","Registre a loja e o produto ou serviço consultado.","Use informações públicas ou observadas por você."]
      ]
    },
    competitorPrice:{
      name:"Preço de referência", steps:[
        ["O que significa?","É o preço anunciado ou praticado em outra empresa para um item comparável.","Bolo similar anunciado por R$ 75 → informe 75."],
        ["Por que comparar?","Ajuda a conhecer a faixa de mercado, mas não define automaticamente seu preço.","Seu próprio custo pode ser maior ou menor que o do concorrente."],
        ["Como preencher?","Digite apenas números em reais e confirme que a referência é do mesmo tipo de produto.","Atualize as referências quando o mercado mudar."]
      ]
    }
  };
  const fieldTopics=["segment","operationType","positioning","targetCustomer","monthlyUnits","defaultMargin","taxesPct","sellingFeesPct"];
  const progress=new Map();
  let active=null, panel=null, desktop=null, card=null;
  const desktopQuery=window.matchMedia("(min-width: 1101px)");

  function trigger(topic, label="Entender") {
    const b=document.createElement("button");
    b.type="button";
    b.className="cost-help-trigger";
    b.dataset.costTopic=topic;
    b.setAttribute("aria-expanded","false");
    b.setAttribute("aria-label",label+" "+T[topic].name);
    const i=document.createElement("i");i.className="bx bx-help-circle";i.setAttribute("aria-hidden","true");
    b.append(i,document.createTextNode(" "+label));
    return b;
  }
  function slot(className) {
    const s=document.createElement("div");s.className=className;
    s.hidden=true;
    return s;
  }
  function buildFields() {
    for(const topic of fieldTopics) {
      const input=$(topic), old=input?.closest("label");
      if(!input||!old||!old.parentElement)continue;
      const wrapper=document.createElement("div");wrapper.className="cost-field";
      const top=document.createElement("div");top.className="cost-field-heading";
      const label=document.createElement("label");label.htmlFor=topic;
      label.textContent=[...old.childNodes].filter(node=>node.nodeType===3).map(node=>node.textContent).join(" ").trim()||T[topic].name;
      top.append(label,trigger(topic));
      const small=slot("cost-help-slot");
      old.replaceWith(wrapper);wrapper.append(top,input,small);
    }
  }
  function buildSection(id,topic) {
    const area=$(id)?.closest(".workspace-panel");if(!area)return;
    const head=area.querySelector(".workspace-section-head");
    if(!head)return;
    const actions=document.createElement("div");actions.className="cost-section-help-actions";
    actions.append(trigger(topic));
    head.append(actions);
    const s=slot("cost-section-help-slot");
    head.insertAdjacentElement("afterend",s);
  }
  function buildRows() {
    for(const [id,labelTopic,amountTopic] of [
      ["fixedRows","fixedLabel","fixedAmount"],
      ["compRows","competitorName","competitorPrice"]
    ]) {
      const host=$(id);if(!host)continue;
      const decorate=()=>{
        host.querySelectorAll(".row").forEach(row=>{
          if(row.dataset.helpReady)return;
          row.dataset.helpReady="true";
          const inputs=[row.querySelector(".a"),row.querySelector(".b")];
          for(const [index,topic] of [[0,labelTopic],[1,amountTopic]]) {
            const input=inputs[index];if(!input)continue;
            const wrap=document.createElement("div");wrap.className="cost-row-cell";
            const heading=document.createElement("div");heading.className="cost-row-cell-head";
            const txt=document.createElement("span");
            txt.textContent=index===0?(id==="fixedRows"?"Gasto":"Referência"):(id==="fixedRows"?"R$ / mês":"Preço R$");
            heading.append(txt,trigger(topic,"?"));
            input.replaceWith(wrap);wrap.append(heading,input);
          }
          row.append(slot("cost-row-help-slot"));
        });
      };
      decorate();
      new MutationObserver(decorate).observe(host,{childList:true});
    }
  }
  function mountHelp() {
    card=document.querySelector(".cost-summary");
    if(!card)return;
    const aside=document.createElement("div");aside.className="cost-aside";
    desktop=slot("cost-desktop-help-slot");
    card.replaceWith(aside);
    aside.append(desktop,card);
    panel=document.createElement("section");
    panel.className="cost-tutorial";
    panel.id="cost-tutorial";
    panel.setAttribute("aria-label","Ajuda contextual sobre custos");
    panel.hidden=true;
  }
  function position() {
    if(!active||!panel)return;
    const t=active.trigger;
    const target=desktopQuery.matches
      ?desktop
      :(t.closest(".cost-field")?.querySelector(".cost-help-slot")||
        t.closest(".row")?.querySelector(".cost-row-help-slot")||
        t.closest(".workspace-panel")?.querySelector(".cost-section-help-slot"));
    if(!target)return;
    if(panel.parentElement!==target) {
      if(panel.parentElement)panel.parentElement.hidden=true;
      target.append(panel);
    }
    target.hidden=false;panel.hidden=false;
  }
  function closeHelp(refocus=false) {
    if(!active)return;
    const b=active.trigger;
    b.setAttribute("aria-expanded","false");
    if(panel)panel.hidden=true;
    if(panel?.parentElement)panel.parentElement.hidden=true;
    active=null;
    if(refocus && b.isConnected)b.focus();
  }
  function el(tag,className,text) {
    const element=document.createElement(tag);
    if(className)element.className=className;
    if(text!==undefined)element.textContent=text;
    return element;
  }
  function renderHelp() {
    if(!active||!panel)return;
    position();
    const topic=active.topic, item=T[topic], index=progress.get(topic)||0;
    const current=item.steps[index];
    panel.replaceChildren();
    if(desktopQuery.matches && card?.parentElement?.classList.contains("cost-aside")) {
      card.parentElement.scrollTop=0;
    }
    const head=el("div","cost-tutorial-head");
    const heading=el("div","");
    heading.append(el("span","cost-tutorial-kicker","GUIA CONTEXTUAL"),el("h3","",item.name));
    const close=el("button","cost-help-close","×");close.type="button";close.setAttribute("aria-label","Fechar tutorial");close.dataset.costAction="close";
    head.append(heading,close);
    const stepInfo=el("div","cost-tutorial-step","Etapa "+(index+1)+" de "+item.steps.length);
    const bar=el("progress","cost-tutorial-progress");bar.max=item.steps.length;bar.value=index+1;
    bar.setAttribute("aria-label","Progresso do tutorial de "+item.name);
    const sub=el("h4","cost-tutorial-sub",current[0]);
    const desc=el("p","cost-tutorial-description",current[1]);
    const example=el("p","cost-tutorial-example",current[2]);
    const nav=el("div","cost-tutorial-nav");
    const back=el("button","cost-tutorial-secondary","Voltar");back.type="button";back.dataset.costAction="back";back.disabled=index===0;
    const next=el("button","cost-tutorial-next",index===item.steps.length-1?"Concluir":"Próximo");next.type="button";next.dataset.costAction="next";
    nav.append(back,next);
    const ask=el("div","cost-tutorial-ask");
    ask.append(el("h4","","Chat da Zuni"),el("p","","Tire suas dúvidas sobre este campo com a Zuni."));
    const chatButton=el("button","cost-tutorial-ask-button","Falar com a Zuni");chatButton.type="button";
    chatButton.addEventListener("click",()=>window.ZuniChat.open({context:"Custos — "+item.name+". "+item.steps.map(s=>s[1]).join(" ")}));
    ask.append(chatButton);
    panel.append(head,stepInfo,bar,sub,desc,example,nav,ask);
  }
  function buildPreview(){
    const summary=$("summary");
    if(!card||!summary)return;
    const root=el("section","cost-live-preview");
    root.setAttribute("aria-label","Prévia dos cálculos");
    root.innerHTML='<span class="cost-preview-eyebrow">PRÉVIA EM TEMPO REAL</span><h3>O impacto dos seus números</h3><div class="cost-preview-values"><div><span>Custos fixos mensais</span><strong id="costPreviewFixed">—</strong></div><div><span>Parcela fixa por unidade</span><strong id="costPreviewUnit">—</strong></div><div><span>Taxas sobre R$ 100 de venda</span><strong id="costPreviewFees">—</strong></div></div><p id="costPreviewNote" class="cost-preview-note"></p><p class="cost-preview-disclaimer">Esta é uma prévia das premissas, não um preço de venda. Para calcular o preço, inclua os custos diretos do produto.</p>';
    summary.insertAdjacentElement("afterend",root);
    // Indicações compactas ao lado dos campos evitam retornar ao resumo no celular.
    const unitHint=el("p","cost-field-impact");
    const rateHint=el("p","cost-field-impact");
    unitHint.hidden=true;rateHint.hidden=true;
    $("monthlyUnits").insertAdjacentElement("afterend",unitHint);
    $("sellingFeesPct").insertAdjacentElement("afterend",rateHint);
    const refresh=()=>{
      const fixedInputs=[...$("fixedRows").querySelectorAll(".row .b")];
      const positive=fixedInputs.filter(x=>x.value.trim()!==""&&Number.isFinite(Number(x.value))&&Number(x.value)>=0);
      const fixed=positive.reduce((a,x)=>a+Number(x.value),0);
      const volume=Number($("monthlyUnits").value);
      const taxes=Number($("taxesPct").value),fees=Number($("sellingFeesPct").value),margin=Number($("defaultMargin").value);
      const validRates=$("taxesPct").value!=="" && $("sellingFeesPct").value!=="" &&
        Number.isFinite(taxes)&&Number.isFinite(fees)&&taxes>=0&&fees>=0&&taxes+fees<100;
      $("costPreviewFixed").textContent=positive.length?money(fixed):"A informar";
      $("costPreviewUnit").textContent=positive.length&&Number.isInteger(volume)&&volume>0?money(fixed/volume):"A informar";
      $("costPreviewFees").textContent=validRates?money(taxes+fees):"A informar";
      let note="";
      if(!positive.length)note="Informe ao menos um custo mensal para ver o rateio.";
      else if(!Number.isInteger(volume)||volume<1)note="Informe um volume mensal válido para dividir os gastos.";
      else if(!validRates)note="Revise tributos e taxas antes de estimar o impacto.";
      else if(margin+taxes+fees>=100)note="Margem e taxas somam 100% ou mais: revise antes de formar preços.";
      else note="Exemplo: para cada R$ 100 vendidos, os percentuais informados representam "+money(taxes+fees)+" em tributos e taxas.";
      $("costPreviewNote").textContent=note;
      const showUnit=positive.length>0 && Number.isInteger(volume) && volume>0;
      unitHint.hidden=!showUnit;
      if(showUnit) unitHint.textContent="Parcela fixa estimada: "+money(fixed/volume)+" por unidade.";
      const showRate=validRates && taxes+fees>0;
      rateHint.hidden=!showRate;
      if(showRate) rateHint.textContent="Exemplo: em R$ 100 de venda, os percentuais acima representam "+money(taxes+fees)+".";
    };
    $("form").addEventListener("input",refresh);
    $("form").addEventListener("change",refresh);
    $("fixedRows").addEventListener("click",()=>queueMicrotask(refresh));
    $("compRows").addEventListener("click",()=>queueMicrotask(refresh));
    // O preenchimento inicial pode vir de forma assíncrona do servidor.
    window.addEventListener("zuz:costs-loaded",refresh);
    refresh();
  }
  buildFields();
  buildSection("fixedRows","fixedCosts");
  buildSection("compRows","competitors");
  buildRows();
  mountHelp();
  buildPreview();
  document.querySelector(".cost-page")?.addEventListener("click",event=>{
    const b=event.target.closest("[data-cost-topic]");
    if(b){
      const topic=b.dataset.costTopic;
      if(!T[topic])return;
      if(active?.trigger===b){closeHelp(true);return;}
      closeHelp();
      active={topic,trigger:b};
      b.setAttribute("aria-expanded","true");
      renderHelp();return;
    }
    const control=event.target.closest("[data-cost-action]");
    if(!control||!active)return;
    switch(control.dataset.costAction){
      case "close":closeHelp(true);break;
      case "back":progress.set(active.topic,Math.max(0,(progress.get(active.topic)||0)-1));renderHelp();break;
      case "next":{
        const n=progress.get(active.topic)||0;
        if(n===T[active.topic].steps.length-1)closeHelp(true);
        else {progress.set(active.topic,n+1);renderHelp();}
        break;
      }

    }
  });
  const relocate=()=>{if(active)position();};
  desktopQuery.addEventListener?.("change",relocate);
  window.addEventListener("resize",relocate,{passive:true});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&active)closeHelp(true);});
})();

