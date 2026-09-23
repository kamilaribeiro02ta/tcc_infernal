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



document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll(".nav-item");

  const paginaAtual = window.location.pathname;

  navItems.forEach(item => {
    const link = item.getAttribute("href");

    if (
      link === "index.html" &&
      (paginaAtual.endsWith("/") || paginaAtual.endsWith("index.html"))
    ) {
      item.classList.add("active");
    }

    if (
      link !== "index.html" &&
      paginaAtual.endsWith(link)
    ) {
      item.classList.add("active");
    }
  });
});

/* ============ SENHA E VALIDAÇÃO DO CADASTRO ============ */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const email = document.getElementById("signupEmail");
  const password = document.getElementById("password");
  const passwordButton = document.querySelector(".password-dot");

  const errors = {
    firstName: document.getElementById("firstNameError"),
    lastName: document.getElementById("lastNameError"),
    email: document.getElementById("signupEmailError"),
    password: document.getElementById("signupPasswordError")
  };

  const status = document.getElementById("signupStatus");

  function clearField(input, error) {
    input?.removeAttribute("aria-invalid");
    if (error) error.textContent = "";
  }

  function setError(input, error, message) {
    input?.setAttribute("aria-invalid", "true");
    if (error) error.textContent = message;
  }

  [
    [firstName, errors.firstName],
    [lastName, errors.lastName],
    [email, errors.email],
    [password, errors.password]
  ].forEach(([input, error]) => {
    input?.addEventListener("input", () => clearField(input, error));
  });

  passwordButton?.addEventListener("click", () => {
    if (!password) return;

    const shouldShow = password.type === "password";
    password.type = shouldShow ? "text" : "password";
    passwordButton.setAttribute(
      "aria-label",
      shouldShow ? "Ocultar senha" : "Mostrar senha"
    );

    const label = passwordButton.querySelector("span");
    if (label) {
      label.textContent = shouldShow ? "Ocultar" : "Mostrar";
    }
  });

  form?.addEventListener("submit", event => {
    event.preventDefault();

    [
      [firstName, errors.firstName],
      [lastName, errors.lastName],
      [email, errors.email],
      [password, errors.password]
    ].forEach(([input, error]) => clearField(input, error));

    if (status) {
      status.textContent = "";
      status.className = "form-status";
    }

    let firstInvalid = null;

    if (!firstName?.value.trim()) {
      setError(firstName, errors.firstName, "Informe seu primeiro nome.");
      firstInvalid = firstName;
    }

    if (!lastName?.value.trim()) {
      setError(lastName, errors.lastName, "Informe seu sobrenome.");
      firstInvalid ??= lastName;
    }

    if (!email?.value.trim()) {
      setError(email, errors.email, "Informe seu email.");
      firstInvalid ??= email;
    } else if (!email.validity.valid) {
      setError(email, errors.email, "Digite um email válido.");
      firstInvalid ??= email;
    }

    if (!password?.value) {
      setError(password, errors.password, "Crie uma senha.");
      firstInvalid ??= password;
    } else if (password.value.length < 8) {
      setError(password, errors.password, "A senha precisa ter pelo menos 8 caracteres.");
      firstInvalid ??= password;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    if (status) {
      status.textContent =
        "Dados validados. O cadastro ainda precisa ser conectado ao backend.";
      status.classList.add("is-success");
    }
  });
});
