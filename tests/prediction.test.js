"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { predictPrice } = require("../shared/price-prediction");

test("nao treinar previsao sem historico real suficiente", () => {
  const result = predictPrice([{ period: "2026-01", average_price: 100, sold_units: 8 }]);
  assert.equal(result.ready, false);
  assert.match(result.reason, /8 meses/);
});

test("modelo somente com pelo menos quatro precos e oito meses", () => {
  const rows = Array.from({ length: 8 }, (_, index) => ({
    period: "2025-" + String(index + 1).padStart(2, "0"),
    average_price: 100, sold_units: 50 - index
  }));
  const result = predictPrice(rows);
  assert.equal(result.ready, false);
});

test("ml-regression gera estimativa restrita a faixa observada", () => {
  const rows = Array.from({ length: 8 }, (_, index) => ({
    period: "2025-" + String(index + 1).padStart(2, "0"),
    average_price: 100 + index * 10, sold_units: 600 - (100 + index * 10) * 3
  }));
  const result = predictPrice(rows, { directCost: 40, variableRatePct: 10, fixedTotal: 1000, technicalPrice: 110 });
  assert.equal(result.ready, true);
  assert.ok(result.r2 > 0.95);
  assert.ok(result.recommendation.price >= 110);
  assert.ok(result.recommendation.price <= 170);
  assert.ok(result.recommendation.estimatedMonthlyUnits >= 0);
});

test("modelo nao recomenda precos quando minimo tecnico ultrapassa historico", () => {
  const rows = Array.from({ length: 8 }, (_, index) => ({
    period: "2025-" + String(index + 1).padStart(2, "0"),
    average_price: 100 + index * 10, sold_units: 600 - (100 + index * 10) * 3
  }));
  const result = predictPrice(rows, { technicalPrice: 200 });
  assert.equal(result.ready, false);
});
