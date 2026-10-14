document.addEventListener("DOMContentLoaded", async () => {
  "use strict";
  const $ = id => document.getElementById(id);
  const templates = window.ZUZBusinessTemplates;
  const fields = ["companyName", "segment", "otherSegment", "operation", "costingMode"];
  let user, step = 1, selected = new Set(), lastTemplate = "";
  let saving = false;

  const choiceInputs = name => [...document.querySelectorAll('input[name="' + name + '"]')];
  const choice = name => choiceInputs(name).find(input => input.checked)?.value || "";
  function setChoice(name, value) {
    const inputs = choiceInputs(name);
    const match = inputs.find(input => input.value === value) || inputs[0];
    if (match) match.checked = true;
  }
  function fieldValue(name) {
    return ["segment", "operation", "costingMode"].includes(name) ? choice(name) : $(name).value;
  }
  function setFieldValue(name, value) {
    if (["segment", "operation", "costingMode"].includes(name)) setChoice(name, value);
    else $(name).value = value;
  }
  const draftKey = () => "zuz-onboard-draft:" + user.id;
  function saveDraft() {
    if (!user) return;
    const draft = { step, categories: [...selected] };
    fields.forEach(name => { draft[name] = fieldValue(name); });
    localStorage.setItem(draftKey(), JSON.stringify(draft));
  }
  function suggestions() {
    const op = choice("operation"), seg = choice("segment");
    return [...new Set([...(templates.operations[op]?.categories || []), ...(templates.segments[seg] || [])])];
  }
  function buildCategories() {
    const templateKey = choice("operation") + "|" + choice("segment");
    if (lastTemplate !== templateKey && !selected.size) selected = new Set(suggestions());
    lastTemplate = templateKey;
    const root = $("categoryList");
    root.replaceChildren();
    for (const name of [...new Set([...suggestions(), ...selected])]) {
      const label = document.createElement("label");
      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = selected.has(name);
      check.addEventListener("change", () => {
        if (check.checked) selected.add(name);
        else selected.delete(name);
        saveDraft();
      });
      const text = document.createElement("span");
      text.textContent = name;
      label.append(check, text);
      root.append(label);
    }
  }
  function render() {
    for (let i = 1; i <= 3; i++) $("step" + i).hidden = i !== step;
    $("stepLabel").textContent = "Etapa " + step + " de 3";
    $("stepNumber").textContent = String(step).padStart(2, "0");
    $("progress").setAttribute("aria-valuenow", String(step));
    $("progressFill").style.width = (step * 100 / 3) + "%";

    document.querySelectorAll("[data-progress-step]").forEach(item => {
      const number = Number(item.dataset.progressStep);
      item.classList.toggle("is-current", number === step);
      item.classList.toggle("is-complete", number < step);
      if (number === step) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });

    $("previous").hidden = step === 1;
    $("next").hidden = step === 3;
    $("save").hidden = step !== 3;
    $("title").textContent = [
      "",
      "Vamos conhecer sua empresa.",
      "Como você trabalha?",
      "Quais custos fazem parte?"
    ][step];
    $("description").textContent = [
      "",
      "Comece pela identidade do seu negócio. É rápido.",
      "Escolha a forma de operação que mais combina com a sua rotina.",
      "Selecione os gastos que fazem parte do seu dia a dia."
    ][step];
    $("otherSegmentWrap").hidden = choice("segment") !== "outros";
    if (step === 3) buildCategories();
    saveDraft();
  }
  function moveTo(nextStep) {
    step = Math.max(1, Math.min(3, nextStep));
    $("error").textContent = "";
    render();
    $("title").focus({ preventScroll: true });
    document.querySelector(".onboard-workspace").scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start"
    });
  }
  function goNext() {
    if (step === 1 && !$("companyName").value.trim()) {
      $("error").textContent = "Informe o nome da empresa.";
      $("companyName").focus();
      return;
    }
    if (step === 1 && choice("segment") === "outros" && !$("otherSegment").value.trim()) {
      $("error").textContent = "Informe o segmento.";
      $("otherSegment").focus();
      return;
    }
    moveTo(step + 1);
  }

  try {
    const me = await ZUZAPI.request("GET", "/me");
    user = me.user;
    if (me.company) {
      $("companyName").value = me.company.name;
      const knownSegment = Object.hasOwn(templates.segments, me.company.segment);
      setChoice("segment", knownSegment ? me.company.segment : "outros");
      $("otherSegment").value = knownSegment ? "" : me.company.segment;
      setChoice("operation", me.company.operation_type);
      setChoice("costingMode", me.company.costing_mode);
      const detail = await ZUZAPI.request("GET", "/company");
      selected = new Set(detail.categories.map(item => item.label));
    } else {
      let draft = {};
      try { draft = JSON.parse(localStorage.getItem(draftKey()) || "{}"); } catch {}
      fields.forEach(name => {
        if (draft[name] !== undefined) setFieldValue(name, draft[name]);
      });
      selected = new Set(Array.isArray(draft.categories) ? draft.categories : []);
      step = Math.max(1, Math.min(3, Number(draft.step) || 1));
    }
    if (!selected.size) selected = new Set(suggestions());
    render();
  } catch {
    window.location.replace("../Login/login.html");
    return;
  }

  choiceInputs("segment").forEach(input => input.addEventListener("change", () => {
    if (!input.checked) return;
    selected = new Set(suggestions());
    $("error").textContent = "";
    render();
  }));
  choiceInputs("operation").forEach(input => input.addEventListener("change", () => {
    if (!input.checked) return;
    setChoice("costingMode", templates.operations[choice("operation")]?.costingMode || "por_unidade");
    selected = new Set(suggestions());
    render();
  }));
  choiceInputs("costingMode").forEach(input => input.addEventListener("change", saveDraft));
  ["companyName", "otherSegment"].forEach(id => $(id).addEventListener("input", () => {
    $("error").textContent = "";
    saveDraft();
  }));

  function addCategory() {
    const name = $("customCategory").value.trim();
    if (!name) { $("customCategory").focus(); return; }
    selected.add(name);
    $("customCategory").value = "";
    buildCategories();
    saveDraft();
  }
  $("addCategory").addEventListener("click", addCategory);
  $("customCategory").addEventListener("keydown", event => {
    if (event.key === "Enter") { event.preventDefault(); addCategory(); }
  });
  $("previous").addEventListener("click", () => moveTo(step - 1));
  $("next").addEventListener("click", goNext);

  $("form").addEventListener("submit", async event => {
    event.preventDefault();
    if (saving) return;
    if (step < 3) { goNext(); return; }
    $("error").textContent = "";
    const name = $("companyName").value.trim();
    const segment = choice("segment") === "outros" ? $("otherSegment").value.trim() : choice("segment");
    if (!name || !segment) { $("error").textContent = "Preencha nome e segmento."; return; }
    saving = true;
    $("save").disabled = true;
    try {
      await ZUZAPI.request("PUT", "/company", {
        name, segment,
        operationType: choice("operation"),
        costingMode: choice("costingMode"),
        categories: [...selected]
      });
      localStorage.removeItem(draftKey());
      window.location.replace("../custos/custos.html");
    } catch (error) {
      $("error").textContent = error.message;
      saving = false;
      $("save").disabled = false;
    }
  });
});
