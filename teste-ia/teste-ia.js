(() => {
  "use strict";

  const form = document.getElementById("chatForm");
  const input = document.getElementById("prompt");
  const messages = document.getElementById("messages");
  const send = document.getElementById("send");
  const status = document.getElementById("status");
  const suggestions = document.getElementById("suggestions");
  const initial = messages.innerHTML;
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
    send.disabled = true;
    input.value = "";
    suggestions.hidden = true;
    bubble("user", text);
    const pending = bubble("assistant", "Pensando...");
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
      renderAnswer(pending, answer);
      history.push({ role: "user", text }, { role: "model", text: answer });
      history = history.slice(-20);
      status.textContent = "Ambiente de testes: nenhuma alteração foi salva na sua empresa.";
      scrollBottom();
    } catch (error) {
      pending.textContent = "Não foi possível responder: " + error.message;
      status.textContent = "Confira o erro exibido acima.";
    } finally {
      busy = false;
      send.disabled = false;
      input.focus();
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
  document.querySelectorAll(".suggestions button").forEach(button => {
    button.addEventListener("click", () => ask(button.textContent));
  });
  document.getElementById("clear").addEventListener("click", () => {
    history = [];
    messages.innerHTML = initial;
    suggestions.hidden = false;
    status.textContent = "Nova conversa iniciada.";
    input.focus();
  });
})();
