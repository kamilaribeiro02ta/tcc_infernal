(() => {
  "use strict";
  const KEY = "zuz-business-settings-v1";
  const core = window.ZUZPricingCore;
  if (!core) throw new Error("Carregue pricing-core.js antes de pricing-engine.js.");
  let queue = Promise.resolve();

  function loadSettings() {
    try { return core.normalize(JSON.parse(localStorage.getItem(KEY) || "{}")); }
    catch { return core.normalize(); }
  }
  // O banco é a fonte de verdade; somente confirmar/sinalizar sucesso após o PUT.
  function saveSettings(settings) {
    const normalized = core.normalize(settings);
    const save = async () => {
      if (!window.ZUZAPI) throw new Error("Conecte-se ao servidor da ZUZ para salvar as configurações.");
      const result = await window.ZUZAPI.request("PUT", "/company/settings", { settings: normalized });
      const confirmed = core.normalize(result.settings);
      localStorage.setItem(KEY, JSON.stringify(confirmed));
      window.dispatchEvent(new CustomEvent("zuz:business-settings", { detail: confirmed }));
      return confirmed;
    };
    const pending = queue.catch(() => {}).then(save);
    queue = pending;
    return pending.catch(error => {
      window.dispatchEvent(new CustomEvent("zuz:sync-error", { detail: error.message }));
      throw error;
    });
  }
  window.ZUZPricing = {
    SETTINGS_KEY: KEY, loadSettings, saveSettings,
    calculate: input => core.calculate({ ...input, settings: input?.settings || loadSettings() }),
    marketStats: context => core.marketStats(loadSettings(), context),
    fixedCostsTotal: () => core.fixedCostsTotal(loadSettings()),
    history: (productId, limit = 30) => window.ZUZAPI.request("GET",
      "/pricing/history?limit=" + Math.max(1, Math.min(100, Math.round(limit))) +
      (productId ? "&productId=" + encodeURIComponent(productId) : ""))
  };
})();
