
(function(){
  "use strict";

  /* ---------------- STATE ---------------- */

  const monthOrder = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul"
  ];

  const monthsData = {
    Jan:{renda:6000,despesa:4200},
    Fev:{renda:7200,despesa:5100},
    Mar:{renda:10000,despesa:3000},
    Abr:{renda:7800,despesa:5600},
    Mai:{renda:9200,despesa:3000},
    Jun:{renda:8300,despesa:5000},
    Jul:{renda:8500,despesa:6222}
  };

  let selectedMonth = "Jul";

  let goals = [
    {
      id:cryptoId(),
      name:"Logotico Novo",
      target:1650,
      current:412
    },
    {
      id:cryptoId(),
      name:"Reforma Nas Bancadas",
      target:60000,
      current:25200
    },
    {
      id:cryptoId(),
      name:"Novo Local",
      target:150000,
      current:4500
    }
  ];

  let transactions = [
    {
      id:cryptoId(),
      date:"25 Jul",
      time:"12:30",
      amount:10,
      name:"YouTube",
      category:"Subscription",
      type:"expense"
    },
    {
      id:cryptoId(),
      date:"26 Jul",
      time:"15:00",
      amount:150,
      name:"Reserved",
      category:"Shopping",
      type:"expense"
    },
    {
      id:cryptoId(),
      date:"27 Jul",
      time:"9:00",
      amount:80,
      name:"Yaposhka",
      category:"Cafe & Restaurants",
      type:"expense"
    },
    {
      id:cryptoId(),
      date:"18 Jul",
      time:"10:15",
      amount:8500,
      name:"Salário",
      category:"Salário",
      type:"income"
    },
    {
      id:cryptoId(),
      date:"14 Jul",
      time:"19:20",
      amount:220,
      name:"Mercado Livre",
      category:"Shopping",
      type:"expense"
    },
    {
      id:cryptoId(),
      date:"08 Jul",
      time:"8:45",
      amount:65,
      name:"Uber",
      category:"Transporte",
      type:"expense"
    }
  ];

  let showAllTx = false;
  let currentContributeGoalId = null;

  function cryptoId(){
    return Math.random().toString(36).slice(2,10);
  }

  function fmt(n){
    const neg = n < 0;

    n = Math.abs(n);

    const parts = n.toFixed(2).split(".");

    parts[0] = parts[0].replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ","
    );

    return (neg ? "-" : "") +
      "$" +
      parts[0] +
      "." +
      parts[1];
  }

  /* ---------------- MONTH FILTER ---------------- */

  const monthFilter =
    document.getElementById("monthFilter");

  monthOrder.forEach(m=>{

    const opt =
      document.createElement("option");

    opt.value = m;
    opt.textContent = "Mês de " + m;

    if(m === selectedMonth){
      opt.selected = true;
    }

    monthFilter.appendChild(opt);

  });

  monthFilter.addEventListener(
    "change",
    ()=>{

      selectedMonth = monthFilter.value;

      renderStats();
      renderChart();

    }
  );

  /* ---------------- STATS ---------------- */

  const statsGrid =
    document.getElementById("statsGrid");

  function computeStats(){

    const idx =
      monthOrder.indexOf(selectedMonth);

    const cur =
      monthsData[selectedMonth];

    const prev =
      idx > 0
        ? monthsData[monthOrder[idx - 1]]
        : null;

    let cumRenda = 0;
    let cumDespesa = 0;

    for(let i = 0; i <= idx; i++){

      cumRenda +=
        monthsData[monthOrder[i]].renda;

      cumDespesa +=
        monthsData[monthOrder[i]].despesa;

    }

    const saldo =
      cumRenda - cumDespesa;

    const economia =
      cumRenda -
      cumDespesa +
      goals.reduce(
        (s,g)=>s + g.current,
        0
      );

    function pct(now,before){

      if(
        before === null ||
        before === 0
      ){
        return null;
      }

      return (
        (now - before) /
        before *
        100
      );

    }

    return {

      saldo,

      renda:cur.renda,

      despesa:cur.despesa,

      economia,

      saldoChange:
        pct(
          saldo,
          prev
            ? (cumRenda-cur.renda) -
              (cumDespesa-cur.despesa)
            : null
        ),

      rendaChange:
        pct(
          cur.renda,
          prev?.renda ?? null
        ),

      despesaChange:
        pct(
          cur.despesa,
          prev?.despesa ?? null
        ),

      economiaChange:
        pct(
          economia,
          prev
            ? economia -
              (cur.renda-cur.despesa)
            : null
        )
    };

  }

  function statCardHTML(
    label,
    value,
    change,
    invert
  ){

    let pillHTML = "";

    if(
      change !== null &&
      isFinite(change)
    ){

      const up =
        invert
          ? change <= 0
          : change >= 0;

      pillHTML = `
        <div class="stat-change">

          <span class="pill ${up ? "up" : "down"}">
            ${change >= 0 ? "+" : ""}
            ${change.toFixed(1)}%
          </span>

          <span class="desc">
            em relação ao mês passado
          </span>

        </div>
      `;

    }else{

      pillHTML = `
        <div class="stat-change">
          <span class="desc">
            sem dados do mês anterior
          </span>
        </div>
      `;

    }

    return `
      <div class="stat-card">

        <div class="stat-top">

          <span class="stat-label">
            ${label}
          </span>

          <span class="stat-arrow">
            ↗
          </span>

        </div>

        <div class="stat-value">
          ${fmt(value)}
        </div>

        ${pillHTML}

      </div>
    `;

  }

  function renderStats(){

    const s = computeStats();

    statsGrid.innerHTML =
      statCardHTML(
        "Saldo total",
        s.saldo,
        s.saldoChange,
        false
      ) +

      statCardHTML(
        "Renda",
        s.renda,
        s.rendaChange,
        false
      ) +

      statCardHTML(
        "Despesa",
        s.despesa,
        s.despesaChange,
        true
      ) +

      statCardHTML(
        "Economia total",
        s.economia,
        s.economiaChange,
        false
      );

  }

  /* ---------------- CHART ---------------- */

  const chartBars =
    document.getElementById("chartBars");

  const chartTooltip =
    document.getElementById("chartTooltip");

  function renderChart(){

    const max =
      Math.max(
        ...monthOrder.map(
          m =>
            Math.max(
              monthsData[m].renda,
              monthsData[m].despesa
            )
        )
      );

    chartBars.innerHTML = "";

    monthOrder.forEach(m=>{

      const d =
        monthsData[m];

      const col =
        document.createElement("div");

      col.className =
        "month-col" +
        (
          m === selectedMonth
            ? " selected"
            : ""
        );

      const pair =
        document.createElement("div");

      pair.className =
        "bars-pair";

      const rBar =
        document.createElement("div");

      rBar.className =
        "bar renda";

      rBar.style.height =
        Math.max(
          4,
          d.renda / max * 100
        ) + "%";

      attachTooltip(
        rBar,
        m,
        "Renda",
        d.renda
      );

      const dBar =
        document.createElement("div");

      dBar.className =
        "bar despesa";

      dBar.style.height =
        Math.max(
          4,
          d.despesa / max * 100
        ) + "%";

      attachTooltip(
        dBar,
        m,
        "Despesa",
        d.despesa
      );

      pair.appendChild(rBar);
      pair.appendChild(dBar);

      const lbl =
        document.createElement("div");

      lbl.className =
        "month-lbl";

      lbl.textContent = m;

      col.appendChild(pair);
      col.appendChild(lbl);

      col.addEventListener(
        "click",
        ()=>{
          selectedMonth = m;
          monthFilter.value = m;

          renderStats();
          renderChart();
        }
      );

      chartBars.appendChild(col);

    });

  }

  function attachTooltip(
    el,
    month,
    kind,
    value
  ){

    el.addEventListener(
      "mousemove",
      e=>{

        const wrapRect =
          el
            .closest(".chart-wrap")
            .getBoundingClientRect();

        const barRect =
          el.getBoundingClientRect();

        chartTooltip.textContent =
          `${kind} · ${month}: ${fmt(value)}`;

        chartTooltip.style.left =
          (
            barRect.left -
            wrapRect.left +
            barRect.width / 2
          ) + "px";

        chartTooltip.style.top =
          (
            barRect.top -
            wrapRect.top
          ) + "px";

        chartTooltip.classList.add("show");

      }
    );

    el.addEventListener(
      "mouseleave",
      ()=>{
        chartTooltip.classList.remove("show");
      }
    );

  }

  /* ---------------- GOALS ---------------- */

  const goalsList =
    document.getElementById("goalsList");

  function renderGoals(){

    if(goals.length === 0){

      goalsList.innerHTML =
        '<div class="empty-state">Nenhum objetivo criado ainda.</div>';

      return;
    }

    goalsList.innerHTML =
      goals.map(g=>{

        const pct =
          Math.min(
            100,
            Math.round(
              (g.current / g.target) * 100
            )
          );

        return `
          <div
            class="goal"
            data-id="${g.id}"
          >

            <div class="goal-top">

              <span class="goal-name">
                ${escapeHtml(g.name)}
              </span>

              <span class="goal-target">
                ${fmt(g.target)}
              </span>

            </div>

            <div class="goal-bar-track">

              <div
                class="goal-bar-fill"
                style="width:${pct}%"
              ></div>

            </div>

            <div class="goal-row">

              <span class="goal-pct">
                ${pct}% ·
                ${fmt(g.current)}
                guardado
              </span>

              <button
                class="goal-add"
                data-add="${g.id}"
              >
                + adicionar
              </button>

            </div>

          </div>
        `;

      }).join("");

    goalsList
      .querySelectorAll("[data-add]")
      .forEach(btn=>{

        btn.addEventListener(
          "click",
          ()=>{

            currentContributeGoalId =
              btn.dataset.add;

            const g =
              goals.find(
                x =>
                  x.id ===
                  currentContributeGoalId
              );

            document.getElementById(
              "contributeSub"
            ).textContent =
              `Aportar valor em "${g.name}".`;

            document.getElementById(
              "contributeInput"
            ).value = "";

            openModal(
              "modalContribute"
            );

          }
        );

      });

  }

  function escapeHtml(str){

    const d =
      document.createElement("div");

    d.textContent = str;

    return d.innerHTML;
  }

  /* ---------------- TRANSACTIONS ---------------- */

  const txBody =
    document.getElementById("txBody");

  const txEmpty =
    document.getElementById("txEmpty");

  const searchTx =
    document.getElementById("searchTx");

  const categoryFilter =
    document.getElementById("categoryFilter");

  const viewAllBtn =
    document.getElementById("viewAllBtn");

  function refreshCategoryOptions(){

    const cats =
      [
        ...new Set(
          transactions.map(
            t => t.category
          )
        )
      ];

    const currentVal =
      categoryFilter.value;

    categoryFilter.innerHTML =
      '<option value="">Todas categorias</option>' +

      cats
        .map(
          c =>
            `<option value="${escapeHtml(c)}">
              ${escapeHtml(c)}
            </option>`
        )
        .join("");

    categoryFilter.value =
      cats.includes(currentVal)
        ? currentVal
        : "";

  }

  function renderTransactions(){

    refreshCategoryOptions();

    let list =
      transactions
        .slice()
        .sort(
          (a,b)=>
            b.__order -
            a.__order
        );

    const q =
      searchTx.value
        .trim()
        .toLowerCase();

    const cat =
      categoryFilter.value;

    if(q){

      list =
        list.filter(
          t =>
            t.name
              .toLowerCase()
              .includes(q)
        );

    }

    if(cat){

      list =
        list.filter(
          t =>
            t.category === cat
        );

    }

    const displayList =
      showAllTx
        ? list
        : list.slice(0,3);

    viewAllBtn.textContent =
      showAllTx
        ? "Ver menos"
        : "Ver todos";

    if(displayList.length === 0){

      txBody.innerHTML = "";
      txEmpty.style.display = "";

    }else{

      txEmpty.style.display = "none";

      txBody.innerHTML =
        displayList.map(t=>`

          <tr data-id="${t.id}">

            <td>
              ${t.date} ${t.time}
            </td>

            <td
              class="amount ${
                t.type === "income"
                  ? "pos"
                  : "neg"
              }"
            >
              ${
                t.type === "income"
                  ? "+"
                  : "-"
              }${fmt(t.amount)}
            </td>

            <td class="tx-name">
              ${escapeHtml(t.name)}
            </td>

            <td>
              <span class="cat-tag">
                ${escapeHtml(t.category)}
              </span>
            </td>

            <td>

              <button
                class="del-btn"
                data-del="${t.id}"
                title="Remover"
                aria-label="Remover transação"
              >
                ✕
              </button>

            </td>

          </tr>

        `).join("");

      txBody
        .querySelectorAll("[data-del]")
        .forEach(btn=>{

          btn.addEventListener(
            "click",
            ()=>{

              transactions =
                transactions.filter(
                  t =>
                    t.id !==
                    btn.dataset.del
                );

              renderTransactions();

              showToast(
                "Transação removida"
              );

            }
          );

        });

    }

  }

  let orderCounter =
    transactions.length;

  transactions.forEach(
    t =>
      t.__order =
        orderCounter--
  );

  searchTx.addEventListener(
    "input",
    renderTransactions
  );

  categoryFilter.addEventListener(
    "change",
    renderTransactions
  );

  viewAllBtn.addEventListener(
    "click",
    ()=>{
      showAllTx = !showAllTx;
      renderTransactions();
    }
  );

  /* ---------------- MODALS ---------------- */

  function openModal(id){

    document
      .getElementById(id)
      .classList.add("open");

  }

  function closeModal(id){

    document
      .getElementById(id)
      .classList.remove("open");

  }

  document
    .querySelectorAll(".modal-overlay")
    .forEach(overlay=>{

      overlay.addEventListener(
        "click",
        e=>{
          if(e.target === overlay){
            overlay.classList.remove("open");
          }
        }
      );

      overlay
        .querySelectorAll("[data-close]")
        .forEach(
          b =>
            b.addEventListener(
              "click",
              ()=>{
                overlay.classList.remove(
                  "open"
                );
              }
            )
        );

    });

  function showToast(msg){

    const toast =
      document.getElementById("toast");

    toast.textContent = msg;

    toast.classList.add("show");

    clearTimeout(showToast._t);

    showToast._t =
      setTimeout(
        ()=>{
          toast.classList.remove("show");
        },
        2200
      );

  }

  /* ---------------- NEW PRODUCT / TRANSACTION ---------------- */

  const newProductBtn =
    document.getElementById("newProductBtn");

  const newProductBtn2 =
    document.getElementById("newProductBtn2");

  [newProductBtn,newProductBtn2]
    .forEach(
      b =>
        b.addEventListener(
          "click",
          ()=>{

            document.getElementById(
              "txNameInput"
            ).value = "";

            document.getElementById(
              "txCategoryInput"
            ).value = "";

            document.getElementById(
              "txAmountInput"
            ).value = "";

            document.getElementById(
              "txTypeInput"
            ).value = "expense";

            openModal(
              "modalProduct"
            );

          }
        )
    );

  document
    .getElementById("saveProductBtn")
    .addEventListener(
      "click",
      ()=>{

        const name =
          document
            .getElementById("txNameInput")
            .value
            .trim();

        const category =
          document
            .getElementById("txCategoryInput")
            .value
            .trim() ||
          "Outros";

        const type =
          document
            .getElementById("txTypeInput")
            .value;

        const amount =
          parseFloat(
            document
              .getElementById("txAmountInput")
              .value
          );

        if(
          !name ||
          !amount ||
          amount <= 0
        ){

          showToast(
            "Preencha nome e valor válidos"
          );

          return;
        }

        const now =
          new Date();

        const dateStr =
          now.getDate()
            .toString()
            .padStart(2,"0") +
          " " +
          monthOrder[
            Math.min(
              now.getMonth(),
              6
            )
          ];

        orderCounter++;

        transactions.push({

          id:cryptoId(),

          date:dateStr,

          time:
            now.getHours() +
            ":" +
            now
              .getMinutes()
              .toString()
              .padStart(2,"0"),

          amount,

          name,

          category,

          type,

          __order:
            orderCounter

        });

        if(type === "expense"){

          monthsData[
            selectedMonth
          ].despesa += amount;

        }else{

          monthsData[
            selectedMonth
          ].renda += amount;

        }

        closeModal(
          "modalProduct"
        );

        renderTransactions();
        renderStats();
        renderChart();

        showToast(
          "Produto adicionado com sucesso"
        );

      }
    );

  /* ---------------- NEW GOAL ---------------- */

  document
    .getElementById("newGoalBtn")
    .addEventListener(
      "click",
      ()=>{

        document.getElementById(
          "goalNameInput"
        ).value = "";

        document.getElementById(
          "goalTargetInput"
        ).value = "";

        document.getElementById(
          "goalCurrentInput"
        ).value = "0";

        openModal(
          "modalGoal"
        );

      }
    );

  document
    .getElementById("saveGoalBtn")
    .addEventListener(
      "click",
      ()=>{

        const name =
          document
            .getElementById("goalNameInput")
            .value
            .trim();

        const target =
          parseFloat(
            document
              .getElementById("goalTargetInput")
              .value
          );

        const current =
          parseFloat(
            document
              .getElementById("goalCurrentInput")
              .value
          ) || 0;

        if(
          !name ||
          !target ||
          target <= 0
        ){

          showToast(
            "Preencha nome e meta válidos"
          );

          return;
        }

        goals.push({

          id:cryptoId(),

          name,

          target,

          current:
            Math.min(
              current,
              target
            )

        });

        closeModal(
          "modalGoal"
        );

        renderGoals();
        renderStats();

        showToast(
          "Objetivo criado com sucesso"
        );

      }
    );

  /* ---------------- CONTRIBUTE TO GOAL ---------------- */

  document
    .getElementById("saveContributeBtn")
    .addEventListener(
      "click",
      ()=>{

        const val =
          parseFloat(
            document
              .getElementById("contributeInput")
              .value
          );

        if(
          !val ||
          val <= 0
        ){

          showToast(
            "Informe um valor válido"
          );

          return;
        }

        const g =
          goals.find(
            x =>
              x.id ===
              currentContributeGoalId
          );

        if(g){

          g.current =
            Math.min(
              g.target,
              g.current + val
            );

          renderGoals();
          renderStats();

          showToast(
            `$${val} adicionado a "${g.name}"`
          );

        }

        closeModal(
          "modalContribute"
        );

      }
    );

  /* ---------------- MANAGE PRODUCTS / GOALS ---------------- */

  const manageList =
    document.getElementById("manageList");

  document
    .getElementById("manageProductsBtn")
    .addEventListener(
      "click",
      ()=>{

        renderManageList();

        openModal(
          "modalManage"
        );

      }
    );

  function renderManageList(){

    if(goals.length === 0){

      manageList.innerHTML =
        '<div class="empty-state">Nenhum objetivo cadastrado.</div>';

      return;
    }

    manageList.innerHTML =
      goals.map(g=>`

        <div
          class="product-row"
          data-id="${g.id}"
        >

          <span>
            ${escapeHtml(g.name)}
            —
            ${fmt(g.target)}
          </span>

          <button
            class="del-btn"
            data-del-goal="${g.id}"
            aria-label="Remover objetivo"
          >
            ✕
          </button>

        </div>

      `).join("");

    manageList
      .querySelectorAll("[data-del-goal]")
      .forEach(btn=>{

        btn.addEventListener(
          "click",
          ()=>{

            goals =
              goals.filter(
                g =>
                  g.id !==
                  btn.dataset.delGoal
              );

            renderManageList();
            renderGoals();
            renderStats();

            showToast(
              "Objetivo removido"
            );

          }
        );

      });

  }

  /* ---------------- INIT ---------------- */


  renderStats();

  renderChart();

  renderGoals();

  renderTransactions();

})();

