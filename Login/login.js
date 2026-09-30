document.addEventListener("DOMContentLoaded", () => {
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

    status.textContent = "Criando sua conta...";

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          firstName: firstName.value.trim(),
          lastName: lastName.value.trim(),
          email: email.value.trim(),
          password: password.value
        })
      });

      const data = await response.json();

      if (!response.ok) {
        status.textContent = data.message || "Não foi possível criar a conta.";
        return;
      }

      localStorage.setItem(
        "zuz-profile",
        JSON.stringify({
          ...data.user,
          photo: "",
          banner: ""
        })
      );

      localStorage.removeItem("zuz-logged-in");

      status.textContent = "Conta criada com sucesso!";

      window.setTimeout(() => {
        window.location.href = "../perfil/perfil.html";
      }, 350);
    } catch (error) {
      console.error(error);
      status.textContent = "Não foi possível conectar ao servidor.";
    }
  });
});
