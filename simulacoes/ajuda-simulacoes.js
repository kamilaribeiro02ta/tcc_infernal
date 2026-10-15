(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const money=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n)||0);
  // Cada item contém título e três etapas independentes: conceito, exemplo e preenchimento.
  const GUIDE={
    product:{name:"Produto selecionado",steps:[
      ["O que escolher?","Selecione um produto que já foi cadastrado na ZUZ.","Exemplo: bolo de 1 kg, serviço de manicure ou camiseta."],
      ["Por que escolher?","O produto traz custos e preço de referência para os cálculos.","A simulação usa o custo direto daquele produto e as premissas em Custos."],
      ["Como usar?","Escolha um item da lista. Você poderá testar hipóteses sem mudar o cadastro original.","Se a lista estiver vazia, cadastre um produto na página Produtos."]]},
    scenario:{name:"Cenários",steps:[
      ["Três possibilidades","Conservador, Equilibrado e Premium são maneiras diferentes de testar preço e volume.","Você não precisa seguir nenhuma das três como preço definitivo."],
      ["O que muda?","Os valores iniciais usam preços e quantidades hipotéticos.","Preço menor não garante mais clientes; preço maior não garante maior lucro."],
      ["Como comparar?","Selecione cada aba, altere valores e observe resultados e comparação.","Os três cenários são independentes. Restaurar recupera os valores iniciais."]]},
    price:{name:"Preço de venda",steps:[
      ["O que é?","É o preço por unidade que você deseja experimentar neste cenário.","Exemplo: vender um doce por R$ 8 em vez de R$ 7."],
      ["O impacto no resultado","A receita é preço multiplicado pelas unidades vendidas.","R$ 8 × 100 unidades = R$ 800 de receita bruta, antes dos custos."],
      ["Como preencher?","Digite o valor que gostaria de testar e compare os resultados.","Esse valor não altera o preço cadastrado no produto."]]},
    units:{name:"Vendas estimadas",steps:[
      ["O que é?","A quantidade que você imagina vender no mês neste cenário.","Exemplo: testar 80 atendimentos mensais em vez de 100."],
      ["Por que importa?","O volume influencia a receita e o resultado após os custos.","R$ 25 × 80 vendas = R$ 2.000 de faturamento hipotético."],
      ["Como preencher?","Digite um número inteiro que represente uma hipótese realista.","Não trate esse número como previsão de clientes ou vendas."]]},
    margin:{name:"Margem desejada",steps:[
      ["O que significa?","É a porcentagem que você gostaria de obter sobre a receita depois dos custos considerados na formação do preço.","Não é simplesmente somar essa porcentagem ao gasto."],
      ["Exemplo simples","Uma margem de 20% sobre uma venda de R$ 100 representa R$ 20 de resultado planejado, conforme as premissas.","A ZUZ considera custos, tributos e taxas para calcular o preço técnico."],
      ["Como preencher?","Teste uma margem de 0% a 90% sem esquecer os demais encargos.","Uma margem maior pode tornar o preço técnico mais alto."]]},
    changeMode:{name:"Tipo de custo",steps:[
      ["Qual custo mudar?","Escolha se quer testar alteração nos custos variáveis ou nos custos fixos.","Variável: ingredientes por unidade. Fixo: aluguel mensal."],
      ["Qual a diferença?","Custos variáveis dependem das unidades. Custos fixos são gastos do mês.","Aumentar o aluguel de R$ 600 para R$ 660 não é igual a aumentar os ingredientes de R$ 10 para R$ 11 por unidade."],
      ["Como preencher?","Escolha a categoria e, no campo seguinte, informe a porcentagem de mudança.","A ZUZ aplica a variação somente à categoria selecionada."]]},
    changePct:{name:"Variação de custos",steps:[
      ["Como funciona?","Simule aumento ou redução percentual dos custos escolhidos.","+10 aumenta 10%; -10 reduz 10%; 0 mantém o mesmo valor."],
      ["Um exemplo","Se cada produto usa R$ 20 em insumos, um aumento de 10% leva esse custo para R$ 22.","Uma redução de 10% levaria o custo para R$ 18."],
      ["Como preencher?","Use um número entre -100 e 500 e escolha antes qual categoria mudará.","São hipóteses, não alterações nos gastos cadastrados."]]},
    priceSlider:{name:"Ajuste rápido do preço",steps:[
      ["Para que serve?","É um jeito de testar novos preços arrastando o controle.","O campo Preço de venda também é atualizado."],
      ["Veja as mudanças","A receita e o resultado simulado mudam com o preço.","Um preço maior não significa que a quantidade vendida aumentará."],
      ["Como usar?","Deslize lentamente ou edite diretamente o valor numérico acima.","A alteração vale apenas para o cenário selecionado."]]},
    unitsSlider:{name:"Ajuste rápido do volume",steps:[
      ["Para que serve?","Ajuda a testar diferentes quantidades vendidas.","É o mesmo dado do campo Vendas estimadas."],
      ["Exemplo","A R$ 30 por unidade, 50 vendas representam R$ 1.500 de receita; 100 vendas, R$ 3.000.","O resultado final ainda depende dos custos."],
      ["Como usar?","Mova o controle ou informe um número exato no campo acima.","Não confunda essa hipótese com demanda prevista."]]},
    goalType:{name:"Tipo de meta",steps:[
      ["Duas metas diferentes","Faturamento é o total de vendas; resultado após custos é o que resta descontando os gastos considerados.","R$ 5.000 de vendas não equivalem a R$ 5.000 de resultado."],
      ["O que a ZUZ calcula?","O sistema estima quantas unidades você precisaria vender para atingir a meta escolhida.","Para resultado, considera a contribuição por venda e os custos fixos."],
      ["Como escolher?","Selecione faturamento ou resultado após custos conforme o objetivo.","O cálculo é uma estimativa com o preço e custos da simulação."]]},
    goalAmount:{name:"Valor da meta",steps:[
      ["O que informar?","Digite o valor em reais que gostaria de atingir.","Exemplo: faturar R$ 2.000 no mês."],
      ["Quantas vendas isso exige?","Se cada unidade custa R$ 25 para o cliente, faturar R$ 2.000 exige 80 vendas.","Isso não garante que 80 pessoas comprarão."],
      ["Como preencher?","Use uma meta e observe a quantidade estimada logo abaixo.","Para uma meta de resultado, o sistema também considera os custos."]]},
    referenceName:{name:"Nome da referência",steps:[
      ["De onde veio o preço?","Identifique a loja ou empresa usada como comparação.","Exemplo: 'Confeitaria do bairro — bolo 1 kg'."],
      ["O que comparar?","Busque produtos equivalentes em peso, tamanho, qualidade e localização.","Um bolo simples e um bolo personalizado não são comparáveis diretamente."],
      ["Como preencher?","Digite uma origem curta e reconhecível.","A referência adicionada aqui é temporária até que a simulação seja salva."]]},
    referencePrice:{name:"Preço de referência",steps:[
      ["O que é?","É o valor anunciado por outra empresa para um produto semelhante.","Exemplo: um bolo equivalente por R$ 75."],
      ["Como ajuda?","Serve como contexto de mercado, mas não informa o custo do concorrente.","Não use esse preço como valor máximo garantido."],
      ["Como preencher?","Informe apenas o valor em reais, após confirmar a comparação.","A referência vale para o cenário, não para mudar o cadastro do produto."]]},
    simulationName:{name:"Nome da simulação",steps:[
      ["Por que dar um nome?","Ajuda a reconhecer as hipóteses que você salvou.","Exemplo: 'Promoção de novembro'."],
      ["O que fica guardado?","As premissas e os cenários daquela análise, sem mudar o produto original.","Você poderá consultar e recalcular o registro depois."],
      ["Como preencher?","Escreva um nome curto e específico e toque em Salvar simulação.","Salvar é diferente de aplicar um preço ao cadastro."]]},
    suggested:{name:"Preço sugerido",steps:[
      ["O que a ZUZ sugere?","Um valor estimado com base no custo, na margem e nas referências relevantes.","É um ponto de análise, não uma promessa de preço aceitável pelo mercado."],
      ["De onde vem?","A ZUZ parte do preço técnico e considera referências realmente comparáveis.","Sem referências suficientes, o cálculo fica fundamentado nos custos."],
      ["Como interpretar?","Compare preço sugerido, preço simulado e resultado antes de decidir.","Aplicar sugestão muda somente este cenário, não o produto cadastrado."]]},
    cost:{name:"Custo unitário com rateio",steps:[
      ["O que é rateio?","Uma parcela dos custos fixos mensais atribuída a cada unidade, somada ao custo direto.","R$ 600 de custos fixos ÷ 100 unidades = R$ 6 por unidade."],
      ["O que está incluído?","Custo direto do produto mais sua parcela padrão de custos fixos.","Se o custo direto é R$ 10, com rateio de R$ 6, o custo unitário chega a R$ 16."],
      ["Atenção ao volume","O rateio padrão usa o volume informado em Custos, não necessariamente o volume deste cenário.","O resultado mensal usa os custos fixos integrais do período."]]},
    technical:{name:"Preço técnico",steps:[
      ["O que representa?","É o preço calculado para cobrir custos, tributos, taxas e a margem desejada.","Pode ser diferente do preço que você decidiu simular."],
      ["Exemplo","Se o custo é R$ 70 e as porcentagens de taxa e margem somam 30%, o preço técnico é R$ 100.","Conta ilustrativa: 70 ÷ (1 − 0,30) = 100."],
      ["Como usar?","Compare com o preço que você testou, sem ignorar o que clientes aceitam pagar.","Se margem e taxas somarem 100% ou mais, a fórmula não é válida."]]},
    net:{name:"Margem unitária",steps:[
      ["O que mostra?","É a porcentagem estimada que sobra de uma venda depois dos custos atribuídos à unidade.","Não é a mesma coisa que o resultado total do mês."],
      ["Por que pode variar?","O rateio unitário usa o volume padrão de Custos.","O resultado mensal desconta os custos fixos inteiros do período."],
      ["Como interpretar?","Observe também contribuição, ponto de equilíbrio e resultado mensal.","Uma margem unitária positiva não garante resultado mensal positivo."]]},
    contribution:{name:"Contribuição por unidade",steps:[
      ["O que sobra por venda?","É o preço de venda menos custos diretos e taxas proporcionais.","Esse valor ainda precisará ajudar a pagar os custos fixos."],
      ["Exemplo","Preço de R$ 30, custo direto de R$ 10 e taxas de R$ 2 deixam R$ 18 de contribuição.","Exemplo hipotético, não resultado líquido."],
      ["Por que importa?","Com contribuição positiva, cada unidade ajuda a cobrir os custos fixos.","Se for zero ou negativa, vender mais pode não resolver o resultado."]]},
    breakEven:{name:"Ponto de equilíbrio",steps:[
      ["O que significa?","É quantas unidades seriam necessárias para cobrir os custos fixos com a contribuição de cada venda.","Nesse ponto, o resultado estimado fica próximo de zero."],
      ["Exemplo","Se custos fixos são R$ 600 e cada unidade contribui com R$ 15, o equilíbrio exige 40 vendas.","600 ÷ 15 = 40 unidades."],
      ["Como usar?","Compare o ponto de equilíbrio com sua capacidade e com a demanda possível.","O cálculo não garante que as vendas acontecerão."]]},
    revenue:{name:"Receita simulada",steps:[
      ["O que é receita?","É a soma dos valores cobrados pelas unidades hipoteticamente vendidas.","Preço × volume estimado."],
      ["Exemplo","R$ 25 por unidade × 80 unidades = R$ 2.000 de receita.","Ainda não foram descontados custos ou taxas."],
      ["Como interpretar?","Não confunda receita com resultado mensal.","Olhe os dois indicadores ao comparar cenários."]]},
    profit:{name:"Resultado mensal estimado",steps:[
      ["O que sobra no mês?","É a receita hipotética menos custos diretos, taxas e custos fixos integrais do período.","Pode ficar negativo mesmo quando o preço cobre o custo unitário."],
      ["Exemplo","Receita de R$ 2.000 menos R$ 900 de variáveis e R$ 600 de fixos resulta em R$ 500.","Os valores são ilustrativos."],
      ["Como analisar?","Teste hipóteses diferentes e confira custos e volume antes de decidir.","O resultado projetado não é garantia de lucro real."]]},
    range:{name:"Faixa de análise",steps:[
      ["O que é?","A faixa começa no preço técnico calculado a partir dos custos.","Não é um intervalo obrigatório de cobrança."],
      ["E o limite superior?","Só aparece quando existem referências suficientes e realmente comparáveis.","Na falta delas, a ZUZ informa que não há teto de mercado validado."],
      ["Como usar?","Compare faixas e preços com seu público e com o mercado real.","Nunca trate um teto de referência como limite máximo garantido."]]},
    chart:{name:"Gráfico de receita e custos",steps:[
      ["O que mostra?","Duas linhas indicam como receita e custos mudam em diferentes volumes.","O eixo horizontal mostra unidades vendidas; o vertical mostra valores financeiros."],
      ["Quando as linhas se cruzam","O cruzamento ajuda a entender a aproximação do ponto de equilíbrio.","Acima dele, a receita pode superar os custos, conforme as hipóteses usadas."],
      ["Como interpretar?","Altere preço ou volume e observe o comportamento das linhas.","Os pontos do gráfico são cálculos condicionais, não previsões de venda."]]},
    comparison:{name:"Comparação dos cenários",steps:[
      ["Três decisões possíveis","Os cards permitem comparar Conservador, Equilibrado e Premium.","Cada um guarda preço, volume e custo alterados separadamente."],
      ["Compare o resultado","Olhe receita, ponto de equilíbrio e resultado mensal.","Um cenário com preço maior não garante maior resultado."],
      ["Como usar?","Toque no card para voltar a editar aquele cenário.","A comparação não altera os dados originais do produto."]]},
    goal:{name:"Metas de vendas",steps:[
      ["O que quer atingir?","Escolha faturamento ou resultado após custos.","São metas diferentes e podem exigir quantidades muito distintas."],
      ["Como a ZUZ calcula?","Com faturamento, divide a meta pelo preço. Com resultado, considera contribuição e custos fixos.","A meta não implica previsão de demanda."],
      ["Como testar?","Mude o tipo ou o valor da meta e observe as unidades necessárias.","Se a contribuição não for positiva, a meta de resultado pode ser inalcançável nesse cenário."]]},
    market:{name:"Referências de mercado",steps:[
      ["Por que consultar preços?","Valores praticados por concorrentes ajudam a contextualizar as decisões.","Compare sempre produtos equivalentes."],
      ["Menor, média e maior","A ZUZ resume os preços registrados, mas não conhece os custos das outras empresas.","A amostra pode ser pequena ou não representar o mercado inteiro."],
      ["Como preencher?","Cadastre uma origem e seu preço, depois clique em Adicionar.","A referência é temporária até a simulação ser salva."]]},
    history:{name:"Histórico de simulações",steps:[
      ["Para que serve?","Permite guardar cenários e retomar uma análise depois.","A página não substitui os valores originais do produto."],
      ["Ver e recalcular","Ver mostra os dados armazenados; recalcular usa os custos atuais do produto.","Por isso resultados recalculados podem ser diferentes dos antigos."],
      ["Outras opções","Você pode renomear, duplicar ou excluir uma simulação.","Confirme exclusões: o produto não é apagado."]]},
    ai:{name:"Converse com a ZUZ",steps:[
      ["Como funciona?","Digite uma pergunta sobre os cenários e os resultados.","Exemplo: 'O que acontece se o preço aumentar 10%?'"],
      ["Sobre as respostas","A ZUZ pode mostrar análise calculada ou resposta da IA, conforme o serviço disponível.","As recomendações não garantem resultados de vendas."],
      ["Controle do usuário","Uma proposta de alteração só afeta o cenário se você escolher aplicá-la.","A assistente não muda os produtos cadastrados automaticamente."]]}
  };
  const progress=new Map(),drafts=new Map(),answers=new Map();
  const root=document.querySelector(".workspace-page.sim");
  if(!root)return;
  let current=null;
  const panel=document.createElement("section");
  panel.className="sim-tutorial";
  panel.id="sim-contextual-tutorial";
  panel.hidden=true;
  panel.setAttribute("aria-label","Tutorial contextual de simulações");
  function elem(tag,cls,text){
    const e=document.createElement(tag);
    if(cls)e.className=cls;
    if(text!==undefined)e.textContent=text;
    return e;
  }
  function trigger(topic,short=false){
    const b=elem("button","sim-help-trigger");
    b.type="button";b.dataset.simHelpTopic=topic;
    b.setAttribute("aria-expanded","false");
    b.setAttribute("aria-controls","sim-contextual-tutorial");
    b.setAttribute("aria-label","Entender "+GUIDE[topic].name);
    const ico=elem("i","bx bx-help-circle");ico.setAttribute("aria-hidden","true");
    b.append(ico,document.createTextNode(short?" ?":" Entender"));
    return b;
  }
  function makeSlot(){
    const e=elem("div","sim-help-slot");e.hidden=true;return e;
  }
  function decorateLabel(id,topic){
    const input=$(id),label=input?.closest("label");
    if(!label||label.dataset.simHelpReady==="true")return;
    label.dataset.simHelpReady="true";
    const wrapper=elem("div","sim-context-field");
    if(label.classList.contains("sim-full-field"))wrapper.classList.add("sim-full-field");
    const parent=label.parentElement;
    parent.insertBefore(wrapper,label);
    wrapper.append(label);
    const heading=elem("div","sim-context-heading");
    const titleNode=Array.from(label.childNodes).find(n=>n.nodeType===3&&n.textContent.trim());
    if(titleNode){
      // O texto do campo é um título visual independente. Uma segunda
      // tag <label> dentro do layout flex encolhia até uma letra por linha
      // no mobile. aria-labelledby preserva a identificação acessível.
      const fieldTitle=elem("span","sim-context-label",titleNode.textContent.trim());
      fieldTitle.id="sim-context-label-"+id;
      input.setAttribute("aria-labelledby",fieldTitle.id);
      titleNode.remove();
      heading.append(fieldTitle);
    }
    heading.append(trigger(topic));
    wrapper.insertBefore(heading,label);
    wrapper.append(makeSlot());
  }
  function decorateSliders(id,topic){
    const input=$(id),label=root.querySelector('label[for="'+id+'"]');
    if(!input||!label||label.dataset.simHelpReady)return;
    label.dataset.simHelpReady="true";
    const group=elem("div","sim-context-field sim-context-slider");
    label.parentElement.insertBefore(group,label);
    group.append(label,input);
    group.insertBefore(elem("div","sim-context-heading"),label);
    group.querySelector(".sim-context-heading").append(trigger(topic));
    group.append(makeSlot());
  }
  function decorateScenarioTabs(){
    const tabs=$("scenarioTabs");if(!tabs)return;
    const wrap=elem("div","sim-context-area");
    tabs.parentElement.insertBefore(wrap,tabs);
    wrap.append(tabs);
    const actions=elem("div","sim-context-section-heading");
    actions.append(elem("span","","Qual dos três cenários usar?"),trigger("scenario"));
    wrap.insertBefore(actions,tabs);
    wrap.append(makeSlot());
  }
  function decorateResult(){
    const output=root.querySelector(".simulation-output");
    const suggested=$("suggested");
    if(suggested&&output){
      const area=elem("div","sim-context-result-head");
      const row=elem("div","sim-context-heading sim-context-result-title");
      row.append(trigger("suggested"));
      suggested.parentElement.insertBefore(area,suggested);
      area.append(row,suggested,makeSlot());
    }
    for(const [id,topic] of [["cost","cost"],["technical","technical"],["net","net"],
      ["contribution","contribution"],["breakEven","breakEven"],["revenue","revenue"],["profit","profit"]]){
      const value=$(id),r=value?.parentElement;
      if(!r||!r.classList)return;
      const label=r.querySelector("span");
      if(!label)continue;
      const wrap=elem("div","sim-context-metric-title");
      r.insertBefore(wrap,label);
      wrap.append(label,trigger(topic,true));
      r.append(makeSlot());
      r.classList.add("sim-context-metric");
    }
    const range=$( "range")?.closest(".workspace-range");
    if(range){
      const tools=elem("div","sim-context-section-heading");
      tools.append(trigger("range"));
      range.insertAdjacentElement("afterend",tools);
      tools.insertAdjacentElement("afterend",makeSlot());
    }
  }
  function decorateSection(id,topic){
    const el=$(id),section=el?.closest(".sim-section")||el?.closest(".sim-assistant");
    if(!section)return;
    const head=section.querySelector(".sim-heading-row")||section;
    const toolbar=elem("div","sim-context-section-heading");
    toolbar.append(trigger(topic));
    if(head===section) {
      const h=section.querySelector("h2");
      if(h)h.insertAdjacentElement("afterend",toolbar);
      else section.prepend(toolbar);
    } else head.append(toolbar);
    const slot=makeSlot();
    if(head===section)toolbar.insertAdjacentElement("afterend",slot);
    else head.insertAdjacentElement("afterend",slot);
  }
  function close(refocus=false){
    if(!current)return;
    const button=current.button;
    button.setAttribute("aria-expanded","false");
    panel.hidden=true;
    if(panel.parentElement)panel.parentElement.hidden=true;
    current=null;
    if(refocus&&button.isConnected)button.focus();
  }
  function putPanel(slot){
    if(!slot)return;
    if(panel.parentElement!==slot){
      if(panel.parentElement)panel.parentElement.hidden=true;
      slot.append(panel);
    }
    slot.hidden=false;panel.hidden=false;
  }
  function show(topic,button){
    if(current?.button===button){close(true);return;}
    close();
    const slot=button.closest(".sim-context-field")?.querySelector(".sim-help-slot")||
      button.closest(".sim-context-area")?.querySelector(".sim-help-slot")||
      button.closest(".sim-context-metric")?.querySelector(".sim-help-slot")||
      button.closest(".sim-context-result-head")?.querySelector(".sim-help-slot")||
      button.closest(".sim-context-section-heading")?.nextElementSibling?.classList.contains("sim-help-slot")&&
        button.closest(".sim-context-section-heading")?.nextElementSibling||
      button.closest(".sim-section")?.querySelector(".sim-help-slot");
    if(!slot)return;
    current={topic,button,slot};
    button.setAttribute("aria-expanded","true");
    putPanel(slot);
    render();
  }
  function render(){
    if(!current)return;
    const topic=current.topic,g=GUIDE[topic],index=progress.get(topic)||0,
      s=g.steps[index],saved=answers.get(topic);
    panel.replaceChildren();
    const header=elem("div","sim-tutorial-header"),left=elem("div","");
    left.append(elem("span","sim-tutorial-eyebrow","ENTENDER · SIMULAÇÕES"),elem("h3","",g.name));
    const x=elem("button","sim-tutorial-close","×");
    x.type="button";x.dataset.simHelpAction="close";
    x.setAttribute("aria-label","Fechar explicação");
    header.append(left,x);
    const count=elem("div","sim-tutorial-count","Etapa "+(index+1)+" de "+g.steps.length);
    const bar=elem("progress","sim-tutorial-progress");
    bar.max=g.steps.length;bar.value=index+1;
    bar.setAttribute("aria-label","Progresso de "+g.name);
    const subtitle=elem("h4","sim-tutorial-subtitle",s[0]);
    const body=elem("p","sim-tutorial-body",s[1]);
    const example=elem("p","sim-tutorial-example",s[2]);
    const nav=elem("div","sim-tutorial-nav");
    const back=elem("button","sim-tutorial-secondary","Voltar");
    back.type="button";back.dataset.simHelpAction="back";back.disabled=index===0;
    const next=elem("button","sim-tutorial-next",index===g.steps.length-1?"Concluir":"Próximo");
    next.type="button";next.dataset.simHelpAction="next";
    nav.append(back,next);
    const qa=elem("div","sim-tutorial-ask");
    qa.append(elem("h4","","Perguntar à ZUZ"),elem("p","sim-tutorial-small","Escreva sua dúvida específica sobre este assunto."));
    const textarea=elem("textarea","sim-tutorial-question");
    textarea.rows=2;textarea.maxLength=600;
    textarea.value=drafts.get(topic)||"";
    textarea.placeholder=topic==="price"?"Ex.: E se eu cobrar R$ 40?":"Ex.: Como uso isso no meu negócio?";
    textarea.setAttribute("aria-label","Pergunta à ZUZ sobre "+g.name);
    const send=elem("button","sim-tutorial-send","Enviar pergunta");
    send.type="button";send.dataset.simHelpAction="ask";
    const answer=elem("div","sim-tutorial-answer");answer.hidden=!saved;answer.setAttribute("role","status");answer.setAttribute("aria-live","polite");
    if(saved)renderAnswer(answer,saved,topic);
    qa.append(textarea,send,answer);
    panel.append(header,count,bar,subtitle,body,example,nav,qa);
  }
  function renderAnswer(box,result,topic){
    box.replaceChildren();
    const source=result.source==="ia"?"Resposta da ZUZ IA":
      result.source==="guia_contextual"?"Orientação guiada pela ZUZ":"Orientação local (serviço indisponível)";
    box.hidden=false;
    box.append(elem("strong","",source),elem("p","",String(result.answer||"Tente perguntar de outra maneira.").slice(0,2500)));
    const suggestion=result.suggestion;
    if(!suggestion||suggestion.field!==topic)return;
    const field=$(topic),value=Number(suggestion.value);
    if(!field||!Number.isFinite(value))return;
    const apply=elem("button","sim-tutorial-apply",String(suggestion.label||"Usar valor")+" · Confirmar");
    apply.type="button";
    apply.addEventListener("click",()=>{
      const ranges={
        price:[0,100000000],units:[1,1000000],margin:[0,90],
        changePct:[-100,500],goalAmount:[0,1000000000],referencePrice:[.01,100000000]
      };
      const bounds=ranges[topic];
      if(!bounds||value<bounds[0]||value>bounds[1]||(topic==="units"&&!Number.isInteger(value)))return;
      if(topic==="margin"){
        const conf=window.ZUZPricing?.loadSettings?.()||{};
        if(value+(Number(conf.taxesPct)||0)+(Number(conf.sellingFeesPct)||0)>=100){
          alert("A soma de margem, tributos e taxas deve ser menor que 100%.");return;
        }
      }
      if(!window.confirm("Usar "+String(suggestion.label||value)+" na simulação? O cadastro original não será alterado."))return;
      field.value=String(value);
      field.dispatchEvent(new Event("input",{bubbles:true}));
      field.dispatchEvent(new Event("change",{bubbles:true}));
      apply.disabled=true;
      box.append(elem("p","sim-tutorial-applied","Valor aplicado após sua confirmação. Confira os resultados do cenário."));
    });
    box.append(apply);
  }
  function localGuide(topic){
    const g=GUIDE[topic];
    return "Não foi possível consultar o serviço de orientação neste momento. "+
      g.steps[0][1]+" "+g.steps[1][2]+
      "\n\nNenhum campo foi alterado. Você pode continuar usando o tutorial.";
  }
  async function ask(){
    if(!current)return;
    const topic=current.topic,button=current.button;
    const textarea=panel.querySelector(".sim-tutorial-question"),
      answer=panel.querySelector(".sim-tutorial-answer"),
      send=panel.querySelector(".sim-tutorial-send"),
      message=textarea.value.trim();
    drafts.set(topic,textarea.value);
    if(message.length<3){textarea.focus();return;}
    send.disabled=true;send.textContent="Consultando...";
    answer.hidden=false;answer.textContent="Preparando orientação...";
    let result;
    try {
      if(!window.ZUZAPI)throw new Error("offline");
      result=await window.ZUZAPI.request("POST","/help/simulations",{
        topic,message,
        context:{
          productName:$("product")?.selectedOptions?.[0]?.textContent||"",
          price:$("price")?.value||"",
          units:$("units")?.value||"",
          margin:$("margin")?.value||"",
          changePct:$("changePct")?.value||"",
          costMode:$("changeMode")?.value||""
        }
      });
    } catch(error) {
      result={source:"guia_local",answer:localGuide(topic)};
    }
    answers.set(topic,result);
    if(!current||current.topic!==topic||current.button!==button)return;
    send.disabled=false;send.textContent="Enviar pergunta";
    renderAnswer(answer,result,topic);
  }
  // Decorar somente os campos existentes. Nenhum tutorial abre automaticamente.
  const fields=[
    ["product","product"],["price","price"],["units","units"],["margin","margin"],
    ["changeMode","changeMode"],["changePct","changePct"],
    ["goalType","goalType"],["goalAmount","goalAmount"],
    ["referenceName","referenceName"],["referencePrice","referencePrice"],
    ["simulationName","simulationName"]
  ];
  fields.forEach(([id,topic])=>decorateLabel(id,topic));
  decorateSliders("priceSlider","priceSlider");
  decorateSliders("unitsSlider","unitsSlider");
  decorateScenarioTabs();
  decorateResult();
  for(const [id,topic] of [
    ["chartTitle","chart"],["comparisonTitle","comparison"],["goalTitle","goal"],
    ["marketTitle","market"],["historyTitle","history"],["aiTitle","ai"]])decorateSection(id,topic);
  root.addEventListener("click",event=>{
    const btn=event.target.closest("[data-sim-help-topic]");
    if(btn&&root.contains(btn)){const t=btn.dataset.simHelpTopic;if(GUIDE[t])show(t,btn);return;}
    const action=event.target.closest("[data-sim-help-action]");
    if(!action||!current||!panel.contains(action))return;
    switch(action.dataset.simHelpAction){
      case "close":close(true);break;
      case "back":progress.set(current.topic,Math.max(0,(progress.get(current.topic)||0)-1));render();break;
      case "next":{
        const idx=progress.get(current.topic)||0,limit=GUIDE[current.topic].steps.length;
        if(idx+1>=limit)close(true);
        else{progress.set(current.topic,idx+1);render();}
        break;
      }
      case "ask":ask();break;
    }
  });
  root.addEventListener("input",event=>{
    if(event.target.matches(".sim-tutorial-question")&&current)
      drafts.set(current.topic,event.target.value);
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&current)close(true);
  });
})();