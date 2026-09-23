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
    categorySelect: document.getElementById("categorySelect"),
    customCategoryWrap: document.getElementById("customCategoryWrap"),
    customCategoryInput: document.getElementById("customCategoryInput"),

    productPhotoInput: document.getElementById("productPhotoInput"),
    photoUploadBtn: document.getElementById("photoUploadBtn"),
    photoPreview: document.getElementById("photoPreview"),
    removePhotoBtn: document.getElementById("removePhotoBtn"),

    grossPriceInput: document.getElementById("grossPriceInput"),
    grossPriceSummary: document.getElementById("grossPriceSummary"),
    costItems: document.getElementById("costItems"),
    addCostItemBtn: document.getElementById("addCostItemBtn"),

    salePriceInput: document.getElementById("salePriceInput"),
    targetMarginInput: document.getElementById("targetMarginInput"),
    unitsInput: document.getElementById("unitsInput"),
    dateInput: document.getElementById("dateInput"),

    feedbackCost: document.getElementById("feedbackCost"),
    feedbackMargin: document.getElementById("feedbackMargin"),
    feedbackSuggested: document.getElementById("feedbackSuggested"),
    pricingFeedback: document.getElementById("pricingFeedback"),
    pricingExplanation: document.getElementById("pricingExplanation"),
    useSuggestionBtn: document.getElementById("useSuggestionBtn"),

    simulationInvestment: document.getElementById("simulationInvestment"),
    simulationRevenue: document.getElementById("simulationRevenue"),
    simulationProfit: document.getElementById("simulationProfit"),
    simulationUnitProfit: document.getElementById("simulationUnitProfit"),
    simulationStatus: document.getElementById("simulationStatus"),

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
  let currentPhotoData = "";

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
      image: typeof product.image === "string" ? product.image : "",
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
      units: Math.max(1, Math.round(numberValue(product.units || 100))),
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
        baseCost: 0,
        additionalCosts: [
          { label: "Matéria-prima", value: 18.5 },
          { label: "Embalagem", value: 2.2 }
        ],
        targetMargin: 35,
        salePrice: 34.9,
        units: 100,
        date: dateFor(0, 12)
      },
      {
        id: randomId(),
        name: "Kit especial",
        category: "Kits",
        baseCost: 0,
        additionalCosts: [
          { label: "Produto", value: 29 },
          { label: "Embalagem", value: 3.5 }
        ],
        targetMargin: 38,
        salePrice: 54.9,
        units: 100,
        date: dateFor(0, 8)
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
      showToast("O navegador não conseguiu salvar todos os dados. Tente usar uma foto menor.");
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
    return numberValue(product.salePrice) * Math.max(1, numberValue(product.units));
  }

  function projectedResult(product) {
    return unitMarginValue(product) * Math.max(1, numberValue(product.units));
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
      products.map(product => product.category.trim()).filter(Boolean)
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
      ...new Set(products.map(product => product.category.trim()).filter(Boolean))
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

      const categoryMatch = !category || product.category === category;
      const marginMatch = !margin || marginClass(marginPct(product)) === margin;

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

  function productVisual(product) {
    if (product.image) {
      return '<img class="product-thumb" src="' + escapeHtml(product.image) + '" alt="">';
    }

    return '<span class="product-thumb product-thumb-placeholder"><i class="bx bx-package"></i></span>';
  }

  function productTableRow(product) {
    const cost = unitCost(product);
    const margin = marginPct(product);
    const result = projectedResult(product);

    return `
      <tr>
        <td class="product-cell">
          <div class="product-cell-inner">
            ${productVisual(product)}
            <div>
              <strong>${escapeHtml(product.name)}</strong>
              <span>${escapeHtml(product.category)} · ${formatDate(product.date)}</span>
            </div>
          </div>
        </td>

        <td><span class="category-pill">${escapeHtml(product.category)}</span></td>
        <td>${currency(cost)}</td>
        <td><strong style="color:var(--text-primary)">${currency(product.salePrice)}</strong></td>
        <td><span class="margin-pill ${marginClass(margin)}" title="${marginLabel(margin)}">${percent(margin)}</span></td>
        <td>${Math.round(numberValue(product.units))}</td>
        <td><span class="result-value ${result >= 0 ? "good" : "bad"}">${currency(result)}</span></td>

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
          <div class="product-cell-inner">
            ${productVisual(product)}
            <div>
              <strong>${escapeHtml(product.name)}</strong>
              <span>${escapeHtml(product.category)} · ${formatDate(product.date)}</span>
            </div>
          </div>

          <span class="margin-pill ${marginClass(margin)}">${percent(margin)}</span>
        </div>

        <div class="product-mobile-meta">
          <div>
            <span>Preço bruto</span>
            <strong>${currency(cost)}</strong>
          </div>

          <div>
            <span>Preço</span>
            <strong>${currency(product.salePrice)}</strong>
          </div>

          <div>
            <span>Qtd. estimada</span>
            <strong>${Math.round(numberValue(product.units))}</strong>
          </div>

          <div>
            <span>Lucro estimado</span>
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
      button.addEventListener("click", () => openEditModal(button.dataset.edit));
    });

    document.querySelectorAll("[data-delete]").forEach(button => {
      button.addEventListener("click", () => openDeleteConfirm(button.dataset.delete));
    });
  }

  function renderCatalog() {
    renderCategoryOptions();
    renderActiveFilters();

    const list = filteredProducts();

    els.viewCounter.textContent = list.length === 1 ? "1 produto" : list.length + " produtos";
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

    requestAnimationFrame(() => els.nameInput.focus());
  }

  function closeModal() {
    els.productModal.classList.remove("open");
    els.productModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    editingId = null;
  }

  function selectedCategory() {
    if (els.categorySelect.value === "__custom__") {
      return els.customCategoryInput.value.trim();
    }

    return els.categorySelect.value.trim();
  }

  function toggleCustomCategory() {
    const isCustom = els.categorySelect.value === "__custom__";
    els.customCategoryWrap.hidden = !isCustom;

    if (!isCustom) {
      els.customCategoryInput.value = "";
    }
  }

  function setCategoryFormValue(category) {
    const values = [...els.categorySelect.options].map(option => option.value);

    if (values.includes(category)) {
      els.categorySelect.value = category;
      els.customCategoryInput.value = "";
      els.customCategoryWrap.hidden = true;
      return;
    }

    els.categorySelect.value = "__custom__";
    els.customCategoryInput.value = category;
    els.customCategoryWrap.hidden = false;
  }

  function renderPhotoPreview() {
    els.photoPreview.innerHTML = "";

    if (currentPhotoData) {
      const img = document.createElement("img");
      img.src = currentPhotoData;
      img.alt = "Prévia do produto";
      els.photoPreview.appendChild(img);
      els.removePhotoBtn.hidden = false;
    } else {
      els.photoPreview.innerHTML = '<i class="bx bx-image-add"></i>';
      els.removePhotoBtn.hidden = true;
    }
  }

  function resizeImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("Escolha um arquivo de imagem."));
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();

        image.onload = () => {
          const maxSize = 520;
          const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
          const width = Math.max(1, Math.round(image.width * scale));
          const height = Math.max(1, Math.round(image.height * scale));

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", 0.78));
        };

        image.onerror = () => reject(new Error("Não foi possível ler a imagem."));
        image.src = reader.result;
      };

      reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
      reader.readAsDataURL(file);
    });
  }

  function updateRemoveCostButtons() {
    const rows = [...els.costItems.querySelectorAll(".cost-item-row")];
    const lockRemoval = rows.length <= 2;

    rows.forEach(row => {
      const button = row.querySelector(".remove-cost-item");
      button.disabled = lockRemoval;
      button.title = lockRemoval
        ? "É necessário manter pelo menos 2 custos"
        : "Remover custo";
    });
  }

  function addCostItemRow(label = "", value = "") {
    const row = document.createElement("div");
    row.className = "cost-item-row";

    row.innerHTML = `
      <div class="cost-item-name">
        <i class="bx bx-purchase-tag-alt"></i>
        <input type="text" class="cost-item-label" maxlength="45" placeholder="Ex: Embalagem">
      </div>

      <div class="cost-item-value money-input">
        <span>R$</span>
        <input type="number" class="cost-item-amount" min="0" step="0.01" inputmode="decimal" placeholder="0,00">
      </div>

      <button class="remove-cost-item" type="button" aria-label="Remover custo">
        <i class="bx bx-trash"></i>
      </button>
    `;

    row.querySelector(".cost-item-label").value = label;
    row.querySelector(".cost-item-amount").value = value === "" ? "" : String(value);

    row.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", updatePricingAndSimulation);
    });

    row.querySelector(".remove-cost-item").addEventListener("click", () => {
      const rows = els.costItems.querySelectorAll(".cost-item-row");

      if (rows.length <= 2) {
        els.formMessage.textContent = "Cadastre pelo menos 2 custos para formar o preço bruto.";
        return;
      }

      row.remove();
      els.formMessage.textContent = "";
      updateRemoveCostButtons();
      updatePricingAndSimulation();
    });

    els.costItems.appendChild(row);
    updateRemoveCostButtons();
    updatePricingAndSimulation();
  }

  function allCostItemsFromForm() {
    return [...els.costItems.querySelectorAll(".cost-item-row")].map(row => ({
      label: row.querySelector(".cost-item-label").value.trim(),
      value: Math.max(0, numberValue(row.querySelector(".cost-item-amount").value)),
      row
    }));
  }

  function validCostItemsFromForm() {
    return allCostItemsFromForm()
      .filter(item => item.label && item.value > 0)
      .map(({ label, value }) => ({ label, value }));
  }

  function formPricing() {
    const costItems = validCostItemsFromForm();
    const totalCost = costItems.reduce((sum, item) => sum + item.value, 0);
    const salePrice = Math.max(0, numberValue(els.salePriceInput.value));
    const targetMargin = Math.min(95, Math.max(0, numberValue(els.targetMarginInput.value)));
    const units = Math.max(1, Math.round(numberValue(els.unitsInput.value || 100)));

    const currentMargin = salePrice > 0
      ? ((salePrice - totalCost) / salePrice) * 100
      : 0;

    const suggestedPrice = totalCost > 0
      ? totalCost / (1 - targetMargin / 100)
      : 0;

    return {
      costItems,
      totalCost,
      salePrice,
      targetMargin,
      units,
      currentMargin,
      suggestedPrice,
      investment: totalCost * units,
      revenue: salePrice * units,
      unitProfit: salePrice - totalCost,
      profit: (salePrice - totalCost) * units
    };
  }

  function updatePricingAndSimulation() {
    const pricing = formPricing();

    els.feedbackCost.textContent = currency(pricing.totalCost);
    els.grossPriceSummary.textContent = currency(pricing.totalCost);
    els.grossPriceInput.value = pricing.totalCost.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    els.feedbackMargin.textContent = percent(pricing.currentMargin);
    els.feedbackSuggested.textContent = currency(pricing.suggestedPrice);

    els.simulationInvestment.textContent = currency(pricing.investment);
    els.simulationRevenue.textContent = currency(pricing.revenue);
    els.simulationProfit.textContent = currency(pricing.profit);
    els.simulationUnitProfit.textContent = currency(pricing.unitProfit);

    els.pricingFeedback.style.borderColor =
      pricing.salePrice > 0 && pricing.currentMargin < 0
        ? "var(--red)"
        : "var(--border)";

    els.pricingExplanation.className = "pricing-explanation";
    els.simulationStatus.className = "simulation-status";

    if (pricing.costItems.length < 2) {
      els.pricingExplanation.innerHTML =
        '<i class="bx bx-info-circle"></i><span>Cadastre pelo menos 2 custos para formar um preço bruto mais completo.</span>';
      els.simulationStatus.textContent =
        "Cadastre pelo menos 2 custos para liberar uma simulação mais confiável.";
      return;
    }

    if (pricing.salePrice <= 0) {
      els.pricingExplanation.innerHTML =
        '<i class="bx bx-bulb"></i><span>O preço bruto está pronto. Informe um preço de venda ou use a sugestão.</span>';
      els.simulationStatus.textContent =
        "O investimento já foi calculado. Falta informar o preço de venda para projetar o retorno.";
      return;
    }

    if (pricing.unitProfit < 0) {
      els.pricingExplanation.classList.add("bad");
      els.pricingExplanation.innerHTML =
        '<i class="bx bx-error-circle"></i><span>O preço de venda está abaixo do preço bruto.</span>';
      els.simulationStatus.classList.add("bad");
      els.simulationStatus.textContent =
        "Nesta simulação há prejuízo. Aumente o preço ou revise os custos.";
      return;
    }

    if (pricing.currentMargin + 0.01 < pricing.targetMargin) {
      els.pricingExplanation.classList.add("warn");
      els.pricingExplanation.innerHTML =
        '<i class="bx bx-info-circle"></i><span>A margem atual está abaixo da margem desejada.</span>';
      els.simulationStatus.classList.add("warn");
      els.simulationStatus.textContent =
        "Há lucro, mas a margem ainda está abaixo da meta definida.";
      return;
    }

    els.pricingExplanation.classList.add("good");
    els.pricingExplanation.innerHTML =
      '<i class="bx bx-check-circle"></i><span>O preço atual atende à margem desejada.</span>';
    els.simulationStatus.classList.add("good");
    els.simulationStatus.textContent =
      "A projeção está positiva e atende à margem definida.";
  }

  function resetForm() {
    els.productForm.reset();
    els.nameInput.value = "";
    els.categorySelect.value = "";
    els.customCategoryInput.value = "";
    els.customCategoryWrap.hidden = true;
    els.salePriceInput.value = "";
    els.targetMarginInput.value = "30";
    els.unitsInput.value = "100";
    els.dateInput.value = todayInputValue();
    els.costItems.innerHTML = "";
    els.formMessage.textContent = "";
    currentPhotoData = "";
    renderPhotoPreview();

    addCostItemRow();
    addCostItemRow();
    updatePricingAndSimulation();
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
    els.modalKicker.textContent = "Editar produto";
    els.modalTitle.textContent = product.name;

    els.nameInput.value = product.name;
    setCategoryFormValue(product.category);
    els.salePriceInput.value = String(numberValue(product.salePrice));
    els.unitsInput.value = String(Math.max(1, Math.round(numberValue(product.units || 100))));
    els.targetMarginInput.value = String(numberValue(product.targetMargin || 30));
    els.dateInput.value = product.date;
    els.costItems.innerHTML = "";
    els.formMessage.textContent = "";
    currentPhotoData = product.image || "";
    renderPhotoPreview();

    if (numberValue(product.baseCost) > 0) {
      addCostItemRow("Custo principal", numberValue(product.baseCost));
    }

    if (Array.isArray(product.additionalCosts)) {
      product.additionalCosts.forEach(item => {
        addCostItemRow(item.label || "Custo adicional", numberValue(item.value));
      });
    }

    while (els.costItems.querySelectorAll(".cost-item-row").length < 2) {
      addCostItemRow();
    }

    updatePricingAndSimulation();
    openModal();
  }

  function saveForm(event) {
    event.preventDefault();

    const name = els.nameInput.value.trim();
    const category = selectedCategory();
    const pricing = formPricing();
    const date = els.dateInput.value;
    const allCosts = allCostItemsFromForm();

    if (!name) {
      els.formMessage.textContent = "Informe o nome do produto.";
      els.nameInput.focus();
      return;
    }

    if (!category) {
      els.formMessage.textContent = "Escolha uma categoria.";
      (els.categorySelect.value === "__custom__"
        ? els.customCategoryInput
        : els.categorySelect).focus();
      return;
    }

    if (pricing.costItems.length < 2) {
      els.formMessage.textContent =
        "Cadastre pelo menos 2 custos, cada um com nome e valor maior que zero.";

      const incomplete = allCosts.find(item => !item.label || item.value <= 0);
      if (incomplete) {
        const input = !incomplete.label
          ? incomplete.row.querySelector(".cost-item-label")
          : incomplete.row.querySelector(".cost-item-amount");
        input?.focus();
      }
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
      image: currentPhotoData,
      baseCost: 0,
      additionalCosts: pricing.costItems,
      targetMargin: pricing.targetMargin,
      salePrice: pricing.salePrice,
      units: pricing.units,
      date
    });

    if (editingId) {
      products = products.map(product => product.id === editingId ? normalized : product);
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

    requestAnimationFrame(() => els.cancelDeleteBtn.focus());
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

  [els.newProductBtn, els.emptyAddBtn].forEach(button => {
    button.addEventListener("click", openNewModal);
  });

  els.categorySelect.addEventListener("change", () => {
    toggleCustomCategory();

    if (els.categorySelect.value === "__custom__") {
      requestAnimationFrame(() => els.customCategoryInput.focus());
    }
  });

  els.photoUploadBtn.addEventListener("click", () => els.productPhotoInput.click());

  els.productPhotoInput.addEventListener("change", async () => {
    const file = els.productPhotoInput.files?.[0];

    if (!file) {
      return;
    }

    try {
      currentPhotoData = await resizeImageFile(file);
      els.formMessage.textContent = "";
      renderPhotoPreview();
    } catch (error) {
      els.formMessage.textContent = error.message || "Não foi possível usar essa imagem.";
    } finally {
      els.productPhotoInput.value = "";
    }
  });

  els.removePhotoBtn.addEventListener("click", () => {
    currentPhotoData = "";
    renderPhotoPreview();
  });

  document.querySelectorAll("[data-cost-template]").forEach(button => {
    button.addEventListener("click", () => {
      addCostItemRow(button.dataset.costTemplate, "");
      const rows = els.costItems.querySelectorAll(".cost-item-row");
      rows[rows.length - 1]?.querySelector(".cost-item-amount")?.focus();
    });
  });

  els.addCostItemBtn.addEventListener("click", () => {
    addCostItemRow();
    const rows = els.costItems.querySelectorAll(".cost-item-row");
    rows[rows.length - 1]?.querySelector(".cost-item-label")?.focus();
  });

  [els.salePriceInput, els.targetMarginInput, els.unitsInput].forEach(input => {
    input.addEventListener("input", updatePricingAndSimulation);
  });

  els.useSuggestionBtn.addEventListener("click", () => {
    const pricing = formPricing();

    if (pricing.costItems.length < 2) {
      els.formMessage.textContent =
        "Cadastre pelo menos 2 custos antes de usar a sugestão de preço.";
      return;
    }

    els.salePriceInput.value = pricing.suggestedPrice.toFixed(2);
    els.formMessage.textContent = "";
    updatePricingAndSimulation();
    els.salePriceInput.focus();
  });

  els.closeModalBtn.addEventListener("click", closeModal);
  els.cancelModalBtn.addEventListener("click", closeModal);
  els.productForm.addEventListener("submit", saveForm);

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
