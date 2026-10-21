(() => {
  "use strict";

  const form = document.getElementById("chatForm");
  const input = document.getElementById("prompt");
  const messages = document.getElementById("messages");
  const send = document.getElementById("send");
  const status = document.getElementById("status");
  const suggestions = document.getElementById("suggestions");
  const initial = messages.innerHTML;
  const chatArea=document.querySelector(".ia-chat-area");
  const setWelcome=visible=>chatArea.classList.toggle("is-welcome",visible);
  const mascot = document.getElementById("mascot");
  const mascotLabel = document.getElementById("mascotLabel");
  let mascotTimer = null;
  let idleTimer = null;
  function setMascote(state) {
    if (!mascot) return;
    clearTimeout(mascotTimer);
    clearTimeout(idleTimer);
    mascot.dataset.state = state;
    const labels = { sleeping: "Aguardando sua pergunta", idle: "Pronto para conversar", thinking: "Pensando na sua resposta...", talking: "Respondendo..." };
    const descriptions = { sleeping: "Mascote da ZUZ aguardando", idle: "Mascote da ZUZ pronto para conversar", thinking: "Mascote da ZUZ pensando", talking: "Mascote da ZUZ respondendo" };
    mascot.setAttribute("aria-label", descriptions[state] || descriptions.sleeping);
    if (mascotLabel) mascotLabel.textContent = labels[state] || labels.sleeping;
  }
  function scheduleSleep(delay = 2600) {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!busy && !input.value.trim()) setMascote("sleeping");
    }, delay);
  }
  setMascote("sleeping");
  let history = [];
  let busy = false;
  let lastFailedMessage = "";
  let currentConversationId = null;
  const conversationList = document.getElementById("conversationList");
  const historyToggle = document.getElementById("historyToggle");
  const historyPane = document.querySelector(".ia-history");
  async function api(path, options={}) {
    const response=await fetch("/api/ai/"+path,{credentials:"same-origin",...options});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||"Não foi possível acessar o histórico.");
    return data;
  }
  const conversationSearch = document.getElementById("conversationSearch");
  function filterConversations() {
    const query = conversationSearch.value.trim().toLocaleLowerCase("pt-BR");
    conversationList.querySelectorAll(".ia-conversation").forEach(item => {
      item.hidden = !item.querySelector(".ia-conversation-open").textContent.toLocaleLowerCase("pt-BR").includes(query);
    });
  }
  conversationSearch.addEventListener("input", filterConversations);
  async function refreshConversations() {
    try {
      const data=await api("conversations");
      conversationList.replaceChildren();
      if(!data.conversations.length) {
        const empty=document.createElement("p");
        empty.className="ia-history-empty";
        empty.textContent="Suas conversas aparecerão aqui.";
        conversationList.append(empty);
      }
      for(const conversation of data.conversations) {
        const item=document.createElement("div");
        item.className="ia-conversation"+(conversation.id===currentConversationId?" selected":"");
        const open=document.createElement("button");
        open.type="button";
        open.className="ia-conversation-open";
        open.textContent=conversation.title;
        open.title=conversation.title;
        open.addEventListener("click",()=>openConversation(conversation.id));
        const del=document.createElement("button");
        del.type="button";
        del.className="ia-conversation-delete";
        del.setAttribute("aria-label","Excluir conversa "+conversation.title);
        del.textContent="×";
        del.addEventListener("click",async()=>{
          if(busy)return;
          if(!confirm("Excluir esta conversa permanentemente?"))return;
          try {
            await api("conversations/"+encodeURIComponent(conversation.id),{method:"DELETE"});
            if(currentConversationId===conversation.id)newConversation();
            await refreshConversations();
          }catch(error){status.textContent=error.message;}
        });
        item.append(open,del);
        conversationList.append(item);
      }
      filterConversations();
    }catch(error){
      conversationList.replaceChildren();
      const notice=document.createElement("div");
      notice.className="ia-history-empty ia-history-error";
      const title=document.createElement("strong");
      title.textContent="Histórico indisponível";
      const detail=document.createElement("p");
      detail.textContent="Não foi possível carregar suas conversas. Você ainda pode usar o chat.";
      const retry=document.createElement("button");
      retry.type="button";
      retry.textContent="Recarregar histórico";
      retry.addEventListener("click",refreshConversations);
      notice.append(title,detail,retry);
      conversationList.append(notice);
      status.textContent=error.message;
    }
  }
  async function openConversation(id) {
    if(busy)return;
    try {
      const data=await api("conversations/"+encodeURIComponent(id));
      currentConversationId=id;
      setWelcome(false);
      history=data.messages.map(m=>({role:m.role,text:m.text})).slice(-20);
      messages.replaceChildren();
      for(const entry of data.messages) {
        const node=bubble(entry.role,entry.text);
        if(entry.role==="model")renderAnswer(node,entry.text);
      }
      suggestions.hidden=true;
      setMascote("idle");
      status.textContent="Conversa recuperada. Você pode continuar de onde parou.";
      await refreshConversations();
      historyPane.classList.remove("mobile-open");
      historyToggle.setAttribute("aria-expanded","false");
    }catch(error){status.textContent=error.message;}
  }
  function newConversation(){
    if(busy)return;
    currentConversationId=null;
    setWelcome(true);
    history=[];
    messages.innerHTML=initial;
    suggestions.hidden=false;
    status.textContent="Nova conversa iniciada.";
    setMascote("sleeping");
    refreshConversations();
    input.focus();
  }
  document.getElementById("newChatSidebar").addEventListener("click",newConversation);
  historyToggle.addEventListener("click",()=>{
    const open=historyPane.classList.toggle("mobile-open");
    historyToggle.setAttribute("aria-expanded",String(open));
  });
  refreshConversations();


  // Renderização limitada de Markdown via nós DOM: o texto da IA nunca é executado como HTML.
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

  async function ask(text) {
    text = String(text || "").trim();
    if (!text || busy) return;
    busy = true;
    setWelcome(false);
    lastFailedMessage = "";
    setMascote("thinking");
    send.disabled = true;
    input.value = "";
    suggestions.hidden = true;
    bubble("user", text);
    const pending = bubble("assistant", "");
    pending.classList.add("ia-typing");
    pending.setAttribute("aria-label", "Aguardando resposta da IA");
    pending.textContent = "Preparando resposta...";
    status.textContent = "Consultando Gemini...";
    try {
      const response = await fetch("/api/ai/test", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: currentConversationId })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível consultar o assistente.");
      const answer = String(data.reply || "Nenhuma resposta recebida.");
      currentConversationId=data.conversationId||currentConversationId;
      refreshConversations();
      pending.classList.remove("ia-typing");
      pending.removeAttribute("aria-label");
      renderAnswer(pending, answer);
      setMascote("talking");
      mascotTimer = setTimeout(() => { setMascote("idle"); scheduleSleep(); }, 2800);
      history.push({ role: "user", text }, { role: "model", text: answer });
      history = history.slice(-20);
      status.textContent = "Ambiente de testes: nenhuma alteração foi salva na sua empresa.";
      scrollBottom();
    } catch (error) {
      setMascote("sleeping");
      pending.classList.remove("ia-typing");
      lastFailedMessage = text;
      pending.textContent = "Não foi possível responder: " + error.message;
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "ia-retry";
      retry.textContent = "Tentar novamente";
      retry.addEventListener("click", () => { pending.remove(); ask(lastFailedMessage); });
      pending.append(retry);
      status.textContent = "Confira o erro exibido acima.";
    } finally {
      busy = false;
      send.disabled = false;
      input.focus();
      if (mascot && mascot.dataset.state === "sleeping") scheduleSleep();
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    ask(input.value);
  });
  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  input.addEventListener("input", () => {
    input.style.height = "44px";
    input.style.height = Math.min(120, Math.max(44, input.scrollHeight)) + "px";
    if (busy) return;
    if (input.value.trim()) setMascote("idle");
    else scheduleSleep(1000);
  });
  document.querySelectorAll(".zuni-quick").forEach(button => {
    button.addEventListener("click",()=>ask(button.dataset.prompt));
  });
  document.querySelectorAll(".suggestions button").forEach(button => {
    button.addEventListener("click", () => ask(button.textContent));
  });
  document.getElementById("clear").addEventListener("click", newConversation);
})();
