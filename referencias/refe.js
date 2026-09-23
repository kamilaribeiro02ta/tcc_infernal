document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const themeLabel = document.getElementById("themeLabel");
  const iconSun = document.getElementById("iconSun");
  const iconMoon = document.getElementById("iconMoon");

  function applyTheme(theme) {
    const isDark = theme === "dark";

    document.body.classList.toggle("dark", isDark);

    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(isDark));
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
  }

  const savedTheme = localStorage.getItem("zuz-theme");

  if (savedTheme === "dark" || savedTheme === "light") {
    applyTheme(savedTheme);
  } else {
    applyTheme("light");
    localStorage.setItem("zuz-theme", "light");
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isDark = document.body.classList.contains("dark");

      const newTheme = isDark ? "light" : "dark";

      localStorage.setItem("zuz-theme", newTheme);
      applyTheme(newTheme);
    });
  }


  const navItems = document.querySelectorAll(".nav-item");
  const currentPath = window.location.pathname;

  navItems.forEach((item) => {
    const href = item.getAttribute("href");

    if (!href) return;

    const linkPath = new URL(href, window.location.href).pathname;

    if (linkPath === currentPath) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
});