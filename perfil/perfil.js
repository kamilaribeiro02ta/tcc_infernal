document.addEventListener("DOMContentLoaded", () => {

  const PROFILE_KEY =
    "zuz-profile";
  const SESSION_KEY =
    "zuz-session";
  const EVENTS_KEY =
    "zuz-company-events";
  const TASKS_KEY =
    "zuz-company-tasks";
  const NOTES_KEY =
    "zuz-company-notes";
  const TEAM_KEY =
    "zuz-company-team";

  let calendarCursor =
    new Date();

  let selectedTaskDate =
    "";

  let editingTaskId =
    "";

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

  const profileGreetingName =
    document.getElementById("profileGreetingName");

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

    if (profileGreetingName) {
      profileGreetingName.textContent =
        firstName(profile.name);
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
     CALENDÁRIO + GERENCIADOR DE TAREFAS
  ========================================================= */

  const TASK_STATUS = {
    todo: "A fazer",
    doing: "Em andamento",
    blocked: "Bloqueada",
    done: "Concluída"
  };

  const TASK_PRIORITY = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    urgent: "Urgente"
  };

  const PRIORITY_WEIGHT = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  function getCurrentActor() {
    const profile =
      getProfile();

    let session = {};

    try {
      session =
        JSON.parse(
          localStorage.getItem(
            SESSION_KEY
          )
        ) || {};
    }
    catch {
      session = {};
    }

    return {
      id:
        session.userId ||
        profile.id ||
        profile.email ||
        "local-user",
      name:
        profile.name ||
        "Usuário ZUZ",
      email:
        profile.email ||
        session.email ||
        ""
    };
  }

  function getTaskPeople() {
    const profile =
      getProfile();

    const owner = {
      id:
        profile.id ||
        profile.email ||
        "owner",
      name:
        profile.name ||
        "Usuário ZUZ",
      email:
        profile.email ||
        "",
      role:
        "Proprietário"
    };

    const members =
      readArray(
        TEAM_KEY
      )
        .map(
          member => ({
            id:
              member.id ||
              member.email,
            name:
              member.name ||
              member.email ||
              "Membro",
            email:
              member.email ||
              "",
            role:
              member.role ||
              "Equipe"
          })
        );

    const map =
      new Map();

    [owner, ...members]
      .forEach(
        person => {
          const key =
            String(
              person.email ||
              person.id
            )
              .toLowerCase();

          if (
            key &&
            !map.has(key)
          ) {
            map.set(
              key,
              person
            );
          }
        }
      );

    return [
      ...map.values()
    ];
  }

  function taskPersonKey(person) {
    return String(
      person?.email ||
      person?.id ||
      ""
    )
      .toLowerCase();
  }

  function normalizeTask(task) {
    return {
      id:
        task?.id ||
        `task_${Date.now().toString(36)}`,
      title:
        String(
          task?.title ||
          "Tarefa"
        ),
      assigneeId:
        task?.assigneeId ||
        task?.assigneeEmail ||
        "",
      assigneeName:
        task?.assigneeName ||
        "Sem responsável",
      assigneeEmail:
        task?.assigneeEmail ||
        "",
      dueDate:
        task?.dueDate ||
        task?.date ||
        localDateKey(
          new Date()
        ),
      priority:
        TASK_PRIORITY[
          task?.priority
        ]
          ? task.priority
          : "medium",
      status:
        TASK_STATUS[
          task?.status
        ]
          ? task.status
          : "todo",
      cost:
        Number(
          task?.cost ||
          0
        ),
      category:
        String(
          task?.category ||
          ""
        ),
      description:
        String(
          task?.description ||
          ""
        ),
      createdAt:
        task?.createdAt ||
        new Date().toISOString(),
      createdBy:
        task?.createdBy ||
        {
          id: "",
          name: "Sistema",
          email: ""
        },
      updatedAt:
        task?.updatedAt ||
        task?.createdAt ||
        new Date().toISOString(),
      updatedBy:
        task?.updatedBy ||
        task?.createdBy ||
        {
          id: "",
          name: "Sistema",
          email: ""
        },
      history:
        Array.isArray(
          task?.history
        )
          ? task.history
          : []
    };
  }

  function getCompanyTasks() {
    const saved =
      localStorage.getItem(
        TASKS_KEY
      );

    if (saved !== null) {
      try {
        const tasks =
          JSON.parse(
            saved
          );

        return Array.isArray(tasks)
          ? tasks.map(
              normalizeTask
            )
          : [];
      }
      catch {
        return [];
      }
    }

    const legacyEvents =
      readArray(
        EVENTS_KEY
      );

    if (!legacyEvents.length) {
      return [];
    }

    const actor =
      getCurrentActor();

    const migrated =
      legacyEvents.map(
        event => normalizeTask({
          id:
            event.id ||
            `task_${Date.now().toString(36)}`,
          title:
            event.title ||
            "Compromisso",
          dueDate:
            event.date,
          priority:
            "medium",
          status:
            "todo",
          assigneeId:
            actor.id,
          assigneeName:
            actor.name,
          assigneeEmail:
            actor.email,
          createdAt:
            new Date().toISOString(),
          createdBy:
            actor,
          updatedAt:
            new Date().toISOString(),
          updatedBy:
            actor,
          history: [
            {
              action:
                "Compromisso antigo convertido em tarefa",
              actorName:
                actor.name,
              actorEmail:
                actor.email,
              at:
                new Date().toISOString()
            }
          ]
        })
      );

    saveArray(
      TASKS_KEY,
      migrated
    );

    return migrated;
  }

  function saveCompanyTasks(tasks) {
    saveArray(
      TASKS_KEY,
      tasks.map(
        normalizeTask
      )
    );
  }

  function formatTaskDate(value) {
    const date =
      parseLocalDate(
        value
      );

    if (!date) {
      return "--";
    }

    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    ).format(
      date
    );
  }

  function formatTaskDateTime(value) {
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
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    ).format(
      date
    );
  }

  function formatTaskMoney(value) {
    const amount =
      Number(
        value ||
        0
      );

    if (!amount) {
      return "";
    }

    return new Intl.NumberFormat(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    ).format(
      amount
    );
  }

  function populateTaskPeopleOptions() {
    const people =
      getTaskPeople();

    const assignee =
      document.getElementById(
        "taskAssignee"
      );

    const filter =
      document.getElementById(
        "taskAssigneeFilter"
      );

    const currentAssignee =
      assignee?.value ||
      "";

    const currentFilter =
      filter?.value ||
      "";

    const options =
      people
        .map(
          person => {
            const value =
              taskPersonKey(
                person
              );

            return `<option value="${escapeHtml(value)}">${escapeHtml(person.name)} · ${escapeHtml(person.role)}</option>`;
          }
        )
        .join("");

    if (assignee) {
      assignee.innerHTML =
        options;

      if (
        currentAssignee &&
        people.some(
          person =>
            taskPersonKey(person) ===
            currentAssignee
        )
      ) {
        assignee.value =
          currentAssignee;
      }
    }

    if (filter) {
      filter.innerHTML =
        '<option value="">Toda a equipe</option>' +
        options;

      filter.value =
        people.some(
          person =>
            taskPersonKey(person) ===
            currentFilter
        )
          ? currentFilter
          : "";
    }
  }

  function tasksForMonth(
    tasks,
    year,
    month
  ) {
    return tasks.filter(
      task => {
        const date =
          parseLocalDate(
            task.dueDate
          );

        return (
          date &&
          date.getFullYear() ===
            year &&
          date.getMonth() ===
            month
        );
      }
    );
  }

  function filteredTasks() {
    const tasks =
      getCompanyTasks();

    const status =
      document.getElementById(
        "taskStatusFilter"
      )?.value || "";

    const priority =
      document.getElementById(
        "taskPriorityFilter"
      )?.value || "";

    const assignee =
      document.getElementById(
        "taskAssigneeFilter"
      )?.value || "";

    const year =
      calendarCursor.getFullYear();

    const month =
      calendarCursor.getMonth();

    return tasks
      .filter(
        task => {
          const date =
            parseLocalDate(
              task.dueDate
            );

          if (!date) {
            return false;
          }

          if (
            selectedTaskDate
          ) {
            if (
              task.dueDate !==
              selectedTaskDate
            ) {
              return false;
            }
          }
          else if (
            date.getFullYear() !==
              year ||
            date.getMonth() !==
              month
          ) {
            return false;
          }

          if (
            status &&
            task.status !==
              status
          ) {
            return false;
          }

          if (
            priority &&
            task.priority !==
              priority
          ) {
            return false;
          }

          if (
            assignee &&
            String(
              task.assigneeEmail ||
              task.assigneeId
            )
              .toLowerCase() !==
              assignee
          ) {
            return false;
          }

          return true;
        }
      )
      .sort(
        (a, b) => {
          const byDate =
            String(a.dueDate)
              .localeCompare(
                String(b.dueDate)
              );

          if (byDate) {
            return byDate;
          }

          return (
            (
              PRIORITY_WEIGHT[b.priority] ||
              0
            ) -
            (
              PRIORITY_WEIGHT[a.priority] ||
              0
            )
          );
        }
      );
  }

  function renderTaskList() {
    const list =
      document.getElementById(
        "taskList"
      );

    const title =
      document.getElementById(
        "taskListTitle"
      );

    const total =
      document.getElementById(
        "taskTotal"
      );

    const clearDate =
      document.getElementById(
        "clearTaskDateFilter"
      );

    if (
      !list ||
      !title ||
      !total
    ) {
      return;
    }

    const tasks =
      filteredTasks();

    total.textContent =
      String(
        tasks.length
      );

    if (selectedTaskDate) {
      title.textContent =
        `Tarefas de ${formatTaskDate(selectedTaskDate)}`;

      if (clearDate) {
        clearDate.hidden =
          false;
      }
    }
    else {
      title.textContent =
        "Tarefas do mês";

      if (clearDate) {
        clearDate.hidden =
          true;
      }
    }

    if (!tasks.length) {
      list.innerHTML =
        `
          <div class="task-empty">
            <i class="bx bx-check-square"></i>
            <strong>Nenhuma tarefa aqui.</strong>
            <span>Crie uma tarefa ou selecione outra data.</span>
          </div>
        `;

      return;
    }

    list.innerHTML =
      tasks
        .map(
          task => {
            const cost =
              formatTaskMoney(
                task.cost
              );

            const updatedName =
              task.updatedBy?.name ||
              "Usuário";

            return `
              <article class="task-item priority-${escapeHtml(task.priority)}" data-task-id="${escapeHtml(task.id)}">
                <button class="task-item-main" type="button" data-edit-task="${escapeHtml(task.id)}">
                  <div class="task-item-topline">
                    <span class="task-priority-pill priority-${escapeHtml(task.priority)}">${escapeHtml(TASK_PRIORITY[task.priority])}</span>
                    <span class="task-due">${escapeHtml(formatTaskDate(task.dueDate))}</span>
                  </div>

                  <strong class="task-item-title">${escapeHtml(task.title)}</strong>

                  <div class="task-item-meta">
                    <span><i class="bx bx-user"></i>${escapeHtml(task.assigneeName || "Sem responsável")}</span>
                    ${cost ? `<span><i class="bx bx-wallet"></i>${escapeHtml(cost)}</span>` : ""}
                    ${task.category ? `<span><i class="bx bx-tag"></i>${escapeHtml(task.category)}</span>` : ""}
                  </div>

                  <small>Editado por ${escapeHtml(updatedName)} · ${escapeHtml(formatTaskDateTime(task.updatedAt))}</small>
                </button>

                <div class="task-item-status">
                  <select data-quick-status="${escapeHtml(task.id)}" aria-label="Alterar status de ${escapeHtml(task.title)}">
                    ${Object.entries(TASK_STATUS).map(([value,label]) => `<option value="${value}" ${task.status === value ? "selected" : ""}>${label}</option>`).join("")}
                  </select>
                </div>
              </article>
            `;
          }
        )
        .join("");
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

    if (
      !grid ||
      !monthLabel
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

    const todayKey =
      localDateKey(
        new Date()
      );

    const monthTasks =
      tasksForMonth(
        getCompanyTasks(),
        year,
        month
      );

    const tasksByDate =
      new Map();

    monthTasks.forEach(
      task => {
        const items =
          tasksByDate.get(
            task.dueDate
          ) || [];

        items.push(
          task
        );

        tasksByDate.set(
          task.dueDate,
          items
        );
      }
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
      const key =
        localDateKey(
          new Date(
            year,
            month,
            day
          )
        );

      const tasks =
        tasksByDate.get(
          key
        ) || [];

      const classes = [
        "calendar-day"
      ];

      if (
        key ===
        todayKey
      ) {
        classes.push(
          "is-today"
        );
      }

      if (
        key ===
        selectedTaskDate
      ) {
        classes.push(
          "is-selected"
        );
      }

      if (
        tasks.length
      ) {
        classes.push(
          "has-event"
        );
      }

      const dots =
        tasks
          .slice(0, 3)
          .map(
            task =>
              `<i class="priority-dot priority-${escapeHtml(task.priority)}"></i>`
          )
          .join("");

      const extra =
        tasks.length > 3
          ? `<span class="calendar-more">+${tasks.length - 3}</span>`
          : "";

      cells.push(
        `
          <button class="${classes.join(" ")}" type="button" data-calendar-date="${key}" aria-label="${day}, ${tasks.length} tarefa(s)">
            <span class="calendar-day-number">${day}</span>
            <span class="calendar-task-dots">${dots}${extra}</span>
          </button>
        `
      );
    }

    grid.innerHTML =
      cells.join("");

    renderTaskList();
  }

  function renderTaskAudit(task) {
    const audit =
      document.getElementById(
        "taskAudit"
      );

    const summary =
      document.getElementById(
        "taskAuditSummary"
      );

    const history =
      document.getElementById(
        "taskHistoryList"
      );

    if (
      !audit ||
      !summary ||
      !history
    ) {
      return;
    }

    if (!task) {
      audit.hidden =
        true;
      summary.innerHTML =
        "";
      history.innerHTML =
        "";
      return;
    }

    audit.hidden =
      false;

    summary.innerHTML =
      `
        <div>
          <span>Criada por</span>
          <strong>${escapeHtml(task.createdBy?.name || "Usuário")}</strong>
          <small>${escapeHtml(formatTaskDateTime(task.createdAt))}</small>
        </div>
        <div>
          <span>Última edição</span>
          <strong>${escapeHtml(task.updatedBy?.name || "Usuário")}</strong>
          <small>${escapeHtml(formatTaskDateTime(task.updatedAt))}</small>
        </div>
      `;

    const items =
      Array.isArray(
        task.history
      )
        ? [
            ...task.history
          ].reverse()
        : [];

    history.innerHTML =
      items.length
        ? items
            .map(
              entry => `
                <div class="task-history-item">
                  <i class="bx bx-history"></i>
                  <div>
                    <strong>${escapeHtml(entry.action || "Tarefa alterada")}</strong>
                    <span>${escapeHtml(entry.actorName || "Usuário")} · ${escapeHtml(formatTaskDateTime(entry.at))}</span>
                  </div>
                </div>
              `
            )
            .join("")
        : '<div class="task-history-empty">Sem alterações anteriores.</div>';
  }

  function openTaskModal(
    taskId = "",
    presetDate = ""
  ) {
    const modal =
      document.getElementById(
        "taskModal"
      );

    const form =
      document.getElementById(
        "taskForm"
      );

    const title =
      document.getElementById(
        "taskModalTitle"
      );

    const subtitle =
      document.getElementById(
        "taskModalSubtitle"
      );

    const deleteButton =
      document.getElementById(
        "deleteTaskBtn"
      );

    const feedback =
      document.getElementById(
        "taskFormFeedback"
      );

    const tasks =
      getCompanyTasks();

    const task =
      tasks.find(
        item =>
          item.id ===
          taskId
      );

    const people =
      getTaskPeople();

    populateTaskPeopleOptions();

    editingTaskId =
      task?.id ||
      "";

    form?.reset();

    if (feedback) {
      feedback.textContent =
        "";
    }

    document.getElementById(
      "taskId"
    ).value =
      task?.id ||
      "";

    document.getElementById(
      "taskTitle"
    ).value =
      task?.title ||
      "";

    document.getElementById(
      "taskDueDate"
    ).value =
      task?.dueDate ||
      presetDate ||
      selectedTaskDate ||
      localDateKey(
        new Date()
      );

    document.getElementById(
      "taskPriority"
    ).value =
      task?.priority ||
      "medium";

    document.getElementById(
      "taskStatus"
    ).value =
      task?.status ||
      "todo";

    document.getElementById(
      "taskCost"
    ).value =
      task?.cost ||
      "";

    document.getElementById(
      "taskCategory"
    ).value =
      task?.category ||
      "";

    document.getElementById(
      "taskDescription"
    ).value =
      task?.description ||
      "";

    const assignee =
      document.getElementById(
        "taskAssignee"
      );

    if (assignee) {
      const actor =
        getCurrentActor();

      const wanted =
        task
          ? String(
              task.assigneeEmail ||
              task.assigneeId
            )
              .toLowerCase()
          : String(
              actor.email ||
              actor.id
            )
              .toLowerCase();

      if (
        [
          ...assignee.options
        ].some(
          option =>
            option.value ===
            wanted
        )
      ) {
        assignee.value =
          wanted;
      }
      else if (
        people.length
      ) {
        assignee.value =
          taskPersonKey(
            people[0]
          );
      }
    }

    if (title) {
      title.textContent =
        task
          ? "Editar tarefa"
          : "Nova tarefa";
    }

    if (subtitle) {
      subtitle.textContent =
        task
          ? "Atualize os dados. A alteração será registrada no histórico."
          : "Cadastre uma atividade e acompanhe quem é responsável por ela.";
    }

    if (deleteButton) {
      deleteButton.hidden =
        !task;
    }

    renderTaskAudit(
      task
    );

    modal?.classList.add(
      "active"
    );

    modal?.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow =
      "hidden";

    window.setTimeout(
      () =>
        document.getElementById(
          "taskTitle"
        )?.focus(),
      30
    );
  }

  function closeTaskModal() {
    const modal =
      document.getElementById(
        "taskModal"
      );

    modal?.classList.remove(
      "active"
    );

    modal?.setAttribute(
      "aria-hidden",
      "true"
    );

    editingTaskId =
      "";

    document.body.style.overflow =
      "";
  }

  function appendTaskHistory(
    task,
    action,
    actor
  ) {
    const history =
      Array.isArray(
        task.history
      )
        ? task.history
        : [];

    history.push({
      action,
      actorName:
        actor.name,
      actorEmail:
        actor.email,
      at:
        new Date().toISOString()
    });

    return history.slice(
      -40
    );
  }

  function initializeCalendar() {
    const previousButton =
      document.getElementById(
        "prevMonthBtn"
      );

    const nextButton =
      document.getElementById(
        "nextMonthBtn"
      );

    const newTaskButton =
      document.getElementById(
        "newTaskBtn"
      );

    const calendar =
      document.getElementById(
        "companyCalendar"
      );

    const list =
      document.getElementById(
        "taskList"
      );

    const clearDate =
      document.getElementById(
        "clearTaskDateFilter"
      );

    const filters = [
      document.getElementById(
        "taskStatusFilter"
      ),
      document.getElementById(
        "taskPriorityFilter"
      ),
      document.getElementById(
        "taskAssigneeFilter"
      )
    ];

    const modal =
      document.getElementById(
        "taskModal"
      );

    const closeButton =
      document.getElementById(
        "closeTaskModal"
      );

    const cancelButton =
      document.getElementById(
        "cancelTaskBtn"
      );

    const deleteButton =
      document.getElementById(
        "deleteTaskBtn"
      );

    const form =
      document.getElementById(
        "taskForm"
      );

    populateTaskPeopleOptions();

    previousButton?.addEventListener(
      "click",
      () => {
        calendarCursor =
          new Date(
            calendarCursor.getFullYear(),
            calendarCursor.getMonth() - 1,
            1
          );

        selectedTaskDate =
          "";

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

        selectedTaskDate =
          "";

        renderCalendar();
      }
    );

    newTaskButton?.addEventListener(
      "click",
      () => {
        let date =
          selectedTaskDate;

        if (!date) {
          const now =
            new Date();

          const isCurrentMonth =
            now.getFullYear() ===
              calendarCursor.getFullYear() &&
            now.getMonth() ===
              calendarCursor.getMonth();

          date =
            isCurrentMonth
              ? localDateKey(
                  now
                )
              : localDateKey(
                  new Date(
                    calendarCursor.getFullYear(),
                    calendarCursor.getMonth(),
                    1
                  )
                );
        }

        openTaskModal(
          "",
          date
        );
      }
    );

    calendar?.addEventListener(
      "click",
      event => {
        const day =
          event.target.closest(
            "[data-calendar-date]"
          );

        if (!day) {
          return;
        }

        const date =
          day.dataset.calendarDate;

        selectedTaskDate =
          selectedTaskDate ===
            date
            ? ""
            : date;

        renderCalendar();
      }
    );

    list?.addEventListener(
      "click",
      event => {
        const button =
          event.target.closest(
            "[data-edit-task]"
          );

        if (!button) {
          return;
        }

        openTaskModal(
          button.dataset.editTask
        );
      }
    );

    list?.addEventListener(
      "change",
      event => {
        const select =
          event.target.closest(
            "[data-quick-status]"
          );

        if (!select) {
          return;
        }

        const tasks =
          getCompanyTasks();

        const index =
          tasks.findIndex(
            task =>
              task.id ===
              select.dataset.quickStatus
          );

        if (index < 0) {
          return;
        }

        const actor =
          getCurrentActor();

        const task =
          tasks[index];

        const oldStatus =
          task.status;

        task.status =
          select.value;

        task.updatedAt =
          new Date().toISOString();

        task.updatedBy =
          actor;

        task.history =
          appendTaskHistory(
            task,
            `Status alterado de ${TASK_STATUS[oldStatus]} para ${TASK_STATUS[task.status]}`,
            actor
          );

        tasks[index] =
          normalizeTask(
            task
          );

        saveCompanyTasks(
          tasks
        );

        renderCalendar();
      }
    );

    clearDate?.addEventListener(
      "click",
      () => {
        selectedTaskDate =
          "";

        renderCalendar();
      }
    );

    filters.forEach(
      filter =>
        filter?.addEventListener(
          "change",
          renderTaskList
        )
    );

    closeButton?.addEventListener(
      "click",
      closeTaskModal
    );

    cancelButton?.addEventListener(
      "click",
      closeTaskModal
    );

    modal?.addEventListener(
      "click",
      event => {
        if (
          event.target ===
          modal
        ) {
          closeTaskModal();
        }
      }
    );

    form?.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        const title =
          document.getElementById(
            "taskTitle"
          )?.value.trim();

        const dueDate =
          document.getElementById(
            "taskDueDate"
          )?.value;

        const assigneeKey =
          document.getElementById(
            "taskAssignee"
          )?.value;

        const feedback =
          document.getElementById(
            "taskFormFeedback"
          );

        if (
          !title ||
          !dueDate ||
          !assigneeKey
        ) {
          if (feedback) {
            feedback.textContent =
              "Preencha nome, responsável e data de entrega.";
          }
          return;
        }

        const people =
          getTaskPeople();

        const person =
          people.find(
            item =>
              taskPersonKey(
                item
              ) ===
              assigneeKey
          );

        if (!person) {
          if (feedback) {
            feedback.textContent =
              "Selecione um responsável válido.";
          }
          return;
        }

        const tasks =
          getCompanyTasks();

        const actor =
          getCurrentActor();

        const now =
          new Date().toISOString();

        const existingIndex =
          tasks.findIndex(
            task =>
              task.id ===
              editingTaskId
          );

        if (
          existingIndex >= 0
        ) {
          const existing =
            tasks[
              existingIndex
            ];

          const previousStatus =
            existing.status;

          const updated = {
            ...existing,
            title,
            assigneeId:
              person.id,
            assigneeName:
              person.name,
            assigneeEmail:
              person.email,
            dueDate,
            priority:
              document.getElementById(
                "taskPriority"
              ).value,
            status:
              document.getElementById(
                "taskStatus"
              ).value,
            cost:
              Number(
                document.getElementById(
                  "taskCost"
                ).value ||
                0
              ),
            category:
              document.getElementById(
                "taskCategory"
              ).value.trim(),
            description:
              document.getElementById(
                "taskDescription"
              ).value.trim(),
            updatedAt:
              now,
            updatedBy:
              actor
          };

          const statusChanged =
            previousStatus !==
            updated.status;

          updated.history =
            appendTaskHistory(
              updated,
              statusChanged
                ? `Tarefa editada · status: ${TASK_STATUS[updated.status]}`
                : "Tarefa editada",
              actor
            );

          tasks[
            existingIndex
          ] =
            normalizeTask(
              updated
            );
        }
        else {
          const task = normalizeTask({
            id:
              `task_${Date.now().toString(36)}`,
            title,
            assigneeId:
              person.id,
            assigneeName:
              person.name,
            assigneeEmail:
              person.email,
            dueDate,
            priority:
              document.getElementById(
                "taskPriority"
              ).value,
            status:
              document.getElementById(
                "taskStatus"
              ).value,
            cost:
              Number(
                document.getElementById(
                  "taskCost"
                ).value ||
                0
              ),
            category:
              document.getElementById(
                "taskCategory"
              ).value.trim(),
            description:
              document.getElementById(
                "taskDescription"
              ).value.trim(),
            createdAt:
              now,
            createdBy:
              actor,
            updatedAt:
              now,
            updatedBy:
              actor,
            history: [
              {
                action:
                  "Tarefa criada",
                actorName:
                  actor.name,
                actorEmail:
                  actor.email,
                at:
                  now
              }
            ]
          });

          tasks.push(
            task
          );
        }

        saveCompanyTasks(
          tasks
        );

        const parsed =
          parseLocalDate(
            dueDate
          );

        if (parsed) {
          calendarCursor =
            new Date(
              parsed.getFullYear(),
              parsed.getMonth(),
              1
            );
        }

        selectedTaskDate =
          dueDate;

        closeTaskModal();

        renderCalendar();
      }
    );

    deleteButton?.addEventListener(
      "click",
      () => {
        if (!editingTaskId) {
          return;
        }

        const tasks =
          getCompanyTasks();

        const task =
          tasks.find(
            item =>
              item.id ===
              editingTaskId
          );

        if (!task) {
          return;
        }

        const confirmed =
          window.confirm(
            `Excluir a tarefa "${task.title}"?`
          );

        if (!confirmed) {
          return;
        }

        saveCompanyTasks(
          tasks.filter(
            item =>
              item.id !==
              editingTaskId
          )
        );

        closeTaskModal();

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