(() => {
  "use strict";

  const SESSION_KEY = "zuz-session";
  const PROFILE_KEY = "zuz-profile";

  const scriptUrl = document.currentScript?.src
    ? new URL(document.currentScript.src, window.location.href)
    : null;

  const projectRoot = scriptUrl
    ? new URL("../", scriptUrl)
    : new URL("../", window.location.href);

  function projectUrl(relativePath) {
    return new URL(relativePath, projectRoot).href;
  }

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

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  }

  function getProfile() {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY));
    } catch {
      return null;
    }
  }

  function syncActiveNavigation() {
    const current = normalizePath(window.location.pathname);
    const items = document.querySelectorAll(".nav-item[href]");

    items.forEach(item => {
      const target = normalizePath(
        new URL(item.getAttribute("href"), window.location.href).pathname
      );

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
      themeToggle.setAttribute(
        "aria-label",
        "Alternar entre modo claro e modo escuro"
      );
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

  function syncAuthenticationState() {
    const session = getSession();
    const profile = getProfile();
    const loggedIn = Boolean(session?.email);

    document.querySelectorAll(".login-block").forEach(block => {
      const title = block.querySelector(".login-title");
      const subtitle = block.querySelector(".login-subtitle");
      const nestedLink = block.querySelector("a[href]");

      const destination = loggedIn
        ? projectUrl("perfil/perfil.html")
        : projectUrl("Login-2/login-2.html");

      if (block.tagName === "A") {
        block.href = destination;
      }

      if (nestedLink) {
        nestedLink.href = destination;
      }

      if (loggedIn) {
        if (title) {
          title.textContent =
            String(profile?.name || "Minha Conta").trim().split(/\s+/)[0];
        }

        if (subtitle) {
          subtitle.textContent = "Meu perfil";
        }
      } else if (!block.classList.contains("profile-account-link")) {
        if (title) {
          title.textContent = "Login";
        }

        if (subtitle) {
          subtitle.textContent = "Minha Conta";
        }
      }
    });
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

    if (event.key === SESSION_KEY || event.key === PROFILE_KEY) {
      syncAuthenticationState();
    }
  });
})();
