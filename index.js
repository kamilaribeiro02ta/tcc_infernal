// ============ TOGGLE MODO ESCURO ============
(function () {
  const toggleBtn = document.getElementById('themeToggle');
  const label = document.getElementById('themeLabel');
  const iconSun = document.getElementById('iconSun');
  const iconMoon = document.getElementById('iconMoon');
 
  function applyTheme(isDark) {
    document.body.classList.toggle('dark', isDark);
    toggleBtn?.setAttribute('aria-pressed', String(isDark));
    if (label) label.textContent = isDark ? 'Modo Escuro' : 'Modo Claro';
    if (iconSun) iconSun.style.display = isDark ? 'none' : 'block';
    if (iconMoon) iconMoon.style.display = isDark ? 'block' : 'none';
  }
 
  // Lê preferência salva, ou usa a preferência do sistema como padrão
  const saved = localStorage.getItem('zuz-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved ? saved === 'dark' : prefersDark);
 
  toggleBtn?.addEventListener('click', function () {
    const isDark = !document.body.classList.contains('dark');
    applyTheme(isDark);
    localStorage.setItem('zuz-theme', isDark ? 'dark' : 'light');
  });
})();