// ============ TOGGLE MODO ESCURO ============
(function () {
  const toggleBtn = document.getElementById('themeToggle');
  const label = document.getElementById('themeLabel');
  const iconSun = document.getElementById('iconSun');
  const iconMoon = document.getElementById('iconMoon');
 
  function applyTheme(isDark) {
    document.body.classList.toggle('dark', isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    toggleBtn?.setAttribute('aria-pressed', String(isDark));
    if (label) label.textContent = isDark ? 'Modo Escuro' : 'Modo Claro';
    if (iconSun) iconSun.style.display = isDark ? 'none' : 'block';
    if (iconMoon) iconMoon.style.display = isDark ? 'block' : 'none';
  }
 
  // Lê preferência salva, ou usa a preferência do sistema como padrão
  const saved = localStorage.getItem('zuz-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved ? saved === 'dark' : prefersDark);
 
  toggleBtn?.addEventListener('click', function () {
    const isDark = !document.body.classList.contains('dark');
    applyTheme(isDark);
    localStorage.setItem('zuz-theme', isDark ? 'dark' : 'light');
  });
})();



document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll(".nav-item");

  const paginaAtual = window.location.pathname;

  navItems.forEach(item => {
    const link = item.getAttribute("href");

    if (
      link === "index.html" &&
      (paginaAtual.endsWith("/") || paginaAtual.endsWith("index.html"))
    ) {
      item.classList.add("active");
    }

    if (
      link !== "index.html" &&
      paginaAtual.endsWith(link)
    ) {
      item.classList.add("active");
    }
  });
});

