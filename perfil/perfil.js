document.addEventListener("DOMContentLoaded", () => {

  const PROFILE_KEY =
    "zuz-profile";


  /* =========================================================
     ELEMENTOS
  ========================================================= */

  const profileName =
    document.getElementById("profileName");

  const profileEmail =
    document.getElementById("profileEmail");

  const accountName =
    document.getElementById("accountName");

  const accountEmail =
    document.getElementById("accountEmail");

  const accountCreatedAt =
    document.getElementById("accountCreatedAt");


  const profileImage =
    document.getElementById("profileImage");

  const profilePlaceholder =
    document.getElementById("profilePlaceholder");

  const profilePhotoInput =
    document.getElementById("profilePhotoInput");

  const changePhotoBtn =
    document.getElementById("changePhotoBtn");


  const bannerImage =
    document.getElementById("bannerImage");

  const bannerInput =
    document.getElementById("bannerInput");

  const changeBannerBtn =
    document.getElementById("changeBannerBtn");


  const sidebarProfileImage =
    document.getElementById("sidebarProfileImage");

  const sidebarDefaultAvatar =
    document.getElementById("sidebarDefaultAvatar");

  const sidebarUserName =
    document.getElementById("sidebarUserName");

  const sidebarUserSubtitle =
    document.getElementById("sidebarUserSubtitle");


  const profileModal =
    document.getElementById("profileModal");

  const editProfileBtn =
    document.getElementById("editProfileBtn");

  const closeProfileModal =
    document.getElementById("closeProfileModal");

  const cancelProfileBtn =
    document.getElementById("cancelProfileBtn");

  const profileForm =
    document.getElementById("profileForm");

  const officialNameInput =
    document.getElementById("officialNameInput");


  const profileProducts =
    document.getElementById("profileProducts");

  const profileCategories =
    document.getElementById("profileCategories");

  const profileAverageMargin =
    document.getElementById("profileAverageMargin");

  const profileRevenue =
    document.getElementById("profileRevenue");


  const themeToggle =
    document.getElementById("themeToggle");

  const themeLabel =
    document.getElementById("themeLabel");

  const iconSun =
    document.getElementById("iconSun");

  const iconMoon =
    document.getElementById("iconMoon");


  /* =========================================================
     TEMA
  ========================================================= */

  function applyTheme(isDark) {

    document.body.classList.toggle(
      "dark",
      isDark
    );


    themeToggle?.setAttribute(
      "aria-pressed",
      String(isDark)
    );


    if (themeLabel) {

      themeLabel.textContent =
        isDark
          ? "MODO ESCURO"
          : "MODO CLARO";

    }


    if (iconSun) {

      iconSun.style.display =
        isDark
          ? "none"
          : "block";

    }


    if (iconMoon) {

      iconMoon.style.display =
        isDark
          ? "block"
          : "none";

    }

  }


  const savedTheme =
    localStorage.getItem(
      "zuz-theme"
    );


  applyTheme(
    savedTheme === "dark"
  );


  themeToggle?.addEventListener(
    "click",
    () => {

      const isDark =
        !document.body.classList.contains(
          "dark"
        );


      localStorage.setItem(
        "zuz-theme",
        isDark
          ? "dark"
          : "light"
      );


      applyTheme(
        isDark
      );

    }
  );


  /* =========================================================
     PERFIL PADRÃO
  ========================================================= */

  const defaultProfile = {

    name:
      "Usuário ZUZ",

    email:
      "email@exemplo.com",

    createdAt:
      new Date().toISOString(),

    photo:
      "",

    banner:
      ""

  };


  /* =========================================================
     CARREGAR PERFIL
  ========================================================= */

  function getProfile() {

    try {

      const saved =
        localStorage.getItem(
          PROFILE_KEY
        );


      if (!saved) {

        return {
          ...defaultProfile
        };

      }


      return {

        ...defaultProfile,

        ...JSON.parse(
          saved
        )

      };

    }

    catch (error) {

      console.error(
        "Erro ao carregar perfil:",
        error
      );


      return {
        ...defaultProfile
      };

    }

  }


  /* =========================================================
     SALVAR PERFIL
  ========================================================= */

  function saveProfile(profile) {

    try {

      localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify(
          profile
        )
      );


      return true;

    }

    catch (error) {

      console.error(
        "Erro ao salvar:",
        error
      );


      alert(
        "Não foi possível salvar."
      );


      return false;

    }

  }


  /* =========================================================
     DATA
  ========================================================= */

  function formatDate(value) {

    const date =
      new Date(
        value
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "--";

    }


    return new Intl.DateTimeFormat(
      "pt-BR",
      {

        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric"

      }
    ).format(
      date
    );

  }


  /* =========================================================
     PRIMEIRO NOME
  ========================================================= */

  function firstName(name) {

    return (
      String(
        name || ""
      )
        .trim()
        .split(/\s+/)[0]
      ||
      "Minha Conta"
    );

  }


  /* =========================================================
     MOSTRAR PERFIL
  ========================================================= */

  function renderProfile() {

    const profile =
      getProfile();


    if (profileName) {

      profileName.textContent =
        profile.name;

    }


    if (accountName) {

      accountName.textContent =
        profile.name;

    }


    if (profileEmail) {

      profileEmail.textContent =
        profile.email;

    }


    if (accountEmail) {

      accountEmail.textContent =
        profile.email;

    }


    if (accountCreatedAt) {

      accountCreatedAt.textContent =
        formatDate(
          profile.createdAt
        );

    }


    if (sidebarUserName) {

      sidebarUserName.textContent =
        firstName(
          profile.name
        );

    }


    if (sidebarUserSubtitle) {

      sidebarUserSubtitle.textContent =
        "Meu perfil";

    }


    /* FOTO */

    if (profile.photo) {

      if (profileImage) {

        profileImage.src =
          profile.photo;

        profileImage.hidden =
          false;

      }


      if (profilePlaceholder) {

        profilePlaceholder.hidden =
          true;

      }


      if (sidebarProfileImage) {

        sidebarProfileImage.src =
          profile.photo;

        sidebarProfileImage.hidden =
          false;

      }


      if (sidebarDefaultAvatar) {

        sidebarDefaultAvatar.style.display =
          "none";

      }

    }

    else {

      if (profileImage) {

        profileImage.hidden =
          true;

      }


      if (profilePlaceholder) {

        profilePlaceholder.hidden =
          false;

      }


      if (sidebarProfileImage) {

        sidebarProfileImage.hidden =
          true;

      }


      if (sidebarDefaultAvatar) {

        sidebarDefaultAvatar.style.display =
          "";

      }

    }


    /* BANNER */

    if (profile.banner) {

      if (bannerImage) {

        bannerImage.src =
          profile.banner;

        bannerImage.hidden =
          false;

      }

    }

    else {

      if (bannerImage) {

        bannerImage.hidden =
          true;

      }

    }

  }


  /* =========================================================
     REDIMENSIONAR FOTO
  ========================================================= */

  function prepareImage(
    file,
    maxSize = 900,
    quality = 0.9
  ) {

    return new Promise(
      (
        resolve,
        reject
      ) => {

        const reader =
          new FileReader();


        reader.onload =
          () => {

            const image =
              new Image();


            image.onload =
              () => {

                let width =
                  image.width;


                let height =
                  image.height;


                const scale =
                  Math.min(
                    1,
                    maxSize /
                    Math.max(
                      width,
                      height
                    )
                  );


                width =
                  Math.round(
                    width *
                    scale
                  );


                height =
                  Math.round(
                    height *
                    scale
                  );


                const canvas =
                  document.createElement(
                    "canvas"
                  );


                canvas.width =
                  width;


                canvas.height =
                  height;


                const ctx =
                  canvas.getContext(
                    "2d"
                  );


                if (!ctx) {

                  reject();

                  return;

                }


                ctx.imageSmoothingEnabled =
                  true;


                ctx.imageSmoothingQuality =
                  "high";


                ctx.drawImage(
                  image,
                  0,
                  0,
                  width,
                  height
                );


                resolve(
                  canvas.toDataURL(
                    "image/webp",
                    quality
                  )
                );

              };


            image.src =
              reader.result;

          };


        reader.onerror =
          reject;


        reader.readAsDataURL(
          file
        );

      }
    );

  }


  /* =========================================================
     ALTERAR FOTO
  ========================================================= */

  changePhotoBtn?.addEventListener(
    "click",
    () => {

      profilePhotoInput?.click();

    }
  );


  profilePhotoInput?.addEventListener(
    "change",
    async event => {

      const file =
        event.target.files?.[0];


      event.target.value =
        "";


      if (!file) {

        return;

      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        alert(
          "Selecione uma imagem válida."
        );


        return;

      }


      try {

        const photo =
          await prepareImage(
            file,
            900,
            0.9
          );


        const profile =
          getProfile();


        profile.photo =
          photo;


        if (
          saveProfile(
            profile
          )
        ) {

          renderProfile();

        }

      }

      catch (error) {

        console.error(
          error
        );


        alert(
          "Não foi possível carregar a foto."
        );

      }

    }
  );


  /* =========================================================
     ALTERAR BANNER
  ========================================================= */

  changeBannerBtn?.addEventListener(
    "click",
    () => {

      bannerInput?.click();

    }
  );


  bannerInput?.addEventListener(
    "change",
    async event => {

      const file =
        event.target.files?.[0];


      event.target.value =
        "";


      if (!file) {

        return;

      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        alert(
          "Selecione uma imagem válida."
        );


        return;

      }


      try {

        const banner =
          await prepareImage(
            file,
            1800,
            0.84
          );


        const profile =
          getProfile();


        profile.banner =
          banner;


        if (
          saveProfile(
            profile
          )
        ) {

          renderProfile();

        }

      }

      catch (error) {

        alert(
          "Não foi possível carregar o banner."
        );

      }

    }
  );


  /* =========================================================
     MODAL EDITAR PERFIL
  ========================================================= */

  function openProfileModal() {

    const profile =
      getProfile();


    if (officialNameInput) {

      officialNameInput.value =
        profile.name;

    }


    profileModal?.classList.add(
      "active"
    );


    profileModal?.setAttribute(
      "aria-hidden",
      "false"
    );


    document.body.style.overflow =
      "hidden";

  }


  function closeProfileModalFunction() {

    profileModal?.classList.remove(
      "active"
    );


    profileModal?.setAttribute(
      "aria-hidden",
      "true"
    );


    document.body.style.overflow =
      "";

  }


  editProfileBtn?.addEventListener(
    "click",
    openProfileModal
  );


  closeProfileModal?.addEventListener(
    "click",
    closeProfileModalFunction
  );


  cancelProfileBtn?.addEventListener(
    "click",
    closeProfileModalFunction
  );


  profileModal?.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        profileModal
      ) {

        closeProfileModalFunction();

      }

    }
  );


  profileForm?.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const name =
        officialNameInput
          ?.value
          .trim();


      if (!name) {

        return;

      }


      const profile =
        getProfile();


      profile.name =
        name;


      if (
        saveProfile(
          profile
        )
      ) {

        renderProfile();


        closeProfileModalFunction();

      }

    }
  );


  /* =========================================================
     PRODUTOS
  ========================================================= */

  function getProducts() {

    const keys = [

      "zuz-products",

      "zuzProducts",

      "products",

      "produtos"

    ];


    for (
      const key
      of keys
    ) {

      try {

        const saved =
          localStorage.getItem(
            key
          );


        if (!saved) {

          continue;

        }


        const parsed =
          JSON.parse(
            saved
          );


        if (
          Array.isArray(
            parsed
          )
        ) {

          return parsed;

        }


        if (
          Array.isArray(
            parsed?.products
          )
        ) {

          return parsed.products;

        }


        if (
          Array.isArray(
            parsed?.produtos
          )
        ) {

          return parsed.produtos;

        }

      }

      catch (error) {

        console.warn(
          error
        );

      }

    }


    return [];

  }


  function numberValue(value) {

    if (
      typeof value ===
      "number"
    ) {

      return value;

    }


    if (
      typeof value !==
      "string"
    ) {

      return 0;

    }


    let clean =
      value
        .replace(
          /R\$/gi,
          ""
        )
        .replace(
          /\s/g,
          ""
        );


    if (
      clean.includes(",")
    ) {

      clean =
        clean
          .replace(
            /\./g,
            ""
          )
          .replace(
            ",",
            "."
          );

    }


    return (
      Number(
        clean
      ) || 0
    );

  }


  function getProductNumber(
    product,
    keys
  ) {

    for (
      const key
      of keys
    ) {

      if (
        product?.[key] !==
        undefined
      ) {

        return numberValue(
          product[key]
        );

      }

    }


    return 0;

  }


  function getPrice(product) {

    return getProductNumber(
      product,
      [
        "salePrice",
        "price",
        "preco",
        "precoVenda"
      ]
    );

  }


  function getCost(product) {

    return getProductNumber(
      product,
      [
        "totalCost",
        "cost",
        "custo",
        "custoTotal",
        "precoBruto"
      ]
    );

  }


  function getMargin(product) {

    const saved =
      getProductNumber(
        product,
        [
          "margin",
          "margem",
          "marginPercentage",
          "margemPercentual"
        ]
      );


    if (saved) {

      return saved;

    }


    const price =
      getPrice(
        product
      );


    const cost =
      getCost(
        product
      );


    if (!price) {

      return 0;

    }


    return (
      (
        price -
        cost
      ) /
      price
    ) * 100;

  }


  function getRevenue(product) {

    const revenue =
      getProductNumber(
        product,
        [
          "revenue",
          "faturamento",
          "estimatedRevenue"
        ]
      );


    if (revenue) {

      return revenue;

    }


    const quantity =
      getProductNumber(
        product,
        [
          "quantity",
          "units",
          "vendas",
          "quantidade"
        ]
      );


    return (
      getPrice(
        product
      ) *
      quantity
    );

  }


  function renderSummary() {

    const products =
      getProducts();


    if (profileProducts) {

      profileProducts.textContent =
        products.length;

    }


    const categories =
      new Set(

        products

          .map(
            product =>
              product.category ||
              product.categoria ||
              ""
          )

          .filter(
            Boolean
          )

      );


    if (profileCategories) {

      profileCategories.textContent =
        categories.size;

    }


    const margins =
      products.map(
        getMargin
      );


    const average =
      margins.length

        ? margins.reduce(
            (
              sum,
              value
            ) =>
              sum +
              value,
            0
          ) /
          margins.length

        : 0;


    if (profileAverageMargin) {

      profileAverageMargin.textContent =
        `${average.toFixed(1)}%`;

    }


    const revenue =
      products.reduce(
        (
          sum,
          product
        ) =>
          sum +
          getRevenue(
            product
          ),
        0
      );


    if (profileRevenue) {

      profileRevenue.textContent =
        new Intl.NumberFormat(
          "pt-BR",
          {

            style:
              "currency",

            currency:
              "BRL"

          }
        ).format(
          revenue
        );

    }

  }


  /* =========================================================
     ESC
  ========================================================= */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Escape"
      ) {

        closeProfileModalFunction();

      }

    }
  );


  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  renderProfile();

  renderSummary();

});