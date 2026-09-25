document.addEventListener("DOMContentLoaded", () => {

  const form =
    document.getElementById("signupForm");

  const email =
    document.getElementById("loginEmail");

  const password =
    document.getElementById("password");

  const emailError =
    document.getElementById("loginEmailError");

  const passwordError =
    document.getElementById("loginPasswordError");

  const loginStatus =
    document.getElementById("loginStatus");

  const showPasswordButton =
    document.querySelector(".password-dot");


  /* ==============================
     MOSTRAR SENHA
  ============================== */

  showPasswordButton?.addEventListener(
    "click",
    () => {

      const showing =
        password.type === "text";


      password.type =
        showing
          ? "password"
          : "text";


      const span =
        showPasswordButton.querySelector("span");


      if (span) {

        span.textContent =
          showing
            ? "Mostrar"
            : "Ocultar";

      }

    }
  );


  /* ==============================
     LOGIN
  ============================== */

  form?.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();


      emailError.textContent = "";
      passwordError.textContent = "";
      loginStatus.textContent = "";


      let valid = true;


      if (!email.value.trim()) {

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


      /* PROCURA PERFIL EXISTENTE */

      let profile = null;


      try {

        profile =
          JSON.parse(
            localStorage.getItem(
              "zuz-profile"
            )
          );

      } catch (error) {

        profile = null;

      }


      /*
        Enquanto não existe backend,
        se não houver perfil ainda,
        cria um perfil básico.
      */

      if (!profile) {

        profile = {

          name: "Usuário ZUZ",

          email:
            email.value.trim(),

          createdAt:
            new Date().toISOString(),

          photo: "",

          banner: ""

        };


        localStorage.setItem(
          "zuz-profile",
          JSON.stringify(profile)
        );

      }


      localStorage.setItem(
        "zuz-logged-in",
        "true"
      );


      loginStatus.textContent =
        "Login realizado com sucesso!";


      setTimeout(() => {

        window.location.href =
          "../perfil/perfil.html";

      }, 400);

    }
  );

});