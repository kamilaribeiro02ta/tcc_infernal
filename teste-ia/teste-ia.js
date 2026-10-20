(() => {
  "use strict";

  const form = document.getElementById("chatForm");
  const input = document.getElementById("prompt");
  const messages = document.getElementById("messages");
  const send = document.getElementById("send");
  const status = document.getElementById("status");
  const suggestions = document.getElementById("suggestions");
  const initial = messages.innerHTML;
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
    setMascote("thinking");
    send.disabled = true;
    input.value = "";
    suggestions.hidden = true;
    bubble("user", text);
    const pending = bubble("assistant", "");
    pending.classList.add("ia-typing");
    pending.setAttribute("aria-label", "Aguardando resposta da IA");
    for (let i = 0; i < 3; i++) pending.append(document.createElement("span"));
    status.textContent = "Consultando Gemini...";
    try {
      const response = await fetch("/api/ai/test", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível consultar o assistente.");
      const answer = String(data.reply || "Nenhuma resposta recebida.");
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
      pending.textContent = "Não foi possível responder: " + error.message;
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
  document.querySelectorAll(".suggestions button").forEach(button => {
    button.addEventListener("click", () => ask(button.textContent));
  });
  document.getElementById("clear").addEventListener("click", () => {
    setMascote("sleeping");
    history = [];
    messages.innerHTML = initial;
    suggestions.hidden = false;
    status.textContent = "Nova conversa iniciada.";
    input.focus();
  });
})();
