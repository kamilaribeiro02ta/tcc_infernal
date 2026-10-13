document.addEventListener("DOMContentLoaded", () => {
  "use strict";


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


  function cacheProfile(user) {
    // Guarda o perfil para a interface antiga; o backend valida a sessão real.
    const oldId=localStorage.getItem("zuz-last-account")||"unassigned";
    if(oldId!==user.id){
      for(const key of ["zuz-pricing-products-v2","zuz-business-settings-v1","zuz-company-events","zuz-company-tasks","zuz-company-team","zuz-company-owner"]){
        const old=localStorage.getItem(key);
        if(old!==null){
          localStorage.setItem("zuz-legacy:"+oldId+":"+key,old);
          localStorage.removeItem(key);
        }
        const own=localStorage.getItem("zuz-legacy:"+user.id+":"+key);
        if(own!==null)localStorage.setItem(key,own);
      }
      localStorage.setItem("zuz-last-account",user.id);
    }
    let last={};
    try {last=JSON.parse(localStorage.getItem("zuz-profile")||"{}");}catch{}
    const own=last.id===user.id;
    localStorage.setItem("zuz-profile",JSON.stringify({id:user.id,name:user.name,email:user.email,
      photo:own?last.photo||"":"",banner:own?last.banner||"":""}));
    localStorage.setItem("zuz-session",JSON.stringify({userId:user.id,email:user.email}));
    localStorage.removeItem("zuz-explicit-logout");
  }
  loginForm.addEventListener("submit",async event=>{
    event.preventDefault();clearLoginErrors();
    const email=loginEmail.value.trim().toLowerCase(),password=loginPassword.value;
    if(!loginEmail.validity.valid || !email){loginEmailError.textContent="Informe um e-mail válido.";return;}
    if(!password){loginPasswordError.textContent="Informe sua senha.";return;}
    setStatus(loginStatus,"Entrando...");
    try{
      const result=await window.ZUZAPI.request("POST","/auth/login",{email,password});
      cacheProfile(result.user);
      window.location.href=result.company?"../perfil/perfil.html":"../onboarding/onboarding.html";
    }catch(e){setStatus(loginStatus,e.message,"is-error");}
  });
  signupForm.addEventListener("submit",async event=>{
    event.preventDefault();clearSignupErrors();
    const first=firstName.value.trim(),last=lastName.value.trim(),email=signupEmail.value.trim().toLowerCase(),password=signupPassword.value;
    if(!first){firstNameError.textContent="Digite seu nome.";return;}
    if(!last){lastNameError.textContent="Digite seu sobrenome.";return;}
    if(!signupEmail.validity.valid || !email){signupEmailError.textContent="Informe um e-mail válido.";return;}
    if(password.length<8){signupPasswordError.textContent="Use pelo menos 8 caracteres.";return;}
    setStatus(signupStatus,"Criando sua conta...");
    try{
      const result=await window.ZUZAPI.request("POST","/auth/signup",{name:first+" "+last,email,password});
      cacheProfile(result.user);
      window.location.href="../onboarding/onboarding.html";
    }catch(e){setStatus(signupStatus,e.message,"is-error");}
  });
  window.ZUZAPI.request("GET","/me").then(({user,company})=>{
    cacheProfile(user);
    window.location.replace(company?"../perfil/perfil.html":"../onboarding/onboarding.html");
  }).catch(()=>{});
  const requestedMode=new URLSearchParams(window.location.search).get("mode");
  showMode(requestedMode==="signup"?"signup":"login",false,false);
});
