(() => {
  "use strict";

  function normalizePath(pathname) {
    let path = decodeURIComponent(pathname || "/");

    path = path.replace(/\\/g, "/");
    path = path.replace(/\/index\.html$/i, "/");
    path = path.replace(/\/+/g, "/");

    if (path.length > 1) {
      path = path.replace(/\/$/, "");
    }

    return path;
  }

  function syncActiveNavigation() {
    const current = normalizePath(window.location.pathname);
    const items = document.querySelectorAll(".nav-item[href]");

    items.forEach(item => {
      const target = normalizePath(new URL(item.getAttribute("href"), window.location.href).pathname);
      const isActive = target === current;

      item.classList.toggle("active", isActive);

      if (isActive) {
        item.setAttribute("aria-current", "page");
      } else {
        item.removeAttribute("aria-current");
      }
    });
  }

  function improveGlobalControls() {
    const themeToggle = document.getElementById("themeToggle");

    if (themeToggle && !themeToggle.hasAttribute("aria-label")) {
      themeToggle.setAttribute("aria-label", "Alternar entre modo claro e modo escuro");
    }

    document.querySelectorAll('a[target="_blank"]').forEach(link => {
      if (!link.rel.includes("noopener")) {
        link.rel = (link.rel + " noopener noreferrer").trim();
      }
    });
  }

  function syncThemeFromStorage() {
    const saved = localStorage.getItem("zuz-theme");

    if (saved !== "dark" && saved !== "light") {
      localStorage.setItem("zuz-theme", "light");
      document.body.classList.remove("dark");
      return;
    }

    document.body.classList.toggle("dark", saved === "dark");
  }

  document.addEventListener("DOMContentLoaded", () => {
    syncThemeFromStorage();
    syncActiveNavigation();
    improveGlobalControls();
  });

  window.addEventListener("storage", event => {
    if (event.key === "zuz-theme") {
      syncThemeFromStorage();
    }
  });
})();
