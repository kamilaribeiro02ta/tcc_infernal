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
    document.querySelectorAll(".nav-menu").forEach(nav => {
      if (!nav.hasAttribute("aria-label")) {
        nav.setAttribute("aria-label", "Navegação principal");
      }
    });

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

  async function syncAuthenticationState() {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "same-origin"
      });

      const data = await response.json();

      document.querySelectorAll(".login-block").forEach(block => {
        const title = block.querySelector(".login-title");
        const subtitle = block.querySelector(".login-subtitle");

        if (response.ok && data.authenticated) {
          block.setAttribute("href", "/perfil/perfil.html");

          if (title) {
            title.textContent = data.user.name.split(/\s+/)[0] || "Minha Conta";
          }

          if (subtitle) {
            subtitle.textContent = "Meu perfil";
          }
        } else if (!block.classList.contains("profile-account-link")) {
          block.setAttribute("href", "/Login-2/login-2.html");

          if (title) {
            title.textContent = "Login";
          }

          if (subtitle) {
            subtitle.textContent = "Minha Conta";
          }
        }
      });
    } catch (_) {
      // O site continua utilizável mesmo se o backend estiver offline.
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    syncThemeFromStorage();
    syncActiveNavigation();
    improveGlobalControls();
    syncAuthenticationState();
  });

  window.addEventListener("storage", event => {
    if (event.key === "zuz-theme") {
      syncThemeFromStorage();
    }
  });
})();
