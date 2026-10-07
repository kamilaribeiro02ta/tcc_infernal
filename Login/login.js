document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const USERS_KEY = "zuz-users";
  const SESSION_KEY = "zuz-session";
  const PROFILE_KEY = "zuz-profile";

  const authPage = document.querySelector(".auth-page");
  const loginPanel = document.getElementById("loginPanel");
  const signupPanel = document.getElementById("signupPanel");
  const desktopSwapQuery = window.matchMedia("(min-width: 841px)");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let isModeSwitching = false;

  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const loginEmailError = document.getElementById("loginEmailError");
  const loginPasswordError = document.getElementById("loginPasswordError");
  const loginStatus = document.getElementById("loginStatus");

  const signupForm = document.getElementById("signupForm");
  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const signupEmail = document.getElementById("signupEmail");
  const signupPassword = document.getElementById("signupPassword");
  const firstNameError = document.getElementById("firstNameError");
  const lastNameError = document.getElementById("lastNameError");
  const signupEmailError = document.getElementById("signupEmailError");
  const signupPasswordError = document.getElementById("signupPasswordError");
  const signupStatus = document.getElementById("signupStatus");

  function getUsers() {
    try {
      const parsed = JSON.parse(localStorage.getItem(USERS_KEY));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
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

  function setStatus(element, message = "", type = "") {
    element.textContent = message;
    element.classList.remove("is-error", "is-success");
    if (type) element.classList.add(type);
  }

  function clearLoginErrors() {
    loginEmailError.textContent = "";
    loginPasswordError.textContent = "";
    setStatus(loginStatus);
  }

  function clearSignupErrors() {
    firstNameError.textContent = "";
    lastNameError.textContent = "";
    signupEmailError.textContent = "";
    signupPasswordError.textContent = "";
    setStatus(signupStatus);
  }

  function syncPanelVisibility(isLogin) {
    loginPanel.hidden = !isLogin;
    signupPanel.hidden = isLogin;
    loginPanel.setAttribute("aria-hidden", String(!isLogin));
    signupPanel.setAttribute("aria-hidden", String(isLogin));
  }

  function updateModeUrl(isLogin) {
    const url = new URL(window.location.href);
    if (isLogin) {
      url.searchParams.delete("mode");
    } else {
      url.searchParams.set("mode", "signup");
    }
    window.history.replaceState({}, "", url);
  }

  function showMode(mode, updateUrl = true, animate = true) {
    const isLogin = mode !== "signup";
    const wantsSignup = !isLogin;
    const alreadySignup = authPage?.classList.contains("is-signup-mode");

    if (isModeSwitching || (animate && alreadySignup === wantsSignup)) {
      return;
    }

    document.title = isLogin ? "ZUZ | Entrar" : "ZUZ | Criar conta";

    if (updateUrl) {
      updateModeUrl(isLogin);
    }

    const shouldAnimate =
      animate &&
      desktopSwapQuery.matches &&
      !reducedMotionQuery.matches &&
      authPage;

    if (!shouldAnimate) {
      authPage?.classList.toggle("is-signup-mode", wantsSignup);
      syncPanelVisibility(isLogin);

      requestAnimationFrame(() => {
        (isLogin ? loginEmail : firstName)?.focus();
      });
      return;
    }

    isModeSwitching = true;
    authPage.classList.add("is-transitioning");
    authPage.classList.toggle("is-signup-mode", wantsSignup);

    window.setTimeout(() => {
      syncPanelVisibility(isLogin);
    }, 300);

    window.setTimeout(() => {
      authPage.classList.remove("is-transitioning");
      isModeSwitching = false;
      (isLogin ? loginEmail : firstName)?.focus();
    }, 720);
  }

  function saveAuthenticatedProfile(user) {
    const existingProfile = (() => {
      try {
        return JSON.parse(localStorage.getItem(PROFILE_KEY));
      } catch {
        return null;
      }
    })();

    const sameUser = existingProfile?.email?.toLowerCase() === user.email.toLowerCase();

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt || new Date().toISOString(),
      photo: sameUser ? existingProfile?.photo || "" : "",
      banner: sameUser ? existingProfile?.banner || "" : ""
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
    localStorage.removeItem("zuz-explicit-logout");
  }

  document.querySelectorAll("[data-password-target]").forEach(button => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.passwordTarget);
      if (!input) return;

      const willShow = input.type === "password";
      input.type = willShow ? "text" : "password";
      button.setAttribute("aria-label", willShow ? "Ocultar senha" : "Mostrar senha");

      const icon = button.querySelector("i");
      icon?.classList.toggle("bx-show", !willShow);
      icon?.classList.toggle("bx-hide", willShow);
    });
  });

  document.querySelectorAll("[data-switch-mode]").forEach(button => {
    button.addEventListener("click", () => showMode(button.dataset.switchMode));
  });

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    clearLoginErrors();

    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;
    let valid = true;

    if (!email) {
      loginEmailError.textContent = "Digite seu email.";
      valid = false;
    } else if (!loginEmail.validity.valid) {
      loginEmailError.textContent = "Digite um email válido.";
      valid = false;
    }

    if (!password) {
      loginPasswordError.textContent = "Digite sua senha.";
      valid = false;
    } else if (password.length < 8) {
      loginPasswordError.textContent = "A senha precisa ter pelo menos 8 caracteres.";
      valid = false;
    }

    if (!valid) return;

    setStatus(loginStatus, "Verificando sua conta...");

    const users = getUsers();
    const user = users.find(item => String(item.email || "").toLowerCase() === email);

    if (!user) {
      setStatus(loginStatus, "Conta não encontrada. Crie uma conta para continuar.", "is-error");
      loginEmail.focus();
      return;
    }

    const passwordHash = await hashPassword(password);
    const passwordMatches = user.passwordHash === passwordHash || user.passwordHash === password;

    if (!passwordMatches) {
      setStatus(loginStatus, "Senha incorreta.", "is-error");
      loginPassword.focus();
      return;
    }

    saveAuthenticatedProfile(user);
    setStatus(loginStatus, "Login realizado com sucesso.", "is-success");

    window.setTimeout(() => {
      window.location.href = "../perfil/perfil.html";
    }, 180);
  });

  signupForm.addEventListener("submit", async event => {
    event.preventDefault();
    clearSignupErrors();

    const first = firstName.value.trim();
    const last = lastName.value.trim();
    const email = signupEmail.value.trim().toLowerCase();
    const password = signupPassword.value;
    let valid = true;

    if (!first) {
      firstNameError.textContent = "Digite seu nome.";
      valid = false;
    }

    if (!last) {
      lastNameError.textContent = "Digite seu sobrenome.";
      valid = false;
    }

    if (!email) {
      signupEmailError.textContent = "Digite seu email.";
      valid = false;
    } else if (!signupEmail.validity.valid) {
      signupEmailError.textContent = "Digite um email válido.";
      valid = false;
    }

    if (!password) {
      signupPasswordError.textContent = "Crie uma senha.";
      valid = false;
    } else if (password.length < 8) {
      signupPasswordError.textContent = "Use pelo menos 8 caracteres.";
      valid = false;
    }

    if (!valid) return;

    const users = getUsers();

    if (users.some(user => String(user.email || "").toLowerCase() === email)) {
      signupEmailError.textContent = "Já existe uma conta com este email.";
      signupEmail.focus();
      return;
    }

    setStatus(signupStatus, "Criando sua conta...");

    const user = {
      id: "usr_" + Date.now().toString(36),
      name: first + " " + last,
      email,
      createdAt: new Date().toISOString(),
      passwordHash: await hashPassword(password)
    };

    users.push(user);
    saveUsers(users);
    saveAuthenticatedProfile(user);

    setStatus(signupStatus, "Conta criada com sucesso.", "is-success");

    window.setTimeout(() => {
      window.location.href = "../perfil/perfil.html";
    }, 220);
  });

  const existingSession = getSession();
  if (existingSession?.email) {
    window.location.replace("../perfil/perfil.html");
    return;
  }

  const requestedMode = new URLSearchParams(window.location.search).get("mode");
  showMode(requestedMode === "signup" ? "signup" : "login", false, false);
});