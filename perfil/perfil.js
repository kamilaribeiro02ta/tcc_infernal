document.addEventListener("DOMContentLoaded", () => {

  const PROFILE_KEY =
    "zuz-profile";
  const SESSION_KEY =
    "zuz-session";
  const EVENTS_KEY =
    "zuz-company-events";
  const NOTES_KEY =
    "zuz-company-notes";
  const TEAM_KEY =
    "zuz-company-team";

  let calendarCursor =
    new Date();

  const logoutBtn =
    document.getElementById("logoutBtn");

  function hasLocalSession() {
    try {
      const session =
        JSON.parse(
          localStorage.getItem(
            SESSION_KEY
          )
        );

      if (session?.email) {
        return true;
      }

      const explicitLogout =
        localStorage.getItem(
          "zuz-explicit-logout"
        ) === "true";

      const savedProfile =
        JSON.parse(
          localStorage.getItem(
            PROFILE_KEY
          )
        );

      if (
        !explicitLogout &&
        savedProfile?.email
      ) {
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            userId:
              savedProfile.id ||
              "legacy-user",
            email:
              savedProfile.email,
            loggedInAt:
              new Date().toISOString()
          })
        );

        localStorage.setItem(
          "zuz-logged-in",
          "true"
        );

        return true;
      }

      return false;
    }
    catch {
      return false;
    }
  }

  if (!hasLocalSession()) {
    window.location.replace(
      "../Login/login.html"
    );

    return;
  }

  logoutBtn?.addEventListener(
    "click",
    () => {
      localStorage.removeItem(
        SESSION_KEY
      );

      localStorage.removeItem(
        "zuz-logged-in"
      );

      localStorage.setItem(
        "zuz-explicit-logout",
        "true"
      );

      window.location.replace(
        "../Login/login.html"
      );
    }
  );


  /* =========================================================
     ELEMENTOS
  ========================================================= */

  const profileName =
    document.getElementById("profileName");

  const profileEmail =
    document.getElementById("profileEmail");

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

  const editProfileBtnAccount =
    document.getElementById("editProfileBtnAccount");

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

    if (profileEmail) {

      profileEmail.textContent =
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


  editProfileBtnAccount?.addEventListener(
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
     CENTRAL DA EMPRESA
  ========================================================= */

  function parseLocalDate(value) {
    if (!value) return null;

    const parts =
      String(value)
        .split("-")
        .map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
      return null;
    }

    return new Date(
      parts[0],
      parts[1] - 1,
      parts[2],
      12
    );
  }

  function localDateKey(date) {
    const year =
      date.getFullYear();

    const month =
      String(date.getMonth() + 1)
        .padStart(2, "0");

    const day =
      String(date.getDate())
        .padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function readArray(key) {
    try {
      const value =
        JSON.parse(
          localStorage.getItem(key)
        );

      return Array.isArray(value)
        ? value
        : [];
    }
    catch {
      return [];
    }
  }

  function saveArray(
    key,
    value
  ) {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function productName(
    product,
    index
  ) {
    return (
      product?.name ||
      product?.nome ||
      product?.productName ||
      product?.titulo ||
      `Produto ${index + 1}`
    );
  }

  /* =========================================================
     GRÁFICO REAL DE MARGEM
  ========================================================= */

  function renderBusinessChart() {
    const products =
      getProducts()
        .slice(0, 7);

    const line =
      document.getElementById(
        "profileChartLinePath"
      );

    const area =
      document.getElementById(
        "profileChartAreaPath"
      );

    const labels =
      document.getElementById(
        "profileChartLabels"
      );

    const chart =
      document.getElementById(
        "businessOverviewChart"
      );

    const circles =
      Array.from(
        document.querySelectorAll(
          ".overview-chart-svg circle"
        )
      );

    if (
      !line ||
      !area ||
      !labels
    ) {
      return;
    }

    if (!products.length) {
      line.setAttribute(
        "d",
        "M10 230 L690 230"
      );

      area.setAttribute(
        "d",
        "M10 230 L690 230 L690 250 L10 250 Z"
      );

      labels.innerHTML =
        "<span>Sem produtos</span>";

      circles.forEach(
        circle => {
          circle.style.display =
            "none";
        }
      );

      chart?.setAttribute(
        "aria-label",
        "Ainda não há produtos cadastrados para montar o gráfico de margem."
      );

      return;
    }

    const values =
      products.map(
        product =>
          Math.max(
            0,
            Math.min(
              100,
              getMargin(product)
            )
          )
      );

    const width =
      680;

    const startX =
      10;

    const topY =
      28;

    const bottomY =
      230;

    const points =
      values.map(
        (value, index) => {

          const x =
            values.length === 1
              ? 350
              : startX +
                (
                  width *
                  index /
                  (values.length - 1)
                );

          const y =
            bottomY -
            (
              value /
              100
            ) *
            (
              bottomY -
              topY
            );

          return {
            x,
            y,
            value
          };

        }
      );

    const linePath =
      points
        .map(
          (point, index) =>
            `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`
        )
        .join(" ");

    const areaPath =
      `${linePath} L${points.at(-1).x.toFixed(1)} 250 L${points[0].x.toFixed(1)} 250 Z`;

    line.setAttribute(
      "d",
      linePath
    );

    area.setAttribute(
      "d",
      areaPath
    );

    labels.innerHTML =
      products
        .map(
          (product, index) => {
            const name =
              productName(
                product,
                index
              );

            const short =
              name.length > 9
                ? `${name.slice(0, 8)}…`
                : name;

            return `<span title="${escapeHtml(name)}">${escapeHtml(short)}</span>`;
          }
        )
        .join("");

    circles.forEach(
      (circle, index) => {

        const point =
          points[index];

        if (!point) {
          circle.style.display =
            "none";

          return;
        }

        circle.style.display =
          "";

        circle.setAttribute(
          "cx",
          point.x
        );

        circle.setAttribute(
          "cy",
          point.y
        );

      }
    );

    const accessibleSummary =
      products
        .map(
          (product, index) =>
            `${productName(product, index)}: ${values[index].toFixed(1)}% de margem`
        )
        .join("; ");

    chart?.setAttribute(
      "aria-label",
      accessibleSummary
    );
  }

  /* =========================================================
     CALENDÁRIO
  ========================================================= */

  function getCompanyEvents() {
    return readArray(
      EVENTS_KEY
    );
  }

  function renderCalendar() {
    const grid =
      document.getElementById(
        "companyCalendar"
      );

    const monthLabel =
      document.getElementById(
        "calendarMonthLabel"
      );

    const upcoming =
      document.getElementById(
        "upcomingEvents"
      );

    if (
      !grid ||
      !monthLabel ||
      !upcoming
    ) {
      return;
    }

    const year =
      calendarCursor.getFullYear();

    const month =
      calendarCursor.getMonth();

    monthLabel.textContent =
      new Intl.DateTimeFormat(
        "pt-BR",
        {
          month: "long",
          year: "numeric"
        }
      )
        .format(
          new Date(
            year,
            month,
            1
          )
        )
        .replace(
          /^./,
          letter =>
            letter.toUpperCase()
        );

    const firstWeekday =
      new Date(
        year,
        month,
        1
      )
        .getDay();

    const lastDay =
      new Date(
        year,
        month + 1,
        0
      )
        .getDate();

    const today =
      new Date();

    const todayKey =
      localDateKey(
        today
      );

    const events =
      getCompanyEvents();

    const eventDates =
      new Set(
        events.map(
          event =>
            event.date
        )
      );

    const cells =
      [];

    for (
      let index = 0;
      index < firstWeekday;
      index += 1
    ) {
      cells.push(
        '<span class="calendar-day is-empty" aria-hidden="true"></span>'
      );
    }

    for (
      let day = 1;
      day <= lastDay;
      day += 1
    ) {
      const date =
        new Date(
          year,
          month,
          day
        );

      const key =
        localDateKey(
          date
        );

      const classes = [
        "calendar-day"
      ];

      if (
        key === todayKey
      ) {
        classes.push(
          "is-today"
        );
      }

      if (
        eventDates.has(
          key
        )
      ) {
        classes.push(
          "has-event"
        );
      }

      cells.push(
        `<button class="${classes.join(" ")}" type="button" data-calendar-date="${key}" aria-label="${day}">${day}</button>`
      );
    }

    grid.innerHTML =
      cells.join("");

    const todayStart =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

    const futureEvents =
      events
        .map(
          event => ({
            ...event,
            parsedDate:
              parseLocalDate(
                event.date
              )
          })
        )
        .filter(
          event =>
            event.parsedDate &&
            event.parsedDate >=
              todayStart
        )
        .sort(
          (a, b) =>
            a.parsedDate -
            b.parsedDate
        )
        .slice(
          0,
          5
        );

    if (
      !futureEvents.length
    ) {
      upcoming.innerHTML =
        '<div class="hub-empty"><i class="bx bx-calendar-check"></i><span>Nenhum compromisso futuro.</span></div>';

      return;
    }

    upcoming.innerHTML =
      futureEvents
        .map(
          event => {

            const dateText =
              new Intl.DateTimeFormat(
                "pt-BR",
                {
                  day: "2-digit",
                  month: "short"
                }
              )
                .format(
                  event.parsedDate
                );

            return `
              <div class="event-item">
                <div class="event-date">${escapeHtml(dateText)}</div>
                <div class="event-copy">
                  <strong>${escapeHtml(event.title)}</strong>
                  <span>Compromisso da empresa</span>
                </div>
                <button type="button" data-remove-event="${escapeHtml(event.id)}" aria-label="Remover compromisso">
                  <i class="bx bx-x"></i>
                </button>
              </div>
            `;
          }
        )
        .join("");
  }

  function initializeCalendar() {
    const titleInput =
      document.getElementById(
        "eventTitleInput"
      );

    const dateInput =
      document.getElementById(
        "eventDateInput"
      );

    const addButton =
      document.getElementById(
        "addEventBtn"
      );

    const previousButton =
      document.getElementById(
        "prevMonthBtn"
      );

    const nextButton =
      document.getElementById(
        "nextMonthBtn"
      );

    const upcoming =
      document.getElementById(
        "upcomingEvents"
      );

    if (dateInput) {
      dateInput.value =
        localDateKey(
          new Date()
        );
    }

    addButton?.addEventListener(
      "click",
      () => {

        const title =
          titleInput
            ?.value
            .trim();

        const date =
          dateInput
            ?.value;

        if (
          !title ||
          !date
        ) {
          titleInput?.focus();
          return;
        }

        const events =
          getCompanyEvents();

        events.push({
          id:
            `evt_${Date.now().toString(36)}`,
          title,
          date
        });

        saveArray(
          EVENTS_KEY,
          events
        );

        const parsed =
          parseLocalDate(
            date
          );

        if (parsed) {
          calendarCursor =
            new Date(
              parsed.getFullYear(),
              parsed.getMonth(),
              1
            );
        }

        if (titleInput) {
          titleInput.value =
            "";
        }

        renderCalendar();

      }
    );

    previousButton?.addEventListener(
      "click",
      () => {

        calendarCursor =
          new Date(
            calendarCursor.getFullYear(),
            calendarCursor.getMonth() - 1,
            1
          );

        renderCalendar();

      }
    );

    nextButton?.addEventListener(
      "click",
      () => {

        calendarCursor =
          new Date(
            calendarCursor.getFullYear(),
            calendarCursor.getMonth() + 1,
            1
          );

        renderCalendar();

      }
    );

    upcoming?.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            "[data-remove-event]"
          );

        if (!button) {
          return;
        }

        const id =
          button.dataset.removeEvent;

        const events =
          getCompanyEvents()
            .filter(
              item =>
                item.id !== id
            );

        saveArray(
          EVENTS_KEY,
          events
        );

        renderCalendar();

      }
    );

    renderCalendar();
  }

  /* =========================================================
     NOTAS
  ========================================================= */

  function initializeNotes() {
    const notes =
      document.getElementById(
        "companyNotes"
      );

    const status =
      document.getElementById(
        "notesSaveStatus"
      );

    if (!notes) {
      return;
    }

    notes.value =
      localStorage.getItem(
        NOTES_KEY
      ) || "";

    let timer;

    notes.addEventListener(
      "input",
      () => {

        if (status) {
          status.textContent =
            "Salvando...";
        }

        window.clearTimeout(
          timer
        );

        timer =
          window.setTimeout(
            () => {

              localStorage.setItem(
                NOTES_KEY,
                notes.value
              );

              if (status) {
                status.textContent =
                  "Salvo";
              }

            },
            380
          );

      }
    );
  }

  /* =========================================================
     AVISOS INTELIGENTES
  ========================================================= */

  function renderBusinessAlerts() {
    const container =
      document.getElementById(
        "businessAlerts"
      );

    if (!container) {
      return;
    }

    const products =
      getProducts();

    const alerts =
      [];

    if (!products.length) {
      alerts.push({
        type: "attention",
        icon: "bx-package",
        title: "Cadastre seu primeiro produto",
        text: "Sem produtos cadastrados, a ZUZ ainda não consegue analisar sua empresa."
      });
    }
    else {
      const lowMargin =
        products.filter(
          product =>
            getMargin(product) <
            20
        ).length;

      const noCategory =
        products.filter(
          product =>
            !(
              product.category ||
              product.categoria
            )
        ).length;

      const riskyPrice =
        products.filter(
          product => {
            const price =
              getPrice(product);

            const cost =
              getCost(product);

            return (
              price > 0 &&
              cost >= price
            );
          }
        ).length;

      if (riskyPrice) {
        alerts.push({
          type: "danger",
          icon: "bx-error-circle",
          title:
            `${riskyPrice} ${riskyPrice === 1 ? "produto precisa" : "produtos precisam"} de revisão`,
          text: "O custo está igual ou acima do preço de venda."
        });
      }

      if (lowMargin) {
        alerts.push({
          type: "attention",
          icon: "bx-trending-down",
          title:
            `${lowMargin} ${lowMargin === 1 ? "produto está" : "produtos estão"} com margem abaixo de 20%`,
          text: "Vale revisar custo, preço ou quantidade vendida."
        });
      }

      if (noCategory) {
        alerts.push({
          type: "neutral",
          icon: "bx-category",
          title:
            `${noCategory} ${noCategory === 1 ? "produto está" : "produtos estão"} sem categoria`,
          text: "Organizar categorias melhora filtros e análises."
        });
      }

      if (!alerts.length) {
        alerts.push({
          type: "success",
          icon: "bx-check-circle",
          title: "Indicadores organizados",
          text: "Não encontramos alertas básicos nos produtos cadastrados."
        });
      }
    }

    container.innerHTML =
      alerts
        .slice(
          0,
          4
        )
        .map(
          alert => `
            <div class="business-alert ${alert.type}">
              <div class="business-alert-icon"><i class="bx ${alert.icon}"></i></div>
              <div>
                <strong>${escapeHtml(alert.title)}</strong>
                <span>${escapeHtml(alert.text)}</span>
              </div>
            </div>
          `
        )
        .join("");
  }

  /* =========================================================
     EQUIPE
  ========================================================= */

  function getRegisteredEmails() {
    try {
      const users =
        JSON.parse(
          localStorage.getItem(
            "zuz-users"
          )
        );

      return new Set(
        (
          Array.isArray(users)
            ? users
            : []
        )
          .map(
            user =>
              String(
                user?.email || ""
              )
                .toLowerCase()
          )
          .filter(Boolean)
      );
    }
    catch {
      return new Set();
    }
  }

  function initials(value) {
    return String(value || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        part =>
          part[0] || ""
      )
      .join("")
      .toUpperCase();
  }

  function renderTeam() {
    const container =
      document.getElementById(
        "teamMembers"
      );

    const count =
      document.getElementById(
        "teamCount"
      );

    if (!container) {
      return;
    }

    const profile =
      getProfile();

    const members =
      readArray(
        TEAM_KEY
      );

    const registered =
      getRegisteredEmails();

    const owner = {
      id: "owner",
      name: profile.name,
      email: profile.email,
      role: "Proprietário",
      owner: true
    };

    const allMembers = [
      owner,
      ...members
    ];

    if (count) {
      count.textContent =
        `${allMembers.length} ${allMembers.length === 1 ? "pessoa" : "pessoas"}`;
    }

    container.innerHTML =
      allMembers
        .map(
          member => {

            const email =
              String(
                member.email || ""
              );

            const status =
              member.owner
                ? "Conta principal"
                : registered.has(
                    email.toLowerCase()
                  )
                  ? "Conta ZUZ"
                  : "Convite local";

            return `
              <div class="team-member">
                <div class="team-avatar">${escapeHtml(initials(member.name))}</div>
                <div class="team-member-copy">
                  <strong>${escapeHtml(member.name)}</strong>
                  <span>${escapeHtml(email)}</span>
                </div>
                <div class="team-member-meta">
                  <span class="member-role">${escapeHtml(member.role)}</span>
                  <small>${escapeHtml(status)}</small>
                </div>
                ${member.owner ? "" : `
                  <button type="button" class="team-remove" data-remove-member="${escapeHtml(member.id)}" aria-label="Remover membro">
                    <i class="bx bx-x"></i>
                  </button>
                `}
              </div>
            `;
          }
        )
        .join("");
  }

  function initializeTeam() {
    const form =
      document.getElementById(
        "teamAddForm"
      );

    const nameInput =
      document.getElementById(
        "teamMemberName"
      );

    const emailInput =
      document.getElementById(
        "teamMemberEmail"
      );

    const roleInput =
      document.getElementById(
        "teamMemberRole"
      );

    const container =
      document.getElementById(
        "teamMembers"
      );

    form?.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        const name =
          nameInput
            ?.value
            .trim();

        const email =
          emailInput
            ?.value
            .trim()
            .toLowerCase();

        const role =
          roleInput
            ?.value ||
          "Visualização";

        if (
          !name ||
          !email
        ) {
          return;
        }

        const profile =
          getProfile();

        const members =
          readArray(
            TEAM_KEY
          );

        const exists =
          String(
            profile.email || ""
          )
            .toLowerCase() ===
            email ||
          members.some(
            member =>
              String(
                member.email || ""
              )
                .toLowerCase() ===
              email
          );

        if (exists) {
          emailInput.setCustomValidity(
            "Este email já está na equipe."
          );

          emailInput.reportValidity();

          return;
        }

        emailInput.setCustomValidity(
          ""
        );

        members.push({
          id:
            `team_${Date.now().toString(36)}`,
          name,
          email,
          role
        });

        saveArray(
          TEAM_KEY,
          members
        );

        form.reset();

        renderTeam();

      }
    );

    emailInput?.addEventListener(
      "input",
      () =>
        emailInput.setCustomValidity("")
    );

    container?.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            "[data-remove-member]"
          );

        if (!button) {
          return;
        }

        const id =
          button.dataset.removeMember;

        saveArray(
          TEAM_KEY,
          readArray(
            TEAM_KEY
          )
            .filter(
              member =>
                member.id !== id
            )
        );

        renderTeam();

      }
    );

    renderTeam();
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
  renderBusinessChart();
  renderBusinessAlerts();
  initializeCalendar();
  initializeNotes();
  initializeTeam();

});