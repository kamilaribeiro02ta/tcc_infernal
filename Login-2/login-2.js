document.addEventListener("DOMContentLoaded", () => {
  const USERS_KEY = "zuz-users";
  const SESSION_KEY = "zuz-session";
  const PROFILE_KEY = "zuz-profile";

  const form = document.getElementById("signupForm");
  const email = document.getElementById("loginEmail");
  const password = document.getElementById("password");

  const emailError = document.getElementById("loginEmailError");
  const passwordError = document.getElementById("loginPasswordError");
  const loginStatus = document.getElementById("loginStatus");
  const showPasswordButton = document.querySelector(".password-dot");

  function getUsers() {
    try {
      const parsed = JSON.parse(localStorage.getItem(USERS_KEY));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  }

  async function hashPassword(value) {
    if (!window.crypto?.subtle) {
      return value;
    }

    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  const existingSession = getSession();
  if (existingSession?.email) {
    window.location.replace("../perfil/perfil.html");
    return;
  }

  showPasswordButton?.addEventListener("click", () => {
    const showing = password.type === "text";
    password.type = showing ? "password" : "text";

    const span = showPasswordButton.querySelector("span");
    if (span) {
      span.textContent = showing ? "Mostrar" : "Ocultar";
    }
  });

  form?.addEventListener("submit", async event => {
    event.preventDefault();

    emailError.textContent = "";
    passwordError.textContent = "";
    loginStatus.textContent = "";

    let valid = true;

    if (!email.value.trim()) {
      emailError.textContent = "Digite seu email.";
      valid = false;
    } else if (!email.validity.valid) {
      emailError.textContent = "Digite um email válido.";
      valid = false;
    }

    if (!password.value) {
      passwordError.textContent = "Digite sua senha.";
      valid = false;
    } else if (password.value.length < 8) {
      passwordError.textContent = "A senha precisa ter pelo menos 8 caracteres.";
      valid = false;
    }

    if (!valid) return;

    const normalizedEmail = email.value.trim().toLowerCase();
    const users = getUsers();
    const user = users.find(item => item.email === normalizedEmail);

    if (!user) {
      loginStatus.textContent = "Conta não encontrada. Crie sua conta primeiro.";
      return;
    }

    const passwordHash = await hashPassword(password.value);

    if (user.passwordHash !== passwordHash) {
      passwordError.textContent = "Senha incorreta.";
      return;
    }

    const previousProfile = (() => {
      try {
        return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
      } catch {
        return {};
      }
    })();

    const profile = {
      ...previousProfile,
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      photo: previousProfile.email === user.email ? previousProfile.photo || "" : "",
      banner: previousProfile.email === user.email ? previousProfile.banner || "" : ""
    };

    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        loggedInAt: new Date().toISOString()
      })
    );

    localStorage.setItem("zuz-logged-in", "true");

    loginStatus.textContent = "Login realizado com sucesso!";

    window.setTimeout(() => {
      window.location.href = "../perfil/perfil.html";
    }, 200);
  });
});
