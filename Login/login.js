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

  const showPasswordButton =
    document.querySelector(".password-dot");


  /* ==============================
     MOSTRAR SENHA
  ============================== */

  showPasswordButton?.addEventListener("click", () => {

    const isPassword =
      password.type === "password";

    password.type =
      isPassword ? "text" : "password";

    const text =
      showPasswordButton.querySelector("span");

    if (text) {
      text.textContent =
        isPassword ? "Ocultar" : "Mostrar";
    }

  });


  /* ==============================
     CRIAR CONTA
  ============================== */

  form?.addEventListener("submit", (event) => {

    event.preventDefault();

    let valid = true;


    firstNameError.textContent = "";
    lastNameError.textContent = "";
    emailError.textContent = "";
    passwordError.textContent = "";

    status.textContent = "";


    /* NOME */

    if (!firstName.value.trim()) {

      firstNameError.textContent =
        "Digite seu primeiro nome.";

      valid = false;

    }


    /* SOBRENOME */

    if (!lastName.value.trim()) {

      lastNameError.textContent =
        "Digite seu sobrenome.";

      valid = false;

    }


    /* EMAIL */

    if (!email.value.trim()) {

      emailError.textContent =
        "Digite seu email.";

      valid = false;

    } else if (!email.validity.valid) {

      emailError.textContent =
        "Digite um email válido.";

      valid = false;

    }


    /* SENHA */

    if (!password.value) {

      passwordError.textContent =
        "Digite uma senha.";

      valid = false;

    } else if (password.value.length < 8) {

      passwordError.textContent =
        "A senha precisa ter pelo menos 8 caracteres.";

      valid = false;

    }


    if (!valid) {
      return;
    }


    /* ==============================
       CRIA O PERFIL
    ============================== */

    const profileData = {

      name:
        `${firstName.value.trim()} ${lastName.value.trim()}`,

      email:
        email.value.trim(),

      createdAt:
        new Date().toISOString(),

      photo: "",

      banner: ""

    };


    localStorage.setItem(
      "zuz-profile",
      JSON.stringify(profileData)
    );


    /* MARCA USUÁRIO COMO LOGADO */

    localStorage.setItem(
      "zuz-logged-in",
      "true"
    );


    status.textContent =
      "Conta criada com sucesso!";


    /* VAI PARA O PERFIL */

    setTimeout(() => {

      window.location.href =
        "../perfil/perfil.html";

    }, 500);

  });

});