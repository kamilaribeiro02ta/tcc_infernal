(() => {
  "use strict";

  const STORAGE_KEY = "zuz-pricing-products-v2";
  const THEME_KEY = "zuz-theme";

  const monthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  const els = {
    themeToggle: document.getElementById("themeToggle"),
    themeLabel: document.getElementById("themeLabel"),
    iconSun: document.getElementById("iconSun"),
    iconMoon: document.getElementById("iconMoon"),

    monthFilter: document.getElementById("monthFilter"),
    statsGrid: document.getElementById("statsGrid"),
    chartBars: document.getElementById("chartBars"),
    chartTooltip: document.getElementById("chartTooltip"),
    insightList: document.getElementById("insightList"),

    searchProduct: document.getElementById("searchProduct"),
    categoryFilter: document.getElementById("categoryFilter"),
    productsBody: document.getElementById("productsBody"),
    productsEmpty: document.getElementById("productsEmpty"),

    newProductBtn: document.getElementById("newProductBtn"),
    newProductBtn2: document.getElementById("newProductBtn2"),
    manageProductsBtn: document.getElementById("manageProductsBtn"),

    modalProduct: document.getElementById("modalProduct"),
    modalManage: document.getElementById("modalManage"),
    productForm: document.getElementById("productForm"),
    productFormError: document.getElementById("productFormError"),

    productNameInput: document.getElementById("productNameInput"),
    productCategoryInput: document.getElementById("productCategoryInput"),
    baseCostInput: document.getElementById("baseCostInput"),
    targetMarginInput: document.getElementById("targetMarginInput"),
    salePriceInput: document.getElementById("salePriceInput"),
    unitsSoldInput: document.getElementById("unitsSoldInput"),
    productDateInput: document.getElementById("productDateInput"),

    addCostBtn: document.getElementById("addCostBtn"),
    additionalCosts: document.getElementById("additionalCosts"),
    useSuggestedPriceBtn: document.getElementById("useSuggestedPriceBtn"),
    suggestedPrice: document.getElementById("suggestedPrice"),

    previewProductName: document.getElementById("previewProductName"),
    previewSalePrice: document.getElementById("previewSalePrice"),
    previewTotalCost: document.getElementById("previewTotalCost"),
    previewUnitMargin: document.getElementById("previewUnitMargin"),
    previewMarginPct: document.getElementById("previewMarginPct"),
    previewRevenue: document.getElementById("previewRevenue"),
    previewStatus: document.getElementById("previewStatus"),

    manageList: document.getElementById("manageList"),
    toast: document.getElementById("toast")
  };

  let selectedMonth = new Date().getMonth();
  let products = loadProducts();

  function id() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
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

  function numberValue(value) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  function toDateInputValue(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function monthFromDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || "")) {
      return selectedMonth;
    }
    const month = Number(dateString.slice(5, 7)) - 1;
    return clamp(month, 0, 11);
  }

  function formatDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || "")) return "Sem data";
    const [year, month, day] = dateString.split("-").map(Number);
    return String(day).padStart(2, "0") + "/" + String(month).padStart(2, "0") + "/" + year;
  }

  function totalUnitCost(product) {
    const extras = Array.isArray(product.additionalCosts)
      ? product.additionalCosts.reduce((sum, item) => sum + numberValue(item.value), 0)
      : 0;
    return Math.max(0, numberValue(product.baseCost) + extras);
  }

  function productMarginValue(product) {
    return numberValue(product.salePrice) - totalUnitCost(product);
  }

  function productMarginPct(product) {
    const salePrice = numberValue(product.salePrice);
    if (salePrice <= 0) return 0;
    return (productMarginValue(product) / salePrice) * 100;
  }

  function productRevenue(product) {
    return numberValue(product.salePrice) * Math.max(0, numberValue(product.units));
  }

  function productCostTotal(product) {
    return totalUnitCost(product) * Math.max(0, numberValue(product.units));
  }

  function createDemoProducts() {
    const now = new Date();
    const current = now.getMonth();
    const year = now.getFullYear();

    const dateForOffset = (offset, day) => {
      const d = new Date(year, current - offset, day);
      return toDateInputValue(d);
    };

    return [
      {
        id: id(),
        name: "Produto principal",
        category: "Mais vendido",
        baseCost: 18.5,
        additionalCosts: [{ label: "Embalagem", value: 2.2 }],
        targetMargin: 35,
        salePrice: 34.9,
        units: 92,
        date: dateForOffset(0, 12)
      },
      {
        id: id(),
        name: "Kit especial",
        category: "Kits",
        baseCost: 29,
        additionalCosts: [{ label: "Embalagem", value: 3.5 }],
        targetMargin: 38,
        salePrice: 54.9,
        units: 38,
        date: dateForOffset(0, 8)
      },
      {
        id: id(),
        name: "Produto premium",
        category: "Premium",
        baseCost: 42,
        additionalCosts: [{ label: "Taxa", value: 4 }],
        targetMargin: 40,
        salePrice: 79.9,
        units: 25,
        date: dateForOffset(1, 18)
      },
      {
        id: id(),
        name: "Produto básico",
        category: "Linha básica",
        baseCost: 11,
        additionalCosts: [{ label: "Embalagem", value: 1.5 }],
        targetMargin: 32,
        salePrice: 21.9,
        units: 74,
        date: dateForOffset(1, 7)
      },
      {
        id: id(),
        name: "Combo mensal",
        category: "Combos",
        baseCost: 36,
        additionalCosts: [{ label: "Entrega", value: 5 }],
        targetMargin: 35,
        salePrice: 67.9,
        units: 31,
        date: dateForOffset(2, 20)
      },
      {
        id: id(),
        name: "Edição anterior",
        category: "Sazonal",
        baseCost: 23,
        additionalCosts: [],
        targetMargin: 30,
        salePrice: 39.9,
        units: 41,
        date: dateForOffset(3, 15)
      }
    ];
  }

  function normalizeProduct(product) {
    return {
      id: String(product.id || id()),
      name: String(product.name || "Produto"),
      category: String(product.category || "Sem categoria"),
      baseCost: Math.max(0, numberValue(product.baseCost)),
      additionalCosts: Array.isArray(product.additionalCosts)
        ? product.additionalCosts
            .map(item => ({
              label: String(item.label || "Custo adicional"),
              value: Math.max(0, numberValue(item.value))
            }))
            .filter(item => item.value > 0 || item.label.trim())
        : [],
      targetMargin: clamp(numberValue(product.targetMargin || 30), 0, 95),
      salePrice: Math.max(0, numberValue(product.salePrice)),
      units: Math.max(0, Math.round(numberValue(product.units))),
      date: /^\d{4}-\d{2}-\d{2}$/.test(product.date || "")
        ? product.date
        : toDateInputValue(new Date())
    };
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
      showToast("Os dados foram atualizados, mas não puderam ser salvos no navegador.");
    }
  }

  function monthMetrics(monthIndex) {
    const monthProducts = products.filter(product => monthFromDate(product.date) === monthIndex);

    const revenue = monthProducts.reduce((sum, product) => sum + productRevenue(product), 0);
    const costs = monthProducts.reduce((sum, product) => sum + productCostTotal(product), 0);
    const margin = revenue - costs;
    const units = monthProducts.reduce((sum, product) => sum + Math.max(0, numberValue(product.units)), 0);
    const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;

    return {
      products: monthProducts,
      revenue,
      costs,
      margin,
      units,
      marginPct
    };
  }

  function changePercent(current, previous) {
    if (!Number.isFinite(previous) || previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  function initTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    const isDark = stored === "dark";
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

  function initMonthFilter() {
    els.monthFilter.innerHTML = monthNames
      .map((name, index) => `<option value="${index}">${name}</option>`)
      .join("");

    els.monthFilter.value = String(selectedMonth);

    els.monthFilter.addEventListener("change", () => {
      selectedMonth = clamp(Number(els.monthFilter.value), 0, 11);
      renderAll();
    });
  }

  function statCard(label, value, icon, helper) {
    return `
      <article class="stat-card">
        <div class="stat-top">
          <span class="stat-label">${escapeHtml(label)}</span>
          <span class="stat-icon"><i class="bx ${icon}"></i></span>
        </div>
        <div class="stat-value">${escapeHtml(value)}</div>
        <div class="stat-foot">${helper}</div>
      </article>
    `;
  }

  function comparisonText(current, previous, positiveIsGood = true) {
    const change = changePercent(current, previous);
    if (change === null || !Number.isFinite(change)) {
      return "Sem base suficiente para comparar com o mês anterior.";
    }

    const positive = change >= 0;
    const good = positiveIsGood ? positive : !positive;
    const sign = positive ? "+" : "";

    return `<strong style="color:var(${good ? "--green" : "--red"})">${sign}${percent(change)}</strong> em relação ao mês anterior.`;
  }

  function renderStats() {
    const current = monthMetrics(selectedMonth);
    const previous = selectedMonth > 0 ? monthMetrics(selectedMonth - 1) : null;

    els.statsGrid.innerHTML =
      statCard(
        "Faturamento",
        currency(current.revenue),
        "bx-wallet",
        previous ? comparisonText(current.revenue, previous.revenue, true) : "Primeiro mês do período."
      ) +
      statCard(
        "Custos",
        currency(current.costs),
        "bx-receipt",
        previous ? comparisonText(current.costs, previous.costs, false) : "Soma dos custos dos produtos vendidos."
      ) +
      statCard(
        "Margem estimada",
        percent(current.marginPct),
        "bx-line-chart",
        current.revenue > 0
          ? `Resultado estimado de <strong>${currency(current.margin)}</strong>.`
          : "Cadastre vendas para calcular a margem."
      ) +
      statCard(
        "Unidades vendidas",
        String(current.units),
        "bx-package",
        `<strong>${current.products.length}</strong> cadastro(s) neste mês.`
      );
  }

  function renderChart() {
    const metrics = monthNames.map((_, index) => monthMetrics(index));
    const maxValue = Math.max(
      1,
      ...metrics.flatMap(metric => [metric.revenue, metric.costs])
    );

    els.chartBars.innerHTML = "";

    metrics.forEach((metric, index) => {
      const column = document.createElement("div");
      column.className = "month-col" + (index === selectedMonth ? " selected" : "");
      column.setAttribute("role", "button");
      column.setAttribute("tabindex", "0");
      column.setAttribute("aria-label", monthNames[index] + ": faturamento " + currency(metric.revenue) + ", custos " + currency(metric.costs));

      const pair = document.createElement("div");
      pair.className = "bars-pair";

      const revenueBar = createBar(
        "revenue",
        metric.revenue,
        maxValue,
        "Faturamento",
        monthNames[index]
      );

      const costBar = createBar(
        "cost",
        metric.costs,
        maxValue,
        "Custos",
        monthNames[index]
      );

      const label = document.createElement("span");
      label.className = "month-label";
      label.textContent = monthNames[index];

      pair.append(revenueBar, costBar);
      column.append(pair, label);

      const selectMonth = () => {
        selectedMonth = index;
        els.monthFilter.value = String(index);
        renderAll();
      };

      column.addEventListener("click", selectMonth);
      column.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectMonth();
        }
      });

      els.chartBars.appendChild(column);
    });
  }

  function createBar(className, value, maxValue, label, month) {
    const bar = document.createElement("div");
    bar.className = "bar " + className;
    bar.style.height = Math.max(4, (value / maxValue) * 100) + "%";
    bar.setAttribute("tabindex", "-1");

    const show = event => {
      const wrapRect = els.chartBars.parentElement.getBoundingClientRect();
      const barRect = bar.getBoundingClientRect();

      els.chartTooltip.textContent = label + " · " + month + ": " + currency(value);
      els.chartTooltip.style.left = (barRect.left - wrapRect.left + barRect.width / 2) + "px";
      els.chartTooltip.style.top = (barRect.top - wrapRect.top) + "px";
      els.chartTooltip.classList.add("show");
    };

    bar.addEventListener("mouseenter", show);
    bar.addEventListener("focus", show);
    bar.addEventListener("mouseleave", hideTooltip);
    bar.addEventListener("blur", hideTooltip);

    return bar;
  }

  function hideTooltip() {
    els.chartTooltip.classList.remove("show");
  }

  function renderInsights() {
    const metrics = monthMetrics(selectedMonth);
    const monthProducts = metrics.products;

    const averageSalePrice = metrics.units > 0
      ? metrics.revenue / metrics.units
      : 0;

    const bestProduct = monthProducts
      .filter(product => numberValue(product.salePrice) > 0)
      .sort((a, b) => productMarginPct(b) - productMarginPct(a))[0];

    const averageMargin = monthProducts.length
      ? monthProducts.reduce((sum, product) => sum + productMarginPct(product), 0) / monthProducts.length
      : 0;

    els.insightList.innerHTML = `
      <div class="insight-item">
        <span>Preço médio de venda</span>
        <strong>${currency(averageSalePrice)}</strong>
        <small>Valor médio por unidade vendida no mês.</small>
      </div>

      <div class="insight-item">
        <span>Margem média</span>
        <strong>${percent(averageMargin)}</strong>
        <small>Média das margens dos produtos cadastrados no mês.</small>
      </div>

      <div class="insight-item">
        <span>Melhor margem</span>
        <strong>${bestProduct ? escapeHtml(bestProduct.name) : "Sem dados"}</strong>
        <small>${bestProduct ? percent(productMarginPct(bestProduct)) + " de margem sobre a venda." : "Cadastre produtos para comparar."}</small>
      </div>
    `;
  }

  function refreshCategoryFilter() {
    const current = els.categoryFilter.value;
    const categories = [...new Set(products.map(product => product.category.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));

    els.categoryFilter.innerHTML =
      '<option value="">Todas as categorias</option>' +
      categories
        .map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
        .join("");

    if (categories.includes(current)) {
      els.categoryFilter.value = current;
    }
  }

  function marginClass(marginPct) {
    if (marginPct < 0) return "bad";
    if (marginPct < 20) return "warn";
    return "good";
  }

  function renderProducts() {
    refreshCategoryFilter();

    const query = els.searchProduct.value.trim().toLocaleLowerCase("pt-BR");
    const category = els.categoryFilter.value;

    const filtered = products
      .slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .filter(product => {
        const matchesQuery =
          !query ||
          product.name.toLocaleLowerCase("pt-BR").includes(query) ||
          product.category.toLocaleLowerCase("pt-BR").includes(query);

        const matchesCategory = !category || product.category === category;
        return matchesQuery && matchesCategory;
      });

    els.productsEmpty.hidden = filtered.length > 0;
    els.productsBody.innerHTML = filtered.map(product => {
      const cost = totalUnitCost(product);
      const marginPct = productMarginPct(product);

      return `
        <tr>
          <td class="product-name-cell">
            <strong>${escapeHtml(product.name)}</strong>
            <span>${formatDate(product.date)}</span>
          </td>
          <td><span class="category-tag">${escapeHtml(product.category)}</span></td>
          <td>${currency(cost)}</td>
          <td><strong style="color:var(--text-primary)">${currency(product.salePrice)}</strong></td>
          <td><span class="margin-tag ${marginClass(marginPct)}">${percent(marginPct)}</span></td>
          <td>${Math.round(numberValue(product.units))}</td>
          <td>
            <div class="row-actions">
              <button class="icon-btn danger" type="button" data-delete-product="${product.id}" aria-label="Excluir ${escapeHtml(product.name)}" title="Excluir produto">
                <i class="bx bx-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    els.productsBody.querySelectorAll("[data-delete-product]").forEach(button => {
      button.addEventListener("click", () => {
        removeProduct(button.dataset.deleteProduct);
      });
    });
  }

  function addCostRow(label = "", value = "") {
    const row = document.createElement("div");
    row.className = "cost-row";

    row.innerHTML = `
      <input type="text" class="cost-label" maxlength="40" placeholder="Ex: Embalagem" aria-label="Nome do custo adicional">
      <input type="number" class="cost-value" min="0" step="0.01" inputmode="decimal" placeholder="0,00" aria-label="Valor do custo adicional">
      <button class="remove-cost" type="button" aria-label="Remover custo adicional"><i class="bx bx-trash"></i></button>
    `;

    row.querySelector(".cost-label").value = label;
    row.querySelector(".cost-value").value = value;

    row.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", updatePricingPreview);
    });

    row.querySelector(".remove-cost").addEventListener("click", () => {
      row.remove();
      updatePricingPreview();
    });

    els.additionalCosts.appendChild(row);
    updatePricingPreview();
  }

  function additionalCostsFromForm() {
    return [...els.additionalCosts.querySelectorAll(".cost-row")]
      .map(row => ({
        label: row.querySelector(".cost-label").value.trim() || "Custo adicional",
        value: Math.max(0, numberValue(row.querySelector(".cost-value").value))
      }))
      .filter(item => item.value > 0);
  }

  function pricingFromForm() {
    const baseCost = Math.max(0, numberValue(els.baseCostInput.value));
    const extras = additionalCostsFromForm();
    const totalCost = baseCost + extras.reduce((sum, item) => sum + item.value, 0);
    const targetMargin = clamp(numberValue(els.targetMarginInput.value), 0, 95);
    const salePrice = Math.max(0, numberValue(els.salePriceInput.value));
    const units = Math.max(0, Math.round(numberValue(els.unitsSoldInput.value)));

    const suggestedPrice = targetMargin >= 100
      ? 0
      : totalCost / (1 - targetMargin / 100);

    const unitMargin = salePrice - totalCost;
    const marginPct = salePrice > 0 ? (unitMargin / salePrice) * 100 : 0;
    const revenue = salePrice * units;

    return {
      baseCost,
      extras,
      totalCost,
      targetMargin,
      salePrice,
      units,
      suggestedPrice,
      unitMargin,
      marginPct,
      revenue
    };
  }

  function updatePricingPreview() {
    const pricing = pricingFromForm();
    const name = els.productNameInput.value.trim();

    els.previewProductName.textContent = name || "Novo produto";
    els.previewSalePrice.textContent = currency(pricing.salePrice);
    els.previewTotalCost.textContent = currency(pricing.totalCost);
    els.previewUnitMargin.textContent = currency(pricing.unitMargin);
    els.previewMarginPct.textContent = percent(pricing.marginPct);
    els.previewRevenue.textContent = currency(pricing.revenue);
    els.suggestedPrice.textContent = currency(pricing.suggestedPrice);

    els.previewStatus.className = "preview-status";

    if (pricing.totalCost <= 0 || pricing.salePrice <= 0) {
      els.previewStatus.textContent = "Informe os custos e o preço para analisar a margem.";
      return;
    }

    if (pricing.unitMargin < 0) {
      els.previewStatus.classList.add("bad");
      els.previewStatus.textContent = "O preço está abaixo do custo total. Revise a precificação.";
      return;
    }

    if (pricing.marginPct + 0.01 < pricing.targetMargin) {
      els.previewStatus.classList.add("warn");
      els.previewStatus.textContent = "A margem atual está abaixo da margem desejada.";
      return;
    }

    els.previewStatus.classList.add("good");
    els.previewStatus.textContent = "A margem atual atende à meta definida.";
  }

  function resetProductForm() {
    els.productForm.reset();
    els.productNameInput.value = "";
    els.productCategoryInput.value = "";
    els.baseCostInput.value = "";
    els.targetMarginInput.value = "30";
    els.salePriceInput.value = "";
    els.unitsSoldInput.value = "1";
    els.productDateInput.value = toDateInputValue(new Date());
    els.additionalCosts.innerHTML = "";
    els.productFormError.textContent = "";
    updatePricingPreview();
  }

  function openModal(modal) {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      const firstInput = modal.querySelector("input, select, button");
      firstInput?.focus();
    });
  }

  function closeModal(modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");

    if (!document.querySelector(".modal-overlay.open")) {
      document.body.style.overflow = "";
    }
  }

  function openProductModal() {
    resetProductForm();
    openModal(els.modalProduct);
    requestAnimationFrame(() => els.productNameInput.focus());
  }

  function renderManageList() {
    if (!products.length) {
      els.manageList.innerHTML = `
        <div class="empty-state">
          <i class="bx bx-package"></i>
          <strong>Nenhum produto cadastrado</strong>
          <span>Cadastre um produto para começar.</span>
        </div>
      `;
      return;
    }

    els.manageList.innerHTML = products
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .map(product => `
        <div class="manage-row">
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            <span>${escapeHtml(product.category)} · ${currency(product.salePrice)} · margem ${percent(productMarginPct(product))}</span>
          </div>
          <button class="icon-btn danger" type="button" data-manage-delete="${product.id}" aria-label="Excluir ${escapeHtml(product.name)}">
            <i class="bx bx-trash"></i>
          </button>
        </div>
      `)
      .join("");

    els.manageList.querySelectorAll("[data-manage-delete]").forEach(button => {
      button.addEventListener("click", () => {
        removeProduct(button.dataset.manageDelete);
        renderManageList();
      });
    });
  }

  function removeProduct(productId) {
    const product = products.find(item => item.id === productId);
    if (!product) return;

    products = products.filter(item => item.id !== productId);
    saveProducts();
    renderAll();
    showToast("Produto removido: " + product.name);
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2600);
  }

  function renderAll() {
    renderStats();
    renderChart();
    renderInsights();
    renderProducts();
  }

  els.searchProduct.addEventListener("input", renderProducts);
  els.categoryFilter.addEventListener("change", renderProducts);

  [els.newProductBtn, els.newProductBtn2].forEach(button => {
    button.addEventListener("click", openProductModal);
  });

  els.manageProductsBtn.addEventListener("click", () => {
    renderManageList();
    openModal(els.modalManage);
  });

  els.addCostBtn.addEventListener("click", () => {
    addCostRow("", "");
    const rows = els.additionalCosts.querySelectorAll(".cost-row");
    rows[rows.length - 1]?.querySelector(".cost-label")?.focus();
  });

  els.useSuggestedPriceBtn.addEventListener("click", () => {
    const pricing = pricingFromForm();

    if (pricing.totalCost <= 0) {
      els.productFormError.textContent = "Informe primeiro o custo do produto.";
      els.baseCostInput.focus();
      return;
    }

    els.salePriceInput.value = pricing.suggestedPrice.toFixed(2);
    els.productFormError.textContent = "";
    updatePricingPreview();
    els.salePriceInput.focus();
  });

  [
    els.productNameInput,
    els.productCategoryInput,
    els.baseCostInput,
    els.targetMarginInput,
    els.salePriceInput,
    els.unitsSoldInput
  ].forEach(input => {
    input.addEventListener("input", updatePricingPreview);
  });

  els.productForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = els.productNameInput.value.trim();
    const category = els.productCategoryInput.value.trim() || "Sem categoria";
    const pricing = pricingFromForm();
    const date = els.productDateInput.value;

    if (!name) {
      els.productFormError.textContent = "Informe o nome do produto.";
      els.productNameInput.focus();
      return;
    }

    if (pricing.totalCost <= 0) {
      els.productFormError.textContent = "Informe um custo total maior que zero.";
      els.baseCostInput.focus();
      return;
    }

    if (pricing.salePrice <= 0) {
      els.productFormError.textContent = "Informe um preço de venda maior que zero.";
      els.salePriceInput.focus();
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      els.productFormError.textContent = "Informe uma data válida.";
      els.productDateInput.focus();
      return;
    }

    products.push(normalizeProduct({
      id: id(),
      name,
      category,
      baseCost: pricing.baseCost,
      additionalCosts: pricing.extras,
      targetMargin: pricing.targetMargin,
      salePrice: pricing.salePrice,
      units: pricing.units,
      date
    }));

    selectedMonth = monthFromDate(date);
    els.monthFilter.value = String(selectedMonth);

    saveProducts();
    closeModal(els.modalProduct);
    renderAll();
    showToast("Produto cadastrado com sucesso.");
  });

  document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
      const overlay = button.closest(".modal-overlay");
      if (overlay) closeModal(overlay);
    });
  });

  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("mousedown", event => {
      if (event.target === overlay) {
        closeModal(overlay);
      }
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      document.querySelectorAll(".modal-overlay.open").forEach(closeModal);
    }
  });

  initTheme();
  initMonthFilter();
  renderAll();
})();
