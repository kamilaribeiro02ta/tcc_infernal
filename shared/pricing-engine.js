(() => {
  "use strict";
  const KEY="zuz-business-settings-v1";
  const core=window.ZUZPricingCore;
  if (!core) throw new Error("Carregue pricing-core.js antes de pricing-engine.js.");
  function loadSettings() {
    try { return core.normalize(JSON.parse(localStorage.getItem(KEY)||"{}")); }
    catch { return core.normalize(); }
  }
  function saveSettings(settings) {
    const normalized=core.normalize(settings);
    localStorage.setItem(KEY,JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent("zuz:business-settings",{detail:normalized}));
    // A sincronização remota só ocorre para empresas autenticadas.
    if (window.ZUZAPI) window.ZUZAPI.request("PUT","/company/settings",{settings:normalized})
      .catch(error=>window.dispatchEvent(new CustomEvent("zuz:sync-error",{detail:error.message})));
    return normalized;
  }
  window.ZUZPricing={
    SETTINGS_KEY:KEY,loadSettings,saveSettings,
    calculate:input=>core.calculate({...input,settings:input?.settings||loadSettings()}),
    marketStats:()=>core.marketStats(loadSettings()),
    fixedCostsTotal:()=>core.fixedCostsTotal(loadSettings())
  };
})();
