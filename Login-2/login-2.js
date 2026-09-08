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


    // Preferência do sistema
    const prefersDark =
        window.matchMedia &&
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;


    // Aplica o tema
    if (savedTheme) {

        applyTheme(
            savedTheme === "dark"
        );

    } else {

        applyTheme(prefersDark);

    }


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

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const form =
            document.getElementById("signupForm");


        form?.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const email =
                    form.querySelector(
                        'input[name="email"]'
                    );

                const password =
                    form.querySelector(
                        'input[name="password"]'
                    );


                if (
                    !email?.value.trim() ||
                    !password?.value.trim()
                ) {

                    alert(
                        "Preencha seu email e sua senha."
                    );

                    return;

                }


                if (
                    password.value.length < 8
                ) {

                    alert(
                        "A senha deve ter pelo menos 8 caracteres."
                    );

                    return;

                }


                /*
                    Aqui futuramente entra
                    a autenticação real do ZUZ.

                    Exemplo:

                    fetch(...)
                    Firebase
                    Supabase
                    API própria
                */


                console.log(
                    "Tentativa de login:",
                    {
                        email:
                            email.value.trim()
                    }
                );

            }
        );

    }
);