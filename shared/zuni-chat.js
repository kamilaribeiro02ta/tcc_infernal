(() => {
  "use strict";
  const root=document.createElement("div");root.className="zuni-mini";
  root.innerHTML=`<button type="button" class="zuni-launch" aria-expanded="false" aria-controls="zuni-mini-panel">Falar com a Zuni</button>
  <section id="zuni-mini-panel" class="zuni-panel" role="dialog" aria-label="Chat da Zuni" hidden>
  <header><img src="/teste-ia/assets/mascot-talking.webp" width="40" height="40" alt=""><div><strong>Zuni</strong><small>Assistente da ZUZ</small></div><button type="button" class="zuni-close" aria-label="Fechar chat">×</button></header>
  <div class="zuni-messages" role="log" aria-live="polite" aria-relevant="additions text"></div>
  <p class="zuni-status" role="status"></p><form class="zuni-form"><textarea rows="2" maxlength="3000" aria-label="Mensagem para a Zuni" placeholder="Escreva sua dúvida…" required></textarea><button type="submit">Enviar</button></form></section>`;
  const simulationHost=document.getElementById("zuniSimulationChat");
  if(simulationHost){root.classList.add("zuni-inline");simulationHost.append(root);}else document.body.append(root);
  const panel=root.querySelector(".zuni-panel"),launcher=root.querySelector(".zuni-launch"),messages=root.querySelector(".zuni-messages"),status=root.querySelector(".zuni-status"),input=root.querySelector("textarea"),send=root.querySelector('[type="submit"]');
  if(simulationHost){panel.hidden=false;panel.removeAttribute("role");launcher.hidden=true;root.querySelector(".zuni-close").hidden=true;}
  let busy=false,conversationId=null,returnFocus=launcher,context=simulationHost?"Simulações: ajude a interpretar preços, custos e cenários sem alterar produtos sem confirmação.":"";
  function open(options={}) {
    returnFocus=document.activeElement;context=options.context||context;
    panel.hidden=false;launcher.setAttribute("aria-expanded","true");
    // A saudação inicial vem da primeira resposta do assistente, sem duplicação no chat.
    if(options.message)ask(options.message);else input.focus();
  }
  function close(){if(simulationHost)return;panel.hidden=true;launcher.setAttribute("aria-expanded","false");if(returnFocus?.isConnected)returnFocus.focus();}
  launcher.addEventListener("click",()=>panel.hidden?open():close());root.querySelector(".zuni-close").addEventListener("click",close);
  panel.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();close();}});
  window.ZuniChat={open};
  async function api(path,options={}){
    const response=await fetch("/api/ai/"+path,{credentials:"same-origin",...options});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(data.error||(response.status===401?"Entre na sua conta para conversar com a Zuni.":"Não foi possível consultar a Zuni."));return data;
  }
  function formattedText(target, text) {
    const pieces = String(text).split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\`[^\`\n]+\`)/g);
    pieces.forEach(piece => {
      let element;
      if (/^\*\*[^*\n]+\*\*$/.test(piece)) {
        element = document.createElement("strong");
        element.textContent = piece.slice(2, -2);
      } else if (/^\*[^*\n]+\*$/.test(piece)) {
        element = document.createElement("em");
        element.textContent = piece.slice(1, -1);
      } else if (/^\`[^\`\n]+\`$/.test(piece)) {
        element = document.createElement("code");
        element.textContent = piece.slice(1, -1);
      } else {
        element = document.createTextNode(piece);
      }
      target.append(element);
    });
  }

  function renderAnswer(target, content) {
    target.replaceChildren();
    const lines = String(content).replace(/\r\n/g, "\n").split("\n");
    let list = null;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { list = null; continue; }
      const heading = line.match(/^#{1,4}\s+(.+)$/);
      const bullet = line.match(/^[-*]\s+(.+)$/);
      const numbered = line.match(/^\d+[.)]\s+(.+)$/);
      if (heading) {
        list = null;
        const h = document.createElement(line.startsWith("# ") ? "h3" : "h4");
        formattedText(h, heading[1]);
        target.append(h);
      } else if (bullet || numbered) {
        const type = numbered ? "ol" : "ul";
        if (!list || list.tagName.toLowerCase() !== type) {
          list = document.createElement(type);
          target.append(list);
        }
        const li = document.createElement("li");
        formattedText(li, (bullet || numbered)[1]);
        list.append(li);
      } else {
        list = null;
        const p = document.createElement("p");
        formattedText(p, line);
        target.append(p);
      }
    }
  }

  function scrollBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function bubble(role, content) {
    const node = document.createElement("div");
    node.className = "bubble " + (role === "user" ? "user" : "assistant");
    node.textContent = content;
    messages.append(node);
    scrollBottom();
    return node;
  }

  function actionCard(action) {
    const card=document.createElement("div");card.className="bubble assistant ia-action-card";
    const title=document.createElement("strong");title.textContent=action.kind==="create_product"?"Confirmar cadastro":"Confirmar alteração";
    const details=document.createElement("p"),p=action.product;
    const brl=value=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(value);
    details.style.whiteSpace="pre-line";
    details.textContent=`${p.name} · ${p.category}\n${p.costs.map(c=>`${c.name}: ${brl(c.value)}`).join("\n")}\nVenda: ${brl(p.salePrice)} · Margem desejada: ${p.targetMargin}%\nVolume mensal: ${p.units} unidades`;
    const feedback=document.createElement("p");feedback.setAttribute("role","status");
    const controls=document.createElement("div");controls.className="ia-action-controls";
    card.append(title,details,controls,feedback);
    const showState=state=>{
      if(state==="pending")return;
      controls.replaceChildren();feedback.textContent=state==="completed"?"Salvo na sua conta.":"Ação cancelada.";
      if(state==="completed"){
        const link=document.createElement("a");link.href="/produtos/produtos.html";link.textContent="Ver produtos";controls.append(link);
      }
    };
    for(const [decision,label] of [["confirm",title.textContent],["cancel","Cancelar"]]){
      const button=document.createElement("button");button.type="button";button.textContent=label;
      button.addEventListener("click",async()=>{
        const buttons=[...controls.querySelectorAll("button")];buttons.forEach(b=>b.disabled=true);
        try{
          const result=await api("actions/"+encodeURIComponent(action.id),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({decision})});
          showState(result.state);
          status.textContent=result.state==="completed"?"Produto salvo na sua conta.":"Ação cancelada.";
           if(result.state==="completed" && window.location.pathname.toLowerCase().includes("/produtos/")) window.location.reload();
        }catch(error){feedback.textContent=error.message;buttons.forEach(b=>b.disabled=false);}
      });controls.append(button);
    }
    showState(action.state);messages.append(card);scrollBottom();
  }


  async function ask(text){
    text=String(text||"").trim();if(!text||busy)return;
    busy=true;send.disabled=true;input.value="";bubble("user",text);
    const pending=bubble("model","Pensando na sua resposta…");status.textContent="Zuni está pensando…";
    try{
      const message=context?"Contexto de ajuda da página: "+context.slice(0,Math.max(0,2900-text.length))+"\n\nPergunta: "+text:text;
      const data=await api("test",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:message.length<=3000?message:text,conversationId})});
      conversationId=data.conversationId||conversationId;renderAnswer(pending,data.reply||"Não recebi uma resposta. Tente novamente.");
      for(const action of data.actions||[])actionCard(action);
      status.textContent="Confira os cálculos. Alterações exigem sua confirmação.";
    }catch(error){
      pending.textContent=error.message;const retry=document.createElement("button");retry.type="button";retry.textContent="Tentar novamente";retry.addEventListener("click",()=>{if(!busy){pending.remove();ask(text);}});pending.append(retry);status.textContent="Não foi possível concluir a resposta.";
    }finally{busy=false;send.disabled=false;scrollBottom();if(!panel.hidden)input.focus();}
  }
  root.querySelector("form").addEventListener("submit",e=>{e.preventDefault();ask(input.value);});
  input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();root.querySelector("form").requestSubmit();}});
  document.querySelectorAll("[data-zuni-chat]").forEach(button=>button.addEventListener("click",()=>open({context:button.dataset.zuniChat})));
})();
