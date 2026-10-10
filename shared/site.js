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

  function renderThemeControls(isDark) {
    const themeToggle = document.getElementById("themeToggle");
    const themeLabel = document.getElementById("themeLabel");
    const iconSun = document.getElementById("iconSun");
    const iconMoon = document.getElementById("iconMoon");

    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    document.body.classList.toggle("dark", isDark);

    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(isDark));
      themeToggle.setAttribute(
        "aria-label",
        isDark ? "Ativar modo claro" : "Ativar modo escuro"
      );
    }

    if (themeLabel) {
      themeLabel.textContent = isDark ? "Modo Escuro" : "Modo Claro";
    }

    if (iconSun) {
      iconSun.style.display = isDark ? "none" : "block";
    }

    if (iconMoon) {
      iconMoon.style.display = isDark ? "block" : "none";
    }

    window.dispatchEvent(
      new CustomEvent("zuz:themechange", {
        detail: { theme: isDark ? "dark" : "light" }
      })
    );
  }

  function syncThemeFromStorage() {
    let saved = localStorage.getItem("zuz-theme");

    if (saved !== "dark" && saved !== "light") {
      saved = "light";
      localStorage.setItem("zuz-theme", saved);
    }

    renderThemeControls(saved === "dark");
  }

  function bindThemeToggle() {
    const themeToggle = document.getElementById("themeToggle");

    if (!themeToggle || themeToggle.dataset.zuzThemeBound === "true") {
      return;
    }

    themeToggle.dataset.zuzThemeBound = "true";

    themeToggle.addEventListener("click", () => {
      const currentTheme = document.body.classList.contains("dark")
        ? "dark"
        : "light";

      const nextTheme = currentTheme === "dark" ? "light" : "dark";

      // Expansão radial a partir do botão: a nova paleta revela a interface.
      // Fallback mantém a troca funcional em navegadores sem View Transitions.
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const rect = themeToggle.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const radius = Math.ceil(Math.max(
        Math.hypot(centerX, centerY),
        Math.hypot(window.innerWidth - centerX, centerY),
        Math.hypot(centerX, window.innerHeight - centerY),
        Math.hypot(window.innerWidth - centerX, window.innerHeight - centerY)
      ));
      const applyTheme = () => {
        localStorage.setItem("zuz-theme", nextTheme);
        renderThemeControls(nextTheme === "dark");
      };

      if (reduceMotion || typeof document.startViewTransition !== "function") {
        applyTheme();
        return;
      }

      document.documentElement.style.setProperty("--zuz-theme-x", centerX + "px");
      document.documentElement.style.setProperty("--zuz-theme-y", centerY + "px");
      document.documentElement.style.setProperty("--zuz-theme-radius", radius + "px");
      const transition = document.startViewTransition(applyTheme);
      transition.finished.finally(() => {
        document.documentElement.style.removeProperty("--zuz-theme-x");
        document.documentElement.style.removeProperty("--zuz-theme-y");
        document.documentElement.style.removeProperty("--zuz-theme-radius");
      }).catch(() => {});
    });
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
        : projectUrl("Login/login.html");

      if (block.tagName === "A") {
        block.href = destination;
      }

      if (nestedLink) {
        nestedLink.href = destination;
      }

      // Reutiliza a foto persistida no perfil em todas as barras laterais.
      // A página Perfil já gerencia sua própria imagem e não precisa ser duplicada.
      const avatar = block.querySelector(".avatar");
      if (avatar && !block.classList.contains("profile-account-link")) {
        let photo = avatar.querySelector(".zuz-sidebar-photo");
        const fallback = avatar.querySelector("svg");
        const sameAccount = String(profile?.email || "").toLowerCase() ===
          String(session?.email || "").toLowerCase();
        const src = loggedIn && sameAccount && typeof profile?.photo === "string"
          ? profile.photo : "";

        if (src) {
          if (!photo) {
            photo = document.createElement("img");
            photo.className = "zuz-sidebar-photo";
            photo.alt = "Foto do perfil";
            photo.style.cssText = "width:100%;height:100%;display:block;object-fit:cover;";
            avatar.appendChild(photo);
          }
          photo.hidden = true;
          photo.onload = () => {
            photo.hidden = false;
            if (fallback) fallback.style.display = "none";
          };
          photo.onerror = () => {
            photo.hidden = true;
            photo.removeAttribute("src");
            if (fallback) fallback.style.display = "";
          };
          if (fallback) fallback.style.display = "";
          photo.src = src;
        } else {
          if (photo) {
            photo.hidden = true;
            photo.removeAttribute("src");
          }
          if (fallback) fallback.style.display = "";
        }
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
    bindThemeToggle();
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
