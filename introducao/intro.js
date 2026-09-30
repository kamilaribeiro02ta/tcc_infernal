// Tema
(function () {
  const toggleBtn = document.getElementById("themeToggle");
  const label = document.getElementById("themeLabel");
  const iconSun = document.getElementById("iconSun");
  const iconMoon = document.getElementById("iconMoon");

  function applyTheme(isDark) {
    document.body.classList.toggle("dark", isDark);
    toggleBtn?.setAttribute("aria-pressed", String(isDark));
    if (label) label.textContent = isDark ? "Modo Escuro" : "Modo Claro";
    if (iconSun) iconSun.style.display = isDark ? "none" : "block";
    if (iconMoon) iconMoon.style.display = isDark ? "block" : "none";
  }

  const saved = localStorage.getItem("zuz-theme");
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  applyTheme(saved ? saved === "dark" : prefersDark);

  toggleBtn?.addEventListener("click", () => {
    const isDark = !document.body.classList.contains("dark");
    applyTheme(isDark);
    localStorage.setItem("zuz-theme", isDark ? "dark" : "light");
  });
})();

// Cards expansíveis
document.querySelectorAll(".about-card").forEach((card) => {
  const trigger = card.querySelector(".card-trigger");

  trigger?.addEventListener("click", () => {
    const willOpen = !card.classList.contains("open");

    document.querySelectorAll(".about-card.open").forEach((openCard) => {
      if (openCard !== card) {
        openCard.classList.remove("open");
        openCard.querySelector(".card-trigger")?.setAttribute("aria-expanded", "false");
      }
    });

    card.classList.toggle("open", willOpen);
    trigger.setAttribute("aria-expanded", String(willOpen));
  });
});


const protoCore = document.querySelector(".proto-core");

if (protoCore) {
  let angle = -18;

  setInterval(() => {
    const hovered = document.querySelector(".prototype-view:hover");
    if (!hovered) {
      angle = angle === -18 ? -12 : -18;
      protoCore.style.transform = `rotateX(12deg) rotateY(${angle}deg)`;
    }
  }, 2200);
}
