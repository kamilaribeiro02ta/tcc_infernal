// ============ TOGGLE MODO ESCURO ============

(function () {

    const toggleBtn = document.getElementById("themeToggle");
    const label = document.getElementById("themeLabel");
    const iconSun = document.getElementById("iconSun");
    const iconMoon = document.getElementById("iconMoon");


    function applyTheme(isDark) {

        document.body.classList.toggle("dark", isDark);

        toggleBtn?.setAttribute(
            "aria-pressed",
            String(isDark)
        );


        if (label) {
            label.textContent = isDark
                ? "Modo Escuro"
                : "Modo Claro";
        }


        if (iconSun) {
            iconSun.style.display = isDark
                ? "none"
                : "block";
        }


        if (iconMoon) {
            iconMoon.style.display = isDark
                ? "block"
                : "none";
        }

    }


    // Verifica se já existe um tema salvo
    const savedTheme =
        localStorage.getItem("zuz-theme");


    // Aplica o tema salvo. O primeiro acesso começa no modo claro.
    applyTheme(savedTheme === "dark");


    // Clique no botão
    toggleBtn?.addEventListener(
        "click",
        function () {

            const isDark =
                !document.body.classList.contains(
                    "dark"
                );


            applyTheme(isDark);


            localStorage.setItem(
                "zuz-theme",
                isDark
                    ? "dark"
                    : "light"
            );

        }
    );

})();





// ============ MOSTRAR / OCULTAR SENHA ============

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const password =
            document.getElementById("password");

        const passwordButton =
            document.querySelector(".password-dot");


        passwordButton?.addEventListener(
            "click",
            function () {

                if (!password) return;


                const isPassword =
                    password.type === "password";


                password.type =
                    isPassword
                        ? "text"
                        : "password";


                passwordButton.setAttribute(
                    "aria-label",
                    isPassword
                        ? "Ocultar senha"
                        : "Mostrar senha"
                );

                const label = passwordButton.querySelector("span");
                if (label) {
                    label.textContent = isPassword ? "Ocultar" : "Mostrar";
                }

            }
        );

    }
);





// ============ ITEM ATIVO DO MENU ============

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const navItems =
            document.querySelectorAll(".nav-item");


        const paginaAtual =
            window.location.pathname;


        navItems.forEach(
            function (item) {

                const href =
                    item.getAttribute("href");


                if (!href) return;


                const url =
                    new URL(
                        href,
                        window.location.href
                    );


                if (
                    paginaAtual ===
                    url.pathname
                ) {

                    item.classList.add(
                        "active"
                    );

                }

            }
        );

    }
);





// ============ FORMULÁRIO DE LOGIN ============

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signupForm");
    const email = document.getElementById("loginEmail");
    const password = document.getElementById("password");
    const emailError = document.getElementById("loginEmailError");
    const passwordError = document.getElementById("loginPasswordError");
    const status = document.getElementById("loginStatus");

    function clearField(input, error) {
        input?.removeAttribute("aria-invalid");
        if (error) error.textContent = "";
    }

    function setError(input, error, message) {
        input?.setAttribute("aria-invalid", "true");
        if (error) error.textContent = message;
    }

    email?.addEventListener("input", () => clearField(email, emailError));
    password?.addEventListener("input", () => clearField(password, passwordError));

    form?.addEventListener("submit", event => {
        event.preventDefault();

        clearField(email, emailError);
        clearField(password, passwordError);

        if (status) {
            status.textContent = "";
            status.className = "form-status";
        }

        let firstInvalid = null;

        if (!email?.value.trim()) {
            setError(email, emailError, "Informe seu email.");
            firstInvalid = email;
        } else if (!email.validity.valid) {
            setError(email, emailError, "Digite um email válido.");
            firstInvalid = email;
        }

        if (!password?.value) {
            setError(password, passwordError, "Informe sua senha.");
            firstInvalid ??= password;
        } else if (password.value.length < 8) {
            setError(password, passwordError, "A senha precisa ter pelo menos 8 caracteres.");
            firstInvalid ??= password;
        }

        if (firstInvalid) {
            firstInvalid.focus();
            return;
        }

        if (status) {
            status.textContent =
                "Dados validados. A autenticação ainda precisa ser conectada ao backend.";
            status.classList.add("is-success");
        }

        console.log("Tentativa de login:", {
            email: email.value.trim()
        });
    });
});
