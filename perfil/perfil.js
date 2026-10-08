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
  const BUSINESS_OWNER_KEY =
    "zuz-company-owner";

  let calendarCursor =
    new Date();

  let selectedTaskDate =
    "";

  let editingTaskId =
    "";

  let taskChecklistDraft =
    [];

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
        closeTaskModal();
        closeDayDrawer();

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

  const TASK_COLOR = {
    purple: "Roxo",
    blue: "Azul",
    green: "Verde",
    amber: "Amarelo",
    coral: "Coral",
    gray: "Cinza"
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

  function getCompanyOwner() {
    try {
      const saved =
        JSON.parse(
          localStorage.getItem(
            BUSINESS_OWNER_KEY
          )
        );

      if (
        saved?.email
      ) {
        return saved;
      }
    }
    catch {
      /* usa o perfil atual */
    }

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

    localStorage.setItem(
      BUSINESS_OWNER_KEY,
      JSON.stringify(
        owner
      )
    );

    return owner;
  }

  function getTaskPeople() {
    const owner =
      getCompanyOwner();

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

    const actor =
      getCurrentActor();

    const currentPerson = {
      id:
        actor.id,
      name:
        actor.name,
      email:
        actor.email,
      role:
        "Equipe"
    };

    const map =
      new Map();

    [owner, ...members, currentPerson]
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
      startTime:
        String(
          task?.startTime ||
          ""
        ),
      endTime:
        String(
          task?.endTime ||
          ""
        ),
      color:
        TASK_COLOR[
          task?.color
        ]
          ? task.color
          : "purple",
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
      checklist:
        Array.isArray(
          task?.checklist
        )
          ? task.checklist.map(
              item => ({
                id:
                  item?.id ||
                  `check_${Date.now().toString(36)}`,
                text:
                  String(
                    item?.text ||
                    ""
                  ),
                done:
                  Boolean(
                    item?.done
                  )
              })
            )
          : [],
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

  function taskTimeLabel(task) {
    const start =
      String(
        task?.startTime ||
        ""
      );

    const end =
      String(
        task?.endTime ||
        ""
      );

    if (
      start &&
      end
    ) {
      return `${start}–${end}`;
    }

    return (
      start ||
      end ||
      ""
    );
  }

  function checklistProgress(task) {
    const items =
      Array.isArray(
        task?.checklist
      )
        ? task.checklist
        : [];

    const done =
      items.filter(
        item =>
          item.done
      ).length;

    return {
      done,
      total:
        items.length,
      percent:
        items.length
          ? Math.round(
              done /
              items.length *
              100
            )
          : 0
    };
  }

  function renderChecklistDraft() {
    const container =
      document.getElementById(
        "taskChecklistItems"
      );

    const progress =
      document.getElementById(
        "taskChecklistProgress"
      );

    if (
      !container ||
      !progress
    ) {
      return;
    }

    const done =
      taskChecklistDraft.filter(
        item =>
          item.done
      ).length;

    progress.textContent =
      `${done}/${taskChecklistDraft.length} concluídas`;

    if (
      !taskChecklistDraft.length
    ) {
      container.innerHTML =
        '<div class="task-checklist-empty">Nenhuma etapa adicionada.</div>';
      return;
    }

    container.innerHTML =
      taskChecklistDraft
        .map(
          item => `
            <div class="task-checklist-row" data-checklist-id="${escapeHtml(item.id)}">
              <label>
                <input type="checkbox" data-checklist-toggle="${escapeHtml(item.id)}" ${item.done ? "checked" : ""}>
                <span>${escapeHtml(item.text)}</span>
              </label>
              <button type="button" data-checklist-remove="${escapeHtml(item.id)}" aria-label="Remover etapa">
                <i class="bx bx-x"></i>
              </button>
            </div>
          `
        )
        .join("");
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

  function taskDayDistance(task) {
    const due =
      parseLocalDate(
        task?.dueDate
      );

    if (!due) {
      return null;
    }

    const today =
      parseLocalDate(
        localDateKey(
          new Date()
        )
      );

    return Math.round(
      (
        due.getTime() -
        today.getTime()
      ) /
      86400000
    );
  }

  function deadlineLabel(task) {
    const distance =
      taskDayDistance(
        task
      );

    if (distance === null) {
      return "Sem data";
    }

    if (distance < 0) {
      return `${Math.abs(distance)} dia${Math.abs(distance) === 1 ? "" : "s"} atrasada`;
    }

    if (distance === 0) {
      return "Hoje";
    }

    if (distance === 1) {
      return "Amanhã";
    }

    if (distance <= 7) {
      return `Em ${distance} dias`;
    }

    return formatTaskDate(
      task.dueDate
    );
  }

  function filteredTasks() {
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

    return getCompanyTasks()
      .filter(
        task => {
          const distance =
            taskDayDistance(
              task
            );

          if (distance === null) {
            return false;
          }

          if (
            distance > 14
          ) {
            return false;
          }

          if (
            !status &&
            task.status ===
              "done"
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

  function renderDeadlineSummary() {
    const container =
      document.getElementById(
        "deadlineSummary"
      );

    if (!container) {
      return;
    }

    const active =
      getCompanyTasks()
        .filter(
          task =>
            task.status !==
              "done" &&
            taskDayDistance(task) !==
              null
        );

    const overdue =
      active.filter(
        task =>
          taskDayDistance(task) <
          0
      ).length;

    const today =
      active.filter(
        task =>
          taskDayDistance(task) ===
          0
      ).length;

    const soon =
      active.filter(
        task => {
          const distance =
            taskDayDistance(
              task
            );

          return (
            distance !==
              null &&
            distance > 0 &&
            distance <= 7
          );
        }
      ).length;

    container.innerHTML =
      `
        <div class="deadline-summary-item ${overdue ? "is-alert" : ""}">
          <span>Atrasadas</span>
          <strong>${overdue}</strong>
        </div>
        <div class="deadline-summary-item ${today ? "is-today" : ""}">
          <span>Hoje</span>
          <strong>${today}</strong>
        </div>
        <div class="deadline-summary-item">
          <span>Próximos 7 dias</span>
          <strong>${soon}</strong>
        </div>
      `;
  }

  function taskCardMarkup(
    task,
    {
      editAttribute =
        "data-edit-task",
      statusAttribute =
        "data-quick-status"
    } = {}
  ) {
    const cost =
      formatTaskMoney(
        task.cost
      );

    const updatedName =
      task.updatedBy?.name ||
      "Usuário";

    const progress =
      checklistProgress(
        task
      );

    const time =
      taskTimeLabel(
        task
      );

    const distance =
      taskDayDistance(
        task
      );

    const deadlineClass =
      distance !== null &&
      distance < 0 &&
      task.status !==
        "done"
        ? " is-overdue"
        : distance === 0 &&
          task.status !==
            "done"
          ? " is-due-today"
          : "";

    return `
      <article class="task-item color-${escapeHtml(task.color)} priority-${escapeHtml(task.priority)} status-${escapeHtml(task.status)}${deadlineClass}" data-task-id="${escapeHtml(task.id)}">
        <button class="task-item-main" type="button" ${editAttribute}="${escapeHtml(task.id)}">
          <div class="task-item-topline">
            <span class="task-color-chip color-${escapeHtml(task.color)}"></span>
            <span class="task-priority-pill priority-${escapeHtml(task.priority)}">${escapeHtml(TASK_PRIORITY[task.priority])}</span>
            <span class="task-due">${escapeHtml(deadlineLabel(task))}${time ? ` · ${escapeHtml(time)}` : ""}</span>
          </div>

          <strong class="task-item-title">${escapeHtml(task.title)}</strong>

          ${task.description ? `<p class="task-item-description">${escapeHtml(task.description)}</p>` : ""}

          <div class="task-item-meta">
            <span><i class="bx bx-user"></i>${escapeHtml(task.assigneeName || "Sem responsável")}</span>
            ${cost ? `<span><i class="bx bx-wallet"></i>${escapeHtml(cost)}</span>` : ""}
            ${task.category ? `<span><i class="bx bx-tag"></i>${escapeHtml(task.category)}</span>` : ""}
            ${progress.total ? `<span><i class="bx bx-check-square"></i>${progress.done}/${progress.total}</span>` : ""}
          </div>

          ${progress.total ? `
            <div class="task-progress-track" aria-label="${progress.percent}% do checklist concluído">
              <span style="width:${progress.percent}%"></span>
            </div>
          ` : ""}

          <small>Editado por ${escapeHtml(updatedName)} · ${escapeHtml(formatTaskDateTime(task.updatedAt))}</small>
        </button>

        <div class="task-item-status">
          <select ${statusAttribute}="${escapeHtml(task.id)}" aria-label="Alterar status de ${escapeHtml(task.title)}">
            ${Object.entries(TASK_STATUS).map(([value,label]) => `<option value="${value}" ${task.status === value ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </div>
      </article>
    `;
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

    title.textContent =
      "O que está se aproximando";

    total.textContent =
      String(
        tasks.length
      );

    if (clearDate) {
      clearDate.hidden =
        true;
    }

    renderDeadlineSummary();

    if (!tasks.length) {
      list.innerHTML =
        `
          <div class="task-empty deadline-empty">
            <i class="bx bx-calendar-check"></i>
            <strong>Nenhum prazo próximo.</strong>
            <span>As tarefas dos próximos 14 dias aparecerão aqui.</span>
          </div>
        `;

      return;
    }

    list.innerHTML =
      tasks
        .map(
          task =>
            taskCardMarkup(
              task
            )
        )
        .join("");
  }

  function renderDayDrawer(
    date =
      selectedTaskDate
  ) {
    if (!date) {
      return;
    }

    const drawer =
      document.getElementById(
        "dayDrawer"
      );

    const dateTitle =
      document.getElementById(
        "dayDrawerDate"
      );

    const taskCount =
      document.getElementById(
        "dayDrawerTaskCount"
      );

    const peopleCount =
      document.getElementById(
        "dayDrawerPeopleCount"
      );

    const doneCount =
      document.getElementById(
        "dayDrawerDoneCount"
      );

    const teamContainer =
      document.getElementById(
        "dayDrawerTeam"
      );

    const taskContainer =
      document.getElementById(
        "dayDrawerTaskList"
      );

    const parsed =
      parseLocalDate(
        date
      );

    if (
      !drawer ||
      !parsed ||
      !teamContainer ||
      !taskContainer
    ) {
      return;
    }

    const tasks =
      getCompanyTasks()
        .filter(
          task =>
            task.dueDate ===
            date
        )
        .sort(
          (a, b) => {
            const timeA =
              a.startTime ||
              "99:99";

            const timeB =
              b.startTime ||
              "99:99";

            const byTime =
              timeA.localeCompare(
                timeB
              );

            if (byTime) {
              return byTime;
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

    const involvedKeys =
      new Set(
        tasks
          .map(
            task =>
              String(
                task.assigneeEmail ||
                task.assigneeId
              )
                .toLowerCase()
          )
          .filter(Boolean)
      );

    if (dateTitle) {
      dateTitle.textContent =
        new Intl.DateTimeFormat(
          "pt-BR",
          {
            weekday:
              "long",
            day:
              "2-digit",
            month:
              "long",
            year:
              "numeric"
          }
        )
          .format(
            parsed
          )
          .replace(
            /^./,
            letter =>
              letter.toUpperCase()
          );
    }

    if (taskCount) {
      taskCount.textContent =
        String(
          tasks.length
        );
    }

    if (peopleCount) {
      peopleCount.textContent =
        String(
          involvedKeys.size
        );
    }

    if (doneCount) {
      doneCount.textContent =
        String(
          tasks.filter(
            task =>
              task.status ===
              "done"
          ).length
        );
    }

    const people =
      getTaskPeople();

    teamContainer.innerHTML =
      people
        .map(
          person => {
            const key =
              taskPersonKey(
                person
              );

            const personTasks =
              tasks.filter(
                task =>
                  String(
                    task.assigneeEmail ||
                    task.assigneeId
                  )
                    .toLowerCase() ===
                    key
              );

            const active =
              personTasks.length >
              0;

            return `
              <div class="day-team-person ${active ? "has-tasks" : ""}">
                <span class="day-team-avatar">${escapeHtml(initials(person.name))}</span>
                <div>
                  <strong>${escapeHtml(person.name)}</strong>
                  <small>${escapeHtml(person.role || "Equipe")}</small>
                </div>
                <span class="day-team-count">${personTasks.length} tarefa${personTasks.length === 1 ? "" : "s"}</span>
              </div>
            `;
          }
        )
        .join("");

    taskContainer.innerHTML =
      tasks.length
        ? tasks
            .map(
              task =>
                taskCardMarkup(
                  task,
                  {
                    editAttribute:
                      "data-day-edit-task",
                    statusAttribute:
                      "data-day-status"
                  }
                )
            )
            .join("")
        : `
            <div class="day-drawer-empty">
              <i class="bx bx-calendar-plus"></i>
              <strong>Dia livre.</strong>
              <span>Não há nenhuma tarefa cadastrada para esta data.</span>
            </div>
          `;
  }

  function openDayDrawer(
    date
  ) {
    const drawer =
      document.getElementById(
        "dayDrawer"
      );

    if (
      !drawer ||
      !date
    ) {
      return;
    }

    selectedTaskDate =
      date;

    renderCalendar();
    renderDayDrawer(
      date
    );

    drawer.classList.add(
      "active"
    );

    drawer.setAttribute(
      "aria-hidden",
      "false"
    );

    window.setTimeout(
      () =>
        document.getElementById(
          "closeDayDrawer"
        )?.focus(),
      20
    );
  }

  function closeDayDrawer() {
    const drawer =
      document.getElementById(
        "dayDrawer"
      );

    drawer?.classList.remove(
      "active"
    );

    drawer?.setAttribute(
      "aria-hidden",
      "true"
    );

    selectedTaskDate =
      "";

    renderCalendar();
  }

  function updateTaskStatus(
    taskId,
    value
  ) {
    if (
      !TASK_STATUS[
        value
      ]
    ) {
      return;
    }

    const tasks =
      getCompanyTasks();

    const index =
      tasks.findIndex(
        task =>
          task.id ===
          taskId
      );

    if (index < 0) {
      return;
    }

    const actor =
      getCurrentActor();

    const task =
      tasks[
        index
      ];

    const oldStatus =
      task.status;

    if (
      oldStatus ===
      value
    ) {
      return;
    }

    task.status =
      value;

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

    tasks[
      index
    ] =
      normalizeTask(
        task
      );

    saveCompanyTasks(
      tasks
    );

    renderCalendar();

    if (
      selectedTaskDate &&
      document.getElementById(
        "dayDrawer"
      )?.classList.contains(
        "active"
      )
    ) {
      renderDayDrawer(
        selectedTaskDate
      );
    }
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

      const events =
        tasks
          .slice(0, 2)
          .map(
            task => {
              const time =
                task.startTime
                  ? `${escapeHtml(task.startTime)} `
                  : "";

              return `
                <span class="calendar-event-chip color-${escapeHtml(task.color)} status-${escapeHtml(task.status)}" data-task-chip-id="${escapeHtml(task.id)}" title="${escapeHtml(task.title)}">
                  <span class="calendar-event-dot"></span>
                  <span class="calendar-event-title">${time}${escapeHtml(task.title)}</span>
                </span>
              `;
            }
          )
          .join("");

      const extra =
        tasks.length > 2
          ? `<span class="calendar-more">+${tasks.length - 2} tarefa(s)</span>`
          : "";

      cells.push(
        `
          <button class="${classes.join(" ")}" type="button" data-calendar-date="${key}" aria-label="${day}, ${tasks.length} tarefa(s)">
            <span class="calendar-day-number">${day}</span>
            <span class="calendar-events">${events}${extra}</span>
          </button>
        `
      );
    }

    grid.innerHTML =
      cells.join("");

    renderTaskList();

    if (
      selectedTaskDate &&
      document.getElementById(
        "dayDrawer"
      )?.classList.contains(
        "active"
      )
    ) {
      renderDayDrawer(
        selectedTaskDate
      );
    }
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
      "taskStartTime"
    ).value =
      task?.startTime ||
      "";

    document.getElementById(
      "taskEndTime"
    ).value =
      task?.endTime ||
      "";

    document.getElementById(
      "taskColor"
    ).value =
      task?.color ||
      "purple";

    document.getElementById(
      "taskDescription"
    ).value =
      task?.description ||
      "";

    taskChecklistDraft =
      Array.isArray(
        task?.checklist
      )
        ? task.checklist.map(
            item => ({
              ...item
            })
          )
        : [];

    renderChecklistDraft();

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

    taskChecklistDraft =
      [];

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

    const todayButton =
      document.getElementById(
        "todayCalendarBtn"
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

    const checklistContainer =
      document.getElementById(
        "taskChecklistItems"
      );

    const checklistNew =
      document.getElementById(
        "taskChecklistNew"
      );

    const addChecklistButton =
      document.getElementById(
        "addChecklistItemBtn"
      );

    const dayDrawer =
      document.getElementById(
        "dayDrawer"
      );

    const closeDayDrawerButton =
      document.getElementById(
        "closeDayDrawer"
      );

    const newTaskForDayButton =
      document.getElementById(
        "newTaskForDayBtn"
      );

    const dayDrawerTaskList =
      document.getElementById(
        "dayDrawerTaskList"
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

        dayDrawer?.classList.remove(
          "active"
        );

        dayDrawer?.setAttribute(
          "aria-hidden",
          "true"
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

        selectedTaskDate =
          "";

        dayDrawer?.classList.remove(
          "active"
        );

        dayDrawer?.setAttribute(
          "aria-hidden",
          "true"
        );

        renderCalendar();
      }
    );

    todayButton?.addEventListener(
      "click",
      () => {
        const now =
          new Date();

        calendarCursor =
          new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );

        openDayDrawer(
          localDateKey(
            now
          )
        );
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
        const taskChip =
          event.target.closest(
            "[data-task-chip-id]"
          );

        if (taskChip) {
          event.preventDefault();
          event.stopPropagation();

          openTaskModal(
            taskChip.dataset.taskChipId
          );

          return;
        }

        const day =
          event.target.closest(
            "[data-calendar-date]"
          );

        if (!day) {
          return;
        }

        const date =
          day.dataset.calendarDate;

        openDayDrawer(
          date
        );
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

        updateTaskStatus(
          select.dataset.quickStatus,
          select.value
        );
      }
    );

    clearDate?.addEventListener(
      "click",
      () => {
        selectedTaskDate =
          "";

        dayDrawer?.classList.remove(
          "active"
        );

        dayDrawer?.setAttribute(
          "aria-hidden",
          "true"
        );

        renderCalendar();
      }
    );

    closeDayDrawerButton?.addEventListener(
      "click",
      closeDayDrawer
    );

    dayDrawer?.addEventListener(
      "click",
      event => {
        if (
          event.target ===
          dayDrawer
        ) {
          closeDayDrawer();
        }
      }
    );

    newTaskForDayButton?.addEventListener(
      "click",
      () => {
        if (!selectedTaskDate) {
          return;
        }

        openTaskModal(
          "",
          selectedTaskDate
        );
      }
    );

    dayDrawerTaskList?.addEventListener(
      "click",
      event => {
        const button =
          event.target.closest(
            "[data-day-edit-task]"
          );

        if (!button) {
          return;
        }

        openTaskModal(
          button.dataset.dayEditTask
        );
      }
    );

    dayDrawerTaskList?.addEventListener(
      "change",
      event => {
        const select =
          event.target.closest(
            "[data-day-status]"
          );

        if (!select) {
          return;
        }

        updateTaskStatus(
          select.dataset.dayStatus,
          select.value
        );
      }
    );

    addChecklistButton?.addEventListener(
      "click",
      () => {
        const text =
          checklistNew
            ?.value
            .trim();

        if (!text) {
          checklistNew?.focus();
          return;
        }

        taskChecklistDraft.push({
          id:
            `check_${Date.now().toString(36)}`,
          text,
          done:
            false
        });

        if (checklistNew) {
          checklistNew.value =
            "";
        }

        renderChecklistDraft();
        checklistNew?.focus();
      }
    );

    checklistNew?.addEventListener(
      "keydown",
      event => {
        if (
          event.key ===
          "Enter"
        ) {
          event.preventDefault();
          addChecklistButton?.click();
        }
      }
    );

    checklistContainer?.addEventListener(
      "change",
      event => {
        const checkbox =
          event.target.closest(
            "[data-checklist-toggle]"
          );

        if (!checkbox) {
          return;
        }

        const item =
          taskChecklistDraft.find(
            entry =>
              entry.id ===
              checkbox.dataset.checklistToggle
          );

        if (item) {
          item.done =
            checkbox.checked;
          renderChecklistDraft();
        }
      }
    );

    checklistContainer?.addEventListener(
      "click",
      event => {
        const removeButton =
          event.target.closest(
            "[data-checklist-remove]"
          );

        if (!removeButton) {
          return;
        }

        taskChecklistDraft =
          taskChecklistDraft.filter(
            item =>
              item.id !==
              removeButton.dataset.checklistRemove
          );

        renderChecklistDraft();
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

        const startTime =
          document.getElementById(
            "taskStartTime"
          )?.value || "";

        const endTime =
          document.getElementById(
            "taskEndTime"
          )?.value || "";

        if (
          startTime &&
          endTime &&
          endTime <=
            startTime
        ) {
          if (feedback) {
            feedback.textContent =
              "O horário final precisa ser depois do horário inicial.";
          }

          document.getElementById(
            "taskEndTime"
          )?.focus();

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
            startTime:
              document.getElementById(
                "taskStartTime"
              ).value,
            endTime:
              document.getElementById(
                "taskEndTime"
              ).value,
            color:
              document.getElementById(
                "taskColor"
              ).value,
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
            checklist:
              taskChecklistDraft.map(
                item => ({
                  ...item
                })
              ),
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
            startTime:
              document.getElementById(
                "taskStartTime"
              ).value,
            endTime:
              document.getElementById(
                "taskEndTime"
              ).value,
            color:
              document.getElementById(
                "taskColor"
              ).value,
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
            checklist:
              taskChecklistDraft.map(
                item => ({
                  ...item
                })
              ),
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

    const members =
      readArray(
        TEAM_KEY
      );

    const registered =
      getRegisteredEmails();

    const companyOwner =
      getCompanyOwner();

    const owner = {
      ...companyOwner,
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

    populateTaskPeopleOptions();
    renderTaskList();
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
        closeTaskModal();

      }

    }
  );


  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */
  renderProfile();

  renderSummary();
  renderBusinessChart();
  initializeCalendar();
  initializeNotes();
  initializeTeam();

});