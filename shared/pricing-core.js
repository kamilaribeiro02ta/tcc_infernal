(function (root, factory) {
  const pricing = factory();
  if (typeof module === "object" && module.exports) module.exports = pricing;
  if (root) root.ZUZPricingCore = pricing;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const number = value => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };
  const nonNegative = value => Math.max(0, number(value));
  const text = value => String(value ?? "").trim();
  const defaults = {
    segment: "", operationType: "producao", positioning: "mercado", targetCustomer: "",
    monthlyUnits: 100, taxesPct: 0, sellingFeesPct: 0, defaultMargin: 30,
    fixedCosts: [], competitors: []
  };

  function normalize(settings = {}) {
    const s = settings && typeof settings === "object" && !Array.isArray(settings) ? settings : {};
    return {
      ...defaults, ...s,
      segment: text(s.segment ?? defaults.segment),
      operationType: text(s.operationType ?? defaults.operationType),
      positioning: ["preco", "mercado", "diferenciacao"].includes(s.positioning) ? s.positioning : "mercado",
      targetCustomer: text(s.targetCustomer ?? ""),
      monthlyUnits: Math.max(1, Math.round(number(s.monthlyUnits ?? 100))),
      taxesPct: nonNegative(s.taxesPct),
      sellingFeesPct: nonNegative(s.sellingFeesPct),
      defaultMargin: Math.min(90, nonNegative(s.defaultMargin ?? 30)),
      fixedCosts: Array.isArray(s.fixedCosts) ? s.fixedCosts.slice(0, 100).map(item => ({
        label: text(item?.label) || "Custo fixo",
        value: nonNegative(item?.value)
      })).filter(item => item.value > 0) : [],
      competitors: Array.isArray(s.competitors) ? s.competitors.slice(0, 100).map(item => ({
        name: text(item?.name) || "Concorrente", price: nonNegative(item?.price),
        category: text(item?.category), productId: text(item?.productId),
        productName: text(item?.productName), source: text(item?.source)
      })).filter(item => item.price > 0) : []
    };
  }

  function fixedCostsTotal(settings) {
    return normalize(settings).fixedCosts.reduce((sum, item) => sum + item.value, 0);
  }
  const comparableKey = value => text(value).normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase();
  function quantile(prices, fraction) {
    if (!prices.length) return 0;
    const index = (prices.length - 1) * fraction;
    const low = Math.floor(index), high = Math.ceil(index);
    return prices[low] + (prices[high] - prices[low]) * (index - low);
  }

  // Preços de categorias distintas nunca fundamentam o teto de um produto.
  function marketStats(settings, context = {}) {
    const s = normalize(settings);
    const category = comparableKey(context.category);
    const productId = text(context.productId);
    const productName = comparableKey(context.productName);
    const comparable = s.competitors.filter(item => {
      if (productId && item.productId && item.productId === productId) return true;
      if (productName && item.productName && comparableKey(item.productName) === productName) return true;
      if (category) return !!item.category && comparableKey(item.category) === category;
      // Sem contexto de produto, só se pode apresentar um panorama geral.
      return !productId && !productName;
    });
    const prices = comparable.map(item => item.price).sort((a, b) => a - b);
    const count = prices.length;
    return {
      count, totalCount: s.competitors.length, comparable: !!(category || productId || productName),
      min: count ? prices[0] : 0, max: count ? prices[count - 1] : 0,
      average: count ? prices.reduce((sum, value) => sum + value, 0) / count : 0,
      median: quantile(prices, 0.5), q25: quantile(prices, 0.25), q75: quantile(prices, 0.75)
    };
  }

  function calculate(input = {}) {
    const settings = normalize(input.settings);
    const direct = nonNegative(input.unitDirectCost);
    const sale = nonNegative(input.salePrice);
    const targetMargin = Number(input.targetMargin ?? settings.defaultMargin);
    const units = Math.max(0, Math.round(number(input.units ?? 1)));
    const rate = settings.taxesPct + settings.sellingFeesPct;
    if (!Number.isFinite(targetMargin) || targetMargin < 0 || targetMargin > 90 ||
        rate >= 100 || rate + targetMargin >= 100) {
      throw new RangeError("A soma da margem desejada com os tributos e taxas deve ser menor que 100%.");
    }
    const fixedTotal = fixedCostsTotal(settings);
    const fixedAllocation = fixedTotal / settings.monthlyUnits;
    const baseCost = direct + fixedAllocation;
    const technicalPrice = baseCost / (1 - (rate + targetMargin) / 100);
    const market = marketStats(settings, {
      category: input.category, productId: input.productId, productName: input.productName
    });
    const warnings = [];
    let suggestedPrice = technicalPrice;
    let upperBound = null;
    let upperBoundReason = "Sem amostra suficiente de preços realmente comparáveis; não é possível estimar um limite superior.";
    let method = "custo_e_margem";

    if (market.count) {
      // Estratégia influencia a posição no mercado, nunca reduz o mínimo técnico.
      const marketTarget = settings.positioning === "preco" ? market.q25
        : settings.positioning === "diferenciacao" ? market.q75 : market.median;
      suggestedPrice = Math.max(technicalPrice, marketTarget);
      method = "custo_mais_mercado";
      if (market.count >= 3 && market.comparable) {
        if (market.q75 >= technicalPrice) {
          upperBound = market.q75;
          upperBoundReason = "Percentil 75 de " + market.count + " referências da mesma categoria ou produto; não é um preço máximo garantido.";
          suggestedPrice = Math.min(suggestedPrice, upperBound);
        } else {
          upperBoundReason = "Os preços comparáveis do percentil 75 estão abaixo do mínimo técnico. Reveja custos e posicionamento.";
          warnings.push("O mercado comparável indica preços inferiores ao mínimo técnico.");
        }
      } else {
        warnings.push("Referências insuficientes ou sem identificação do produto para validar um teto de mercado.");
      }
    } else {
      warnings.push("Recomendação baseada apenas em custos, tributos, taxas e margem desejada.");
    }

    const charges = sale * rate / 100;
    const contribution = sale - direct - charges;
    const unitProfit = contribution - fixedAllocation;
    const revenue = sale * units;
    const profit = contribution * units - fixedTotal;
    const breakEvenUnits = contribution > 0 ? Math.ceil(fixedTotal / contribution) : null;
    if (contribution <= 0 && fixedTotal > 0) warnings.push("O preço não gera contribuição positiva para cobrir os custos fixos.");

    return {
      settings, directCost: direct, fixedTotal, fixedAllocation, unitBaseCost: baseCost,
      variableRatePct: rate, technicalPrice, suggestedPrice,
      recommendationMethod: method, explanation: upperBoundReason, warnings, market,
      recommendedRange: {
        low: technicalPrice, high: upperBound, basis: upperBoundReason,
        confidence: upperBound === null ? "insuficiente" : "referencia_de_mercado"
      },
      salePrice: sale, targetMargin, units, contributionMargin: contribution,
      contributionMarginPct: sale > 0 ? contribution / sale * 100 : 0,
      unitProfit, netMarginPct: sale > 0 ? unitProfit / sale * 100 : 0,
      breakEvenUnits, investment: direct * units + fixedTotal, revenue,
      periodVariableCosts: direct * units + charges * units,
      periodFixedCosts: fixedTotal, periodCosts: direct * units + charges * units + fixedTotal,
      profit, profitScope: "periodo_com_custo_fixo_integral"
    };
  }
  return { calculate, normalize, marketStats, fixedCostsTotal };
});
