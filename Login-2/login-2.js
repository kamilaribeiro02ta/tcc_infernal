document.addEventListener("DOMContentLoaded", () => {
  const SESSION_KEY = "zuz-session";
  const PROFILE_KEY = "zuz-profile";

  const form = document.getElementById("signupForm");
  const email = document.getElementById("loginEmail");
  const password = document.getElementById("password");

  const emailError = document.getElementById("loginEmailError");
  const passwordError = document.getElementById("loginPasswordError");
  const loginStatus = document.getElementById("loginStatus");
  const showPasswordButton = document.querySelector(".password-dot");

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  }

  function getProfile() {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null;
    } catch {
      return null;
    }
  }

  const existingSession = getSession();

  if (existingSession?.email) {
    window.location.replace("../perfil/perfil.html");
    return;
  }

  showPasswordButton?.addEventListener("click", () => {
    const showing = password.type === "text";

    password.type = showing
      ? "password"
      : "text";

    const span = showPasswordButton.querySelector("span");

    if (span) {
      span.textContent = showing
        ? "Mostrar"
        : "Ocultar";
    }
  });

  form?.addEventListener("submit", event => {
    event.preventDefault();

    emailError.textContent = "";
    passwordError.textContent = "";
    loginStatus.textContent = "";

    let valid = true;

    const normalizedEmail =
      email.value.trim().toLowerCase();

    if (!normalizedEmail) {
      emailError.textContent =
        "Digite seu email.";
      valid = false;
    } else if (!email.validity.valid) {
      emailError.textContent =
        "Digite um email válido.";
      valid = false;
    }

    if (!password.value) {
      passwordError.textContent =
        "Digite sua senha.";
      valid = false;
    } else if (password.value.length < 8) {
      passwordError.textContent =
        "A senha precisa ter pelo menos 8 caracteres.";
      valid = false;
    }

    if (!valid) {
      return;
    }

    const savedProfile = getProfile();
    const sameUser =
      savedProfile?.email?.toLowerCase() === normalizedEmail;

    const profile = {
      id:
        sameUser && savedProfile?.id
          ? savedProfile.id
          : "local_" + Date.now().toString(36),

      name:
        sameUser && savedProfile?.name
          ? savedProfile.name
          : "Usuário ZUZ",

      email:
        normalizedEmail,

      createdAt:
        sameUser && savedProfile?.createdAt
          ? savedProfile.createdAt
          : new Date().toISOString(),

      photo:
        sameUser
          ? savedProfile?.photo || ""
          : "",

      banner:
        sameUser
          ? savedProfile?.banner || ""
          : ""
    };

    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify(profile)
    );

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        userId: profile.id,
        email: normalizedEmail,
        loggedInAt: new Date().toISOString()
      })
    );

    localStorage.setItem(
      "zuz-logged-in",
      "true"
    );

    localStorage.removeItem(
      "zuz-explicit-logout"
    );

    loginStatus.textContent =
      "Login realizado com sucesso!";

    window.setTimeout(() => {
      window.location.href =
        "../perfil/perfil.html";
    }, 150);
  });
});
