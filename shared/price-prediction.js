"use strict";

const { SLR } = require("ml-regression");

// Observacoes representam vendas reais por mes, nunca quantidades simuladas.
function predictPrice(observations, { directCost = 0, variableRatePct = 0, fixedTotal = 0, technicalPrice = 0 } = {}) {
  const observationsValid = Array.isArray(observations) ? observations.filter(row =>
    Number.isFinite(Number(row.average_price)) && Number(row.average_price) > 0 &&
    Number.isInteger(Number(row.sold_units)) && Number(row.sold_units) >= 0 &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(String(row.period || ""))
  ) : [];
  const periods = new Set(observationsValid.map(row => row.period));
  const prices = observationsValid.map(row => Number(row.average_price));
  const units = observationsValid.map(row => Number(row.sold_units));
  const uniquePrices = new Set(prices.map(price => price.toFixed(2))).size;
  const unavailable = reason => ({ ready: false, reason, samples: observationsValid.length });

  if (observationsValid.length < 8 || periods.size < 8 || uniquePrices < 4)
    return unavailable("São necessários pelo menos 8 meses com vendas reais e 4 preços diferentes.");
  if (new Set(units).size < 2)
    return unavailable("As quantidades vendidas não variaram; não há evidência para estimar a demanda.");
  const model = new SLR(prices, units);
  const meanUnits = units.reduce((sum, value) => sum + value, 0) / units.length;
  const sumSquares = units.reduce((sum, value) => sum + (value - meanUnits) ** 2, 0);
  const residual = units.reduce((sum, value, index) => sum + (value - model.predict(prices[index])) ** 2, 0);
  const r2 = sumSquares > 0 ? 1 - residual / sumSquares : NaN;
  if (!Number.isFinite(model.slope) || model.slope >= 0 || !Number.isFinite(r2) || r2 < 0.5)
    return unavailable("Os dados ainda não sustentam uma relação negativa suficientemente consistente entre preço e demanda.");

  const minPrice = Math.min(...prices), maxPrice = Math.max(...prices);
  const floor = Math.max(minPrice, Number(technicalPrice) || 0);
  if (floor > maxPrice)
    return unavailable("O mínimo técnico supera todos os preços observados; não é seguro extrapolar.");
  let best = null;
  for (let index = 0; index <= 100; index++) {
    const price = floor + (maxPrice - floor) * index / 100;
    const predictedUnits = Math.max(0, model.predict(price));
    const contribution = price * (1 - Number(variableRatePct) / 100) - Number(directCost);
    const periodProfit = predictedUnits * contribution - Number(fixedTotal);
    if (!best || periodProfit > best.projectedProfit)
      best = { price, estimatedMonthlyUnits: predictedUnits, projectedProfit: periodProfit };
  }
  return {
    ready: true, status: "experimental", samples: observationsValid.length,
    r2, slope: model.slope, observedRange: { min: minPrice, max: maxPrice },
    recommendation: best,
    disclaimer: "Estimativa estatística exploratória baseada em vendas observadas. Correlação não prova causalidade; não extrapola a faixa amostrada."
  };
}

module.exports = { predictPrice };
