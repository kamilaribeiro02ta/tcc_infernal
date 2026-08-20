document.addEventListener("DOMContentLoaded", () => {
  const senha = document.getElementById("senha");
  const toggleBtn = document.getElementById("passwordToggle");
  const form = document.getElementById("loginForm");
 
  // Mostrar/ocultar senha
  toggleBtn?.addEventListener("click", () => {
    const isVisible = senha.type === "text";
    senha.type = isVisible ? "password" : "text";
    toggleBtn.setAttribute("aria-pressed", String(!isVisible));
  });
 
  // Envio do formulário (placeholder até existir integração com backend)
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    // TODO: conectar com a API de autenticação do ZUZ
    console.log("Login enviado:", {
      email: document.getElementById("email").value,
      senha: senha.value,
    });
  });
});
 