(() => {
  "use strict";

  const STORAGE_KEY = "zuz-pricing-products-v2";
  const THEME_KEY = "zuz-theme";

  const els = {
    themeToggle: document.getElementById("themeToggle"),
    themeLabel: document.getElementById("themeLabel"),
    iconSun: document.getElementById("iconSun"),
    iconMoon: document.getElementById("iconMoon"),

    summaryProducts: document.getElementById("summaryProducts"),
    summaryCategories: document.getElementById("summaryCategories"),
    summaryMargin: document.getElementById("summaryMargin"),
    summaryRevenue: document.getElementById("summaryRevenue"),

    searchInput: document.getElementById("searchInput"),
    categoryFilter: document.getElementById("categoryFilter"),
    marginFilter: document.getElementById("marginFilter"),
    sortSelect: document.getElementById("sortSelect"),
    activeFilters: document.getElementById("activeFilters"),
    viewCounter: document.getElementById("viewCounter"),

    productsBody: document.getElementById("productsBody"),
    mobileProducts: document.getElementById("mobileProducts"),
    emptyState: document.getElementById("emptyState"),

    newProductBtn: document.getElementById("newProductBtn"),
    emptyAddBtn: document.getElementById("emptyAddBtn"),

    productModal: document.getElementById("productModal"),
    closeModalBtn: document.getElementById("closeModalBtn"),
    cancelModalBtn: document.getElementById("cancelModalBtn"),
    productForm: document.getElementById("productForm"),
    modalKicker: document.getElementById("modalKicker"),
    modalTitle: document.getElementById("modalTitle"),

    nameInput: document.getElementById("nameInput"),
    categoryInput: document.getElementById("categoryInput"),
    grossPriceInput: document.getElementById("grossPriceInput"),
    costItems: document.getElementById("costItems"),
    addCostItemBtn: document.getElementById("addCostItemBtn"),
    salePriceInput: document.getElementById("salePriceInput"),
    unitsInput: document.getElementById("unitsInput"),
    targetMarginInput: document.getElementById("targetMarginInput"),
    dateInput: document.getElementById("dateInput"),

    feedbackCost: document.getElementById("feedbackCost"),
    feedbackMargin: document.getElementById("feedbackMargin"),
    feedbackSuggested: document.getElementById("feedbackSuggested"),
    pricingFeedback: document.getElementById("pricingFeedback"),
    useSuggestionBtn: document.getElementById("useSuggestionBtn"),
    formMessage: document.getElementById("formMessage"),

    confirmOverlay: document.getElementById("confirmOverlay"),
    confirmText: document.getElementById("confirmText"),
    cancelDeleteBtn: document.getElementById("cancelDeleteBtn"),
    confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),

    toast: document.getElementById("toast")
  };

  let products = loadProducts();
  let editingId = null;
  let pendingDeleteId = null;

  function randomId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function numberValue(value) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function currency(value) {
    const safe = Number.isFinite(Number(value)) ? Number(value) : 0;

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(safe);
  }

  function percent(value) {
    const safe = Number.isFinite(Number(value)) ? Number(value) : 0;

    return safe.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }) + "%";
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  function todayInputValue() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
  }

  function formatDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || "")) {
      return "Sem data";
    }

    const [year, month, day] = dateString.split("-");

    return day + "/" + month + "/" + year;
  }

  function normalizeProduct(product) {
    return {
      id: String(product.id || randomId()),
      name: String(product.name || "Produto"),
      category: String(product.category || "Sem categoria"),
      baseCost: Math.max(0, numberValue(product.baseCost)),
      additionalCosts: Array.isArray(product.additionalCosts)
        ? product.additionalCosts
            .map(item => ({
              label: String(item.label || "Custo adicional"),
              value: Math.max(0, numberValue(item.value))
            }))
            .filter(item => item.value > 0)
        : [],
      targetMargin: Math.min(95, Math.max(0, numberValue(product.targetMargin || 30))),
      salePrice: Math.max(0, numberValue(product.salePrice)),
      units: Math.max(0, Math.round(numberValue(product.units))),
      date: /^\d{4}-\d{2}-\d{2}$/.test(product.date || "")
        ? product.date
        : todayInputValue()
    };
  }

  function createDemoProducts() {
    const now = new Date();
    const year = now.getFullYear();
    const currentMonth = now.getMonth();

    function dateFor(offset, day) {
      const date = new Date(year, currentMonth - offset, day);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");

      return y + "-" + m + "-" + d;
    }

    return [
      {
        id: randomId(),
        name: "Produto principal",
        category: "Mais vendido",
        baseCost: 18.5,
        additionalCosts: [{ label: "Embalagem", value: 2.2 }],
        targetMargin: 35,
        salePrice: 34.9,
        units: 92,
        date: dateFor(0, 12)
      },
      {
        id: randomId(),
        name: "Kit especial",
        category: "Kits",
        baseCost: 29,
        additionalCosts: [{ label: "Embalagem", value: 3.5 }],
        targetMargin: 38,
        salePrice: 54.9,
        units: 38,
        date: dateFor(0, 8)
      },
      {
        id: randomId(),
        name: "Produto premium",
        category: "Premium",
        baseCost: 42,
        additionalCosts: [{ label: "Taxa", value: 4 }],
        targetMargin: 40,
        salePrice: 79.9,
        units: 25,
        date: dateFor(1, 18)
      },
      {
        id: randomId(),
        name: "Produto básico",
        category: "Linha básica",
        baseCost: 11,
        additionalCosts: [{ label: "Embalagem", value: 1.5 }],
        targetMargin: 32,
        salePrice: 21.9,
        units: 74,
        date: dateFor(1, 7)
      }
    ];
  }

  function loadProducts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          return parsed.map(normalizeProduct);
        }
      }
    } catch (error) {
      console.warn("Não foi possível ler os produtos salvos.", error);
    }

    const demo = createDemoProducts();

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    } catch (error) {
      console.warn("Não foi possível salvar os dados iniciais.", error);
    }

    return demo;
  }

  function saveProducts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.warn("Não foi possível salvar os produtos.", error);
      showToast("Alteração feita, mas o navegador não permitiu salvar os dados.");
    }
  }

  function additionalCostTotal(product) {
    return Array.isArray(product.additionalCosts)
      ? product.additionalCosts.reduce((sum, item) => sum + numberValue(item.value), 0)
      : 0;
  }

  function unitCost(product) {
    return numberValue(product.baseCost) + additionalCostTotal(product);
  }

  function unitMarginValue(product) {
    return numberValue(product.salePrice) - unitCost(product);
  }

  function marginPct(product) {
    const price = numberValue(product.salePrice);

    if (price <= 0) {
      return 0;
    }

    return (unitMarginValue(product) / price) * 100;
  }

  function projectedRevenue(product) {
    return numberValue(product.salePrice) * Math.max(0, numberValue(product.units));
  }

  function projectedResult(product) {
    return unitMarginValue(product) * Math.max(0, numberValue(product.units));
  }

  function marginClass(value) {
    if (value < 0) return "bad";
    if (value < 20) return "warn";
    return "good";
  }

  function marginLabel(value) {
    if (value < 0) return "Prejuízo";
    if (value < 20) return "Margem baixa";
    return "Saudável";
  }

  function renderSummary() {
    const categories = new Set(
      products
        .map(product => product.category.trim())
        .filter(Boolean)
    );

    const averageMargin = products.length
      ? products.reduce((sum, product) => sum + marginPct(product), 0) / products.length
      : 0;

    const revenue = products.reduce((sum, product) => {
      return sum + projectedRevenue(product);
    }, 0);

    els.summaryProducts.textContent = String(products.length);
    els.summaryCategories.textContent = String(categories.size);
    els.summaryMargin.textContent = percent(averageMargin);
    els.summaryRevenue.textContent = currency(revenue);
  }

  function renderCategoryOptions() {
    const current = els.categoryFilter.value;

    const categories = [
      ...new Set(
        products
          .map(product => product.category.trim())
          .filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));

    els.categoryFilter.innerHTML =
      '<option value="">Todas as categorias</option>' +
      categories
        .map(category => {
          return '<option value="' + escapeHtml(category) + '">' +
            escapeHtml(category) +
          "</option>";
        })
        .join("");

    if (categories.includes(current)) {
      els.categoryFilter.value = current;
    }
  }

  function filteredProducts() {
    const query = els.searchInput.value.trim().toLocaleLowerCase("pt-BR");
    const category = els.categoryFilter.value;
    const margin = els.marginFilter.value;
    const sort = els.sortSelect.value;

    let list = products.filter(product => {
      const queryMatch =
        !query ||
        product.name.toLocaleLowerCase("pt-BR").includes(query) ||
        product.category.toLocaleLowerCase("pt-BR").includes(query);

      const categoryMatch =
        !category ||
        product.category === category;

      const productMarginClass = marginClass(marginPct(product));
      const marginMatch =
        !margin ||
        productMarginClass === margin;

      return queryMatch && categoryMatch && marginMatch;
    });

    list = list.slice();

    if (sort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    } else if (sort === "margin-desc") {
      list.sort((a, b) => marginPct(b) - marginPct(a));
    } else if (sort === "margin-asc") {
      list.sort((a, b) => marginPct(a) - marginPct(b));
    } else if (sort === "price-desc") {
      list.sort((a, b) => numberValue(b.salePrice) - numberValue(a.salePrice));
    } else {
      list.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    }

    return list;
  }

  function renderActiveFilters() {
    const chips = [];

    if (els.searchInput.value.trim()) {
      chips.push({
        label: 'Busca: "' + els.searchInput.value.trim() + '"',
        clear: () => {
          els.searchInput.value = "";
          renderCatalog();
        }
      });
    }

    if (els.categoryFilter.value) {
      chips.push({
        label: "Categoria: " + els.categoryFilter.value,
        clear: () => {
          els.categoryFilter.value = "";
          renderCatalog();
        }
      });
    }

    if (els.marginFilter.value) {
      const labels = {
        good: "Margem saudável",
        warn: "Margem baixa",
        bad: "Prejuízo"
      };

      chips.push({
        label: labels[els.marginFilter.value],
        clear: () => {
          els.marginFilter.value = "";
          renderCatalog();
        }
      });
    }

    els.activeFilters.hidden = chips.length === 0;
    els.activeFilters.innerHTML = "";

    chips.forEach(chip => {
      const wrapper = document.createElement("span");
      wrapper.className = "filter-chip";

      const text = document.createElement("span");
      text.textContent = chip.label;

      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", "Remover filtro " + chip.label);
      button.innerHTML = '<i class="bx bx-x"></i>';
      button.addEventListener("click", chip.clear);

      wrapper.append(text, button);
      els.activeFilters.appendChild(wrapper);
    });
  }

  function productTableRow(product) {
    const cost = unitCost(product);
    const margin = marginPct(product);
    const result = projectedResult(product);

    return `
      <tr>
        <td class="product-cell">
          <strong>${escapeHtml(product.name)}</strong>
          <span>Atualizado em ${formatDate(product.date)}</span>
        </td>

        <td>
          <span class="category-pill">${escapeHtml(product.category)}</span>
        </td>

        <td>${currency(cost)}</td>

        <td>
          <strong style="color:var(--text-primary)">${currency(product.salePrice)}</strong>
        </td>

        <td>
          <span class="margin-pill ${marginClass(margin)}" title="${marginLabel(margin)}">
            ${percent(margin)}
          </span>
        </td>

        <td>${Math.round(numberValue(product.units))}</td>

        <td>
          <span class="result-value ${result >= 0 ? "good" : "bad"}">
            ${currency(result)}
          </span>
        </td>

        <td>
          <div class="row-actions">
            <button class="icon-btn" type="button" data-edit="${product.id}" aria-label="Editar ${escapeHtml(product.name)}" title="Editar">
              <i class="bx bx-pencil"></i>
            </button>

            <button class="icon-btn danger" type="button" data-delete="${product.id}" aria-label="Excluir ${escapeHtml(product.name)}" title="Excluir">
              <i class="bx bx-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function mobileCard(product) {
    const cost = unitCost(product);
    const margin = marginPct(product);
    const result = projectedResult(product);

    return `
      <article class="product-mobile-card">
        <div class="product-mobile-top">
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            <span>${escapeHtml(product.category)} · ${formatDate(product.date)}</span>
          </div>

          <span class="margin-pill ${marginClass(margin)}">${percent(margin)}</span>
        </div>

        <div class="product-mobile-meta">
          <div>
            <span>Custo unit.</span>
            <strong>${currency(cost)}</strong>
          </div>

          <div>
            <span>Preço</span>
            <strong>${currency(product.salePrice)}</strong>
          </div>

          <div>
            <span>Vendas</span>
            <strong>${Math.round(numberValue(product.units))}</strong>
          </div>

          <div>
            <span>Resultado</span>
            <strong class="result-value ${result >= 0 ? "good" : "bad"}">${currency(result)}</strong>
          </div>
        </div>

        <div class="product-mobile-actions">
          <span class="category-pill">${escapeHtml(product.category)}</span>

          <div class="row-actions">
            <button class="icon-btn" type="button" data-edit="${product.id}" aria-label="Editar ${escapeHtml(product.name)}">
              <i class="bx bx-pencil"></i>
            </button>

            <button class="icon-btn danger" type="button" data-delete="${product.id}" aria-label="Excluir ${escapeHtml(product.name)}">
              <i class="bx bx-trash"></i>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function bindProductActions() {
    document.querySelectorAll("[data-edit]").forEach(button => {
      button.addEventListener("click", () => {
        openEditModal(button.dataset.edit);
      });
    });

    document.querySelectorAll("[data-delete]").forEach(button => {
      button.addEventListener("click", () => {
        openDeleteConfirm(button.dataset.delete);
      });
    });
  }

  function renderCatalog() {
    renderCategoryOptions();
    renderActiveFilters();

    const list = filteredProducts();

    els.viewCounter.textContent =
      list.length === 1
        ? "1 produto"
        : list.length + " produtos";

    els.emptyState.hidden = list.length > 0;
    els.productsBody.innerHTML = list.map(productTableRow).join("");
    els.mobileProducts.innerHTML = list.map(mobileCard).join("");

    bindProductActions();
  }

  function renderAll() {
    renderSummary();
    renderCatalog();
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const isDark = saved === "dark";

    applyTheme(isDark);

    els.themeToggle.addEventListener("click", () => {
      const nextDark = !document.body.classList.contains("dark");

      applyTheme(nextDark);
      localStorage.setItem(THEME_KEY, nextDark ? "dark" : "light");
    });
  }

  function applyTheme(isDark) {
    document.body.classList.toggle("dark", isDark);
    els.themeToggle.setAttribute("aria-pressed", String(isDark));
    els.themeLabel.textContent = isDark ? "Modo Escuro" : "Modo Claro";
    els.iconSun.style.display = isDark ? "none" : "block";
    els.iconMoon.style.display = isDark ? "block" : "none";
  }

  function openModal() {
    els.productModal.classList.add("open");
    els.productModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      els.nameInput.focus();
    });
  }

  function closeModal() {
    els.productModal.classList.remove("open");
    els.productModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    editingId = null;
  }

  function addCostItemRow(label = "", value = "") {
    const row = document.createElement("div");
    row.className = "cost-item-row";

    row.innerHTML = `
      <div class="cost-item-name">
        <i class="bx bx-purchase-tag-alt"></i>
        <input type="text" class="cost-item-label" maxlength="45" placeholder="Ex: Farinha, embalagem, taxa">
      </div>

      <div class="cost-item-value money-input">
        <span>R$</span>
        <input type="number" class="cost-item-amount" min="0" step="0.01" inputmode="decimal" placeholder="0,00">
      </div>

      <button class="remove-cost-item" type="button" aria-label="Remover item de custo" title="Remover">
        <i class="bx bx-trash"></i>
      </button>
    `;

    row.querySelector(".cost-item-label").value = label;
    row.querySelector(".cost-item-amount").value = value === "" ? "" : String(value);

    row.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", updatePricingFeedback);
    });

    row.querySelector(".remove-cost-item").addEventListener("click", () => {
      row.remove();

      if (!els.costItems.children.length) {
        addCostItemRow();
      }

      updatePricingFeedback();
    });

    els.costItems.appendChild(row);
    updatePricingFeedback();
  }

  function costItemsFromForm() {
    return [...els.costItems.querySelectorAll(".cost-item-row")]
      .map(row => ({
        label: row.querySelector(".cost-item-label").value.trim() || "Custo do produto",
        value: Math.max(0, numberValue(row.querySelector(".cost-item-amount").value))
      }))
      .filter(item => item.value > 0);
  }

  function resetForm() {
    els.productForm.reset();
    els.nameInput.value = "";
    els.categoryInput.value = "";
    els.salePriceInput.value = "";
    els.unitsInput.value = "0";
    els.targetMarginInput.value = "30";
    els.dateInput.value = todayInputValue();
    els.costItems.innerHTML = "";
    els.formMessage.textContent = "";

    addCostItemRow();
    updatePricingFeedback();
  }

  function openNewModal() {
    editingId = null;
    resetForm();

    els.modalKicker.textContent = "Novo produto";
    els.modalTitle.textContent = "Cadastrar produto";

    openModal();
  }

  function openEditModal(productId) {
    const product = products.find(item => item.id === productId);

    if (!product) {
      return;
    }

    editingId = product.id;

    els.modalKicker.textContent = "Editar cadastro";
    els.modalTitle.textContent = product.name;

    els.nameInput.value = product.name;
    els.categoryInput.value = product.category;
    els.salePriceInput.value = String(numberValue(product.salePrice));
    els.unitsInput.value = String(Math.round(numberValue(product.units)));
    els.targetMarginInput.value = String(numberValue(product.targetMargin || 30));
    els.dateInput.value = product.date;
    els.costItems.innerHTML = "";
    els.formMessage.textContent = "";

    if (numberValue(product.baseCost) > 0) {
      addCostItemRow("Custo principal", numberValue(product.baseCost));
    }

    if (Array.isArray(product.additionalCosts)) {
      product.additionalCosts.forEach(item => {
        addCostItemRow(item.label || "Custo adicional", numberValue(item.value));
      });
    }

    if (!els.costItems.children.length) {
      addCostItemRow();
    }

    updatePricingFeedback();
    openModal();
  }

  function formPricing() {
    const costItems = costItemsFromForm();
    const totalCost = costItems.reduce((sum, item) => sum + item.value, 0);
    const salePrice = Math.max(0, numberValue(els.salePriceInput.value));
    const targetMargin = Math.min(95, Math.max(0, numberValue(els.targetMarginInput.value)));
    const currentMargin =
      salePrice > 0
        ? ((salePrice - totalCost) / salePrice) * 100
        : 0;

    const suggestedPrice =
      totalCost > 0
        ? totalCost / (1 - targetMargin / 100)
        : 0;

    return {
      costItems,
      totalCost,
      salePrice,
      targetMargin,
      currentMargin,
      suggestedPrice
    };
  }

  function updatePricingFeedback() {
    const pricing = formPricing();

    els.feedbackCost.textContent = currency(pricing.totalCost);
    els.grossPriceInput.value = pricing.totalCost.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    els.feedbackMargin.textContent = percent(pricing.currentMargin);
    els.feedbackSuggested.textContent = currency(pricing.suggestedPrice);

    els.pricingFeedback.style.borderColor =
      pricing.salePrice > 0 && pricing.currentMargin < 0
        ? "var(--red)"
        : "var(--border)";
  }

  function saveForm(event) {
    event.preventDefault();

    const name = els.nameInput.value.trim();
    const category = els.categoryInput.value.trim() || "Sem categoria";
    const pricing = formPricing();
    const units = Math.max(0, Math.round(numberValue(els.unitsInput.value)));
    const date = els.dateInput.value;

    if (!name) {
      els.formMessage.textContent = "Informe o nome do produto.";
      els.nameInput.focus();
      return;
    }

    if (pricing.totalCost <= 0) {
      els.formMessage.textContent = "Adicione pelo menos um item de custo com valor maior que zero.";
      const firstCostInput = els.costItems.querySelector(".cost-item-amount");
      firstCostInput?.focus();
      return;
    }

    if (pricing.salePrice <= 0) {
      els.formMessage.textContent = "Informe um preço de venda maior que zero.";
      els.salePriceInput.focus();
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      els.formMessage.textContent = "Informe uma data válida.";
      els.dateInput.focus();
      return;
    }

    const normalized = normalizeProduct({
      id: editingId || randomId(),
      name,
      category,
      baseCost: 0,
      additionalCosts: pricing.costItems,
      targetMargin: pricing.targetMargin,
      salePrice: pricing.salePrice,
      units,
      date
    });

    if (editingId) {
      products = products.map(product => {
        return product.id === editingId ? normalized : product;
      });

      showToast("Produto atualizado.");
    } else {
      products.push(normalized);
      showToast("Produto cadastrado.");
    }

    saveProducts();
    closeModal();
    renderAll();
  }

  function openDeleteConfirm(productId) {
    const product = products.find(item => item.id === productId);

    if (!product) {
      return;
    }

    pendingDeleteId = product.id;
    els.confirmText.textContent =
      'Excluir "' + product.name + '"? Essa ação também atualiza os dados usados no gráfico.';

    els.confirmOverlay.classList.add("open");
    els.confirmOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      els.cancelDeleteBtn.focus();
    });
  }

  function closeDeleteConfirm() {
    pendingDeleteId = null;
    els.confirmOverlay.classList.remove("open");
    els.confirmOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function confirmDelete() {
    if (!pendingDeleteId) {
      return;
    }

    const product = products.find(item => item.id === pendingDeleteId);

    products = products.filter(item => item.id !== pendingDeleteId);

    saveProducts();
    closeDeleteConfirm();
    renderAll();

    if (product) {
      showToast("Produto excluído: " + product.name);
    }
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2400);
  }

  [
    els.searchInput,
    els.categoryFilter,
    els.marginFilter,
    els.sortSelect
  ].forEach(control => {
    const eventName = control === els.searchInput ? "input" : "change";
    control.addEventListener(eventName, renderCatalog);
  });

  [
    els.newProductBtn,
    els.emptyAddBtn
  ].forEach(button => {
    button.addEventListener("click", openNewModal);
  });

  els.closeModalBtn.addEventListener("click", closeModal);
  els.cancelModalBtn.addEventListener("click", closeModal);
  els.productForm.addEventListener("submit", saveForm);

  [
    els.salePriceInput,
    els.targetMarginInput
  ].forEach(input => {
    input.addEventListener("input", updatePricingFeedback);
  });

  els.addCostItemBtn.addEventListener("click", () => {
    addCostItemRow();
    const rows = els.costItems.querySelectorAll(".cost-item-row");
    rows[rows.length - 1]?.querySelector(".cost-item-label")?.focus();
  });

  els.useSuggestionBtn.addEventListener("click", () => {
    const pricing = formPricing();

    if (pricing.totalCost <= 0) {
      els.formMessage.textContent = "Adicione primeiro os custos usados no produto.";
      const firstCostInput = els.costItems.querySelector(".cost-item-amount");
      firstCostInput?.focus();
      return;
    }

    els.salePriceInput.value = pricing.suggestedPrice.toFixed(2);
    els.formMessage.textContent = "";
    updatePricingFeedback();
  });

  els.productModal.addEventListener("mousedown", event => {
    if (event.target === els.productModal) {
      closeModal();
    }
  });

  els.cancelDeleteBtn.addEventListener("click", closeDeleteConfirm);
  els.confirmDeleteBtn.addEventListener("click", confirmDelete);

  els.confirmOverlay.addEventListener("mousedown", event => {
    if (event.target === els.confirmOverlay) {
      closeDeleteConfirm();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") {
      return;
    }

    if (els.productModal.classList.contains("open")) {
      closeModal();
    }

    if (els.confirmOverlay.classList.contains("open")) {
      closeDeleteConfirm();
    }
  });

  initTheme();
  renderAll();
})();
