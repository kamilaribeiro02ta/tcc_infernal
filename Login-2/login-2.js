document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const email = document.getElementById("loginEmail");
  const password = document.getElementById("password");

  const emailError = document.getElementById("loginEmailError");
  const passwordError = document.getElementById("loginPasswordError");
  const loginStatus = document.getElementById("loginStatus");
  const showPasswordButton = document.querySelector(".password-dot");

  async function redirectIfAlreadyLoggedIn() {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "same-origin"
      });

      if (response.ok) {
        window.location.replace("../perfil/perfil.html");
      }
    } catch (_) {}
  }

  redirectIfAlreadyLoggedIn();

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

    loginStatus.textContent = "Entrando...";

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          email: email.value.trim(),
          password: password.value
        })
      });

      const data = await response.json();

      if (!response.ok) {
        loginStatus.textContent = data.message || "Não foi possível entrar.";
        return;
      }

      const previousProfile = (() => {
        try {
          return JSON.parse(localStorage.getItem("zuz-profile")) || {};
        } catch (_) {
          return {};
        }
      })();

      localStorage.setItem(
        "zuz-profile",
        JSON.stringify({
          ...previousProfile,
          ...data.user,
          photo: previousProfile.photo || "",
          banner: previousProfile.banner || ""
        })
      );

      localStorage.removeItem("zuz-logged-in");

      loginStatus.textContent = "Login realizado com sucesso!";

      window.setTimeout(() => {
        window.location.href = "../perfil/perfil.html";
      }, 300);
    } catch (error) {
      console.error(error);
      loginStatus.textContent = "Não foi possível conectar ao servidor.";
    }
  });
});
