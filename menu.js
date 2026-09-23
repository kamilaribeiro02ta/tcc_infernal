// Usa o caminho real dos links para selecionar apenas a página atual.
document.addEventListener('DOMContentLoaded', () => {
  const current = new URL(window.location.href);
  const normalize = path => path.replace(/\/index\.html$/, '/');
  document.querySelectorAll('.sidebar .nav-item').forEach(item => {
    const target = new URL(item.getAttribute('href'), current);
    const active = normalize(target.pathname) === normalize(current.pathname);
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
});
