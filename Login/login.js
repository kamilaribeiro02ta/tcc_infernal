document.addEventListener("DOMContentLoaded", () => {
  const USERS_KEY = "zuz-users";
  const SESSION_KEY = "zuz-session";
  const PROFILE_KEY = "zuz-profile";

  const form = document.getElementById("signupForm");
  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const email = document.getElementById("signupEmail");
  const password = document.getElementById("password");

  const firstNameError = document.getElementById("firstNameError");
  const lastNameError = document.getElementById("lastNameError");
  const emailError = document.getElementById("signupEmailError");
  const passwordError = document.getElementById("signupPasswordError");
  const status = document.getElementById("signupStatus");
  const showPasswordButton = document.querySelector(".password-dot");

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

  showPasswordButton?.addEventListener("click", () => {
    const isPassword = password.type === "password";
    password.type = isPassword ? "text" : "password";

    const text = showPasswordButton.querySelector("span");
    if (text) {
      text.textContent = isPassword ? "Ocultar" : "Mostrar";
    }
  });

  form?.addEventListener("submit", async event => {
    event.preventDefault();

    firstNameError.textContent = "";
    lastNameError.textContent = "";
    emailError.textContent = "";
    passwordError.textContent = "";
    status.textContent = "";

    let valid = true;

    if (!firstName.value.trim()) {
      firstNameError.textContent = "Digite seu primeiro nome.";
      valid = false;
    }

    if (!lastName.value.trim()) {
      lastNameError.textContent = "Digite seu sobrenome.";
      valid = false;
    }

    if (!email.value.trim()) {
      emailError.textContent = "Digite seu email.";
      valid = false;
    } else if (!email.validity.valid) {
      emailError.textContent = "Digite um email válido.";
      valid = false;
    }

    if (!password.value) {
      passwordError.textContent = "Digite uma senha.";
      valid = false;
    } else if (password.value.length < 8) {
      passwordError.textContent = "A senha precisa ter pelo menos 8 caracteres.";
      valid = false;
    }

    if (!valid) return;

    const normalizedEmail = email.value.trim().toLowerCase();
    const users = getUsers();

    if (users.some(user => user.email === normalizedEmail)) {
      emailError.textContent = "Já existe uma conta com este email.";
      return;
    }

    status.textContent = "Criando sua conta...";

    const profile = {
      id: "usr_" + Date.now().toString(36),
      name: `${firstName.value.trim()} ${lastName.value.trim()}`,
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
      photo: "",
      banner: ""
    };

    const passwordHash = await hashPassword(password.value);

    users.push({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      createdAt: profile.createdAt,
      passwordHash
    });

    saveUsers(users);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        userId: profile.id,
        email: profile.email,
        loggedInAt: new Date().toISOString()
      })
    );

    localStorage.setItem("zuz-logged-in", "true");
    localStorage.removeItem("zuz-explicit-logout");

    status.textContent = "Conta criada com sucesso!";

    window.setTimeout(() => {
      window.location.href = "../perfil/perfil.html";
    }, 250);
  });
});
