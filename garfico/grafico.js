(() => {
  "use strict";

  const STORAGE_KEY = "zuz-pricing-products-v2";
  const TASKS_KEY = "zuz-company-tasks";
  const TEAM_KEY = "zuz-company-team";
  const PROFILE_KEY = "zuz-profile";
  const SESSION_KEY = "zuz-session";
  const BUSINESS_OWNER_KEY = "zuz-company-owner";
  const monthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  const els = {
    monthFilter: document.getElementById("monthFilter"),
    statsGrid: document.getElementById("statsGrid"),
    chartBars: document.getElementById("chartBars"),
    chartTooltip: document.getElementById("chartTooltip"),
    insightList: document.getElementById("insightList"),

    searchProduct: document.getElementById("searchProduct"),
    categoryFilter: document.getElementById("categoryFilter"),
    productsBody: document.getElementById("productsBody"),
    productsEmpty: document.getElementById("productsEmpty"),

    newProductBtn: document.getElementById("newProductBtn"),
    newProductBtn2: document.getElementById("newProductBtn2"),
    manageProductsBtn: document.getElementById("manageProductsBtn"),

    modalProduct: document.getElementById("modalProduct"),
    modalManage: document.getElementById("modalManage"),
    productForm: document.getElementById("productForm"),
    productFormError: document.getElementById("productFormError"),

    productNameInput: document.getElementById("productNameInput"),
    productCategoryInput: document.getElementById("productCategoryInput"),
    baseCostInput: document.getElementById("baseCostInput"),
    targetMarginInput: document.getElementById("targetMarginInput"),
    salePriceInput: document.getElementById("salePriceInput"),
    unitsSoldInput: document.getElementById("unitsSoldInput"),
    productDateInput: document.getElementById("productDateInput"),

    addCostBtn: document.getElementById("addCostBtn"),
    additionalCosts: document.getElementById("additionalCosts"),
    useSuggestedPriceBtn: document.getElementById("useSuggestedPriceBtn"),
    suggestedPrice: document.getElementById("suggestedPrice"),

    previewProductName: document.getElementById("previewProductName"),
    previewSalePrice: document.getElementById("previewSalePrice"),
    previewTotalCost: document.getElementById("previewTotalCost"),
    previewUnitMargin: document.getElementById("previewUnitMargin"),
    previewMarginPct: document.getElementById("previewMarginPct"),
    previewRevenue: document.getElementById("previewRevenue"),
    previewStatus: document.getElementById("previewStatus"),

    manageList: document.getElementById("manageList"),
    toast: document.getElementById("toast"),

    plannerJumpBtn: document.getElementById("plannerJumpBtn"),
    plannerLauncherMonth: document.getElementById("plannerLauncherMonth"),
    agendaQuickPicker: document.getElementById("agendaQuickPicker"),
    agendaPeriodPopover: document.getElementById("agendaPeriodPopover"),
    agendaPeriodMonth: document.getElementById("agendaPeriodMonth"),
    agendaPeriodYear: document.getElementById("agendaPeriodYear"),
    agendaPeriodApply: document.getElementById("agendaPeriodApply"),
    agendaPeriodToday: document.getElementById("agendaPeriodToday"),
    agendaPeriodClose: document.getElementById("agendaPeriodClose"),
    plannerSummary: document.getElementById("plannerSummary"),
    plannerMonthLabel: document.getElementById("plannerMonthLabel"),
    plannerPrevMonth: document.getElementById("plannerPrevMonth"),
    plannerNextMonth: document.getElementById("plannerNextMonth"),
    plannerAssigneeFilter: document.getElementById("plannerAssigneeFilter"),
    plannerPriorityFilter: document.getElementById("plannerPriorityFilter"),
    plannerCalendarView: document.getElementById("plannerCalendarView"),
    plannerCalendarGrid: document.getElementById("plannerCalendarGrid"),
    plannerBoardView: document.getElementById("plannerBoardView"),
    plannerTodayBtn: document.getElementById("plannerTodayBtn"),
    plannerNewTaskBtn: document.getElementById("plannerNewTaskBtn"),

    graphDayDrawer: document.getElementById("graphDayDrawer"),
    graphDayDrawerDate: document.getElementById("graphDayDrawerDate"),
    graphDayTaskCount: document.getElementById("graphDayTaskCount"),
    graphDayPeopleCount: document.getElementById("graphDayPeopleCount"),
    graphDayDoneCount: document.getElementById("graphDayDoneCount"),
    graphDayTeam: document.getElementById("graphDayTeam"),
    graphDayTaskList: document.getElementById("graphDayTaskList"),
    graphCloseDayDrawer: document.getElementById("graphCloseDayDrawer"),
    graphNewTaskForDay: document.getElementById("graphNewTaskForDay"),

    graphTaskModal: document.getElementById("graphTaskModal"),
    graphTaskModalTitle: document.getElementById("graphTaskModalTitle"),
    graphTaskForm: document.getElementById("graphTaskForm"),
    graphTaskTitle: document.getElementById("graphTaskTitle"),
    graphTaskAssignee: document.getElementById("graphTaskAssignee"),
    graphTaskDueDate: document.getElementById("graphTaskDueDate"),
    graphTaskPriority: document.getElementById("graphTaskPriority"),
    graphTaskStatus: document.getElementById("graphTaskStatus"),
    graphTaskCost: document.getElementById("graphTaskCost"),
    graphTaskCategory: document.getElementById("graphTaskCategory"),
    graphTaskStartTime: document.getElementById("graphTaskStartTime"),
    graphTaskEndTime: document.getElementById("graphTaskEndTime"),
    graphTaskColor: document.getElementById("graphTaskColor"),
    graphTaskDescription: document.getElementById("graphTaskDescription"),
    graphChecklistProgress: document.getElementById("graphChecklistProgress"),
    graphChecklistItems: document.getElementById("graphChecklistItems"),
    graphChecklistNew: document.getElementById("graphChecklistNew"),
    graphAddChecklistItem: document.getElementById("graphAddChecklistItem"),
    graphTaskAudit: document.getElementById("graphTaskAudit"),
    graphTaskAuditSummary: document.getElementById("graphTaskAuditSummary"),
    graphTaskHistoryList: document.getElementById("graphTaskHistoryList"),
    graphTaskFeedback: document.getElementById("graphTaskFeedback"),
    graphCloseTaskModal: document.getElementById("graphCloseTaskModal"),
    graphCancelTask: document.getElementById("graphCancelTask"),
    graphDeleteTask: document.getElementById("graphDeleteTask")
  };

  let selectedMonth = new Date().getMonth();
  let plannerYear = new Date().getFullYear();
  let plannerView = "calendar";
  let selectedPlannerDate = "";
  let editingPlannerTaskId = "";
  let plannerChecklistDraft = [];
  let products = loadProducts();

  function id() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function currency(value) {
    const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(safe);
  }

  function percent(value) {
    const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
    return safe.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }) + "%";
  }

  function numberValue(value) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  function toDateInputValue(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function monthFromDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || "")) {
      return selectedMonth;
    }
    const month = Number(dateString.slice(5, 7)) - 1;
    return clamp(month, 0, 11);
  }

  function formatDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || "")) return "Sem data";
    const [year, month, day] = dateString.split("-").map(Number);
    return String(day).padStart(2, "0") + "/" + String(month).padStart(2, "0") + "/" + year;
  }

  function totalUnitCost(product) {
    const extras = Array.isArray(product.additionalCosts)
      ? product.additionalCosts.reduce((sum, item) => sum + numberValue(item.value), 0)
      : 0;
    return Math.max(0, numberValue(product.baseCost) + extras);
  }

  function productMarginValue(product) {
    return numberValue(product.salePrice) - totalUnitCost(product);
  }

  function productMarginPct(product) {
    const salePrice = numberValue(product.salePrice);
    if (salePrice <= 0) return 0;
    return (productMarginValue(product) / salePrice) * 100;
  }

  function productRevenue(product) {
    return numberValue(product.salePrice) * Math.max(0, numberValue(product.units));
  }

  function productCostTotal(product) {
    return totalUnitCost(product) * Math.max(0, numberValue(product.units));
  }

  function createDemoProducts() {
    const now = new Date();
    const current = now.getMonth();
    const year = now.getFullYear();

    const dateForOffset = (offset, day) => {
      const d = new Date(year, current - offset, day);
      return toDateInputValue(d);
    };

    return [
      {
        id: id(),
        name: "Produto principal",
        category: "Mais vendido",
        baseCost: 18.5,
        additionalCosts: [{ label: "Embalagem", value: 2.2 }],
        targetMargin: 35,
        salePrice: 34.9,
        units: 92,
        date: dateForOffset(0, 12)
      },
      {
        id: id(),
        name: "Kit especial",
        category: "Kits",
        baseCost: 29,
        additionalCosts: [{ label: "Embalagem", value: 3.5 }],
        targetMargin: 38,
        salePrice: 54.9,
        units: 38,
        date: dateForOffset(0, 8)
      },
      {
        id: id(),
        name: "Produto premium",
        category: "Premium",
        baseCost: 42,
        additionalCosts: [{ label: "Taxa", value: 4 }],
        targetMargin: 40,
        salePrice: 79.9,
        units: 25,
        date: dateForOffset(1, 18)
      },
      {
        id: id(),
        name: "Produto básico",
        category: "Linha básica",
        baseCost: 11,
        additionalCosts: [{ label: "Embalagem", value: 1.5 }],
        targetMargin: 32,
        salePrice: 21.9,
        units: 74,
        date: dateForOffset(1, 7)
      },
      {
        id: id(),
        name: "Combo mensal",
        category: "Combos",
        baseCost: 36,
        additionalCosts: [{ label: "Entrega", value: 5 }],
        targetMargin: 35,
        salePrice: 67.9,
        units: 31,
        date: dateForOffset(2, 20)
      },
      {
        id: id(),
        name: "Edição anterior",
        category: "Sazonal",
        baseCost: 23,
        additionalCosts: [],
        targetMargin: 30,
        salePrice: 39.9,
        units: 41,
        date: dateForOffset(3, 15)
      }
    ];
  }

  function normalizeProduct(product) {
    return {
      id: String(product.id || id()),
      name: String(product.name || "Produto"),
      category: String(product.category || "Sem categoria"),
      baseCost: Math.max(0, numberValue(product.baseCost)),
      additionalCosts: Array.isArray(product.additionalCosts)
        ? product.additionalCosts
            .map(item => ({
              label: String(item.label || "Custo adicional"),
              value: Math.max(0, numberValue(item.value))
            }))
            .filter(item => item.value > 0 || item.label.trim())
        : [],
      targetMargin: clamp(numberValue(product.targetMargin || 30), 0, 95),
      salePrice: Math.max(0, numberValue(product.salePrice)),
      units: Math.max(0, Math.round(numberValue(product.units))),
      date: /^\d{4}-\d{2}-\d{2}$/.test(product.date || "")
        ? product.date
        : toDateInputValue(new Date())
    };
  }

  function loadProducts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeProduct);
        }
      }
    } catch (error) {
      console.warn("Não foi possível ler os produtos salvos.", error);
    }

    const demo = createDemoProducts();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    } catch (error) {
      console.warn("Não foi possível salvar os dados iniciais.", error);
    }
    return demo;
  }

  function saveProducts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.warn("Não foi possível salvar os produtos.", error);
      showToast("Os dados foram atualizados, mas não puderam ser salvos no navegador.");
    }
  }

  function monthMetrics(monthIndex) {
    const monthProducts = products.filter(product => monthFromDate(product.date) === monthIndex);

    const revenue = monthProducts.reduce((sum, product) => sum + productRevenue(product), 0);
    const costs = monthProducts.reduce((sum, product) => sum + productCostTotal(product), 0);
    const margin = revenue - costs;
    const units = monthProducts.reduce((sum, product) => sum + Math.max(0, numberValue(product.units)), 0);
    const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;

    return {
      products: monthProducts,
      revenue,
      costs,
      margin,
      units,
      marginPct
    };
  }

  function changePercent(current, previous) {
    if (!Number.isFinite(previous) || previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  function initMonthFilter() {
    const monthOptions = monthNames
      .map((name, index) => `<option value="${index}">${name}</option>`)
      .join("");

    els.monthFilter.innerHTML = monthOptions;
    els.monthFilter.value = String(selectedMonth);

    if (els.agendaPeriodMonth) {
      els.agendaPeriodMonth.innerHTML = monthOptions;
      els.agendaPeriodMonth.value = String(selectedMonth);
    }

    if (els.agendaPeriodYear) {
      els.agendaPeriodYear.value = String(plannerYear);
    }

    els.monthFilter.addEventListener("change", () => {
      selectedMonth = clamp(Number(els.monthFilter.value), 0, 11);
      renderAll();
    });
  }

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

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function normalizeGraphTask(task) {
    const actor = currentActor();
    const now = new Date().toISOString();
    const colors = ["purple", "blue", "green", "amber", "coral", "gray"];

    return {
      id: String(task?.id || `task_${Date.now().toString(36)}`),
      title: String(task?.title || "Nova tarefa"),
      assigneeId: String(task?.assigneeId || ""),
      assigneeName: String(task?.assigneeName || "Sem responsável"),
      assigneeEmail: String(task?.assigneeEmail || "").toLowerCase(),
      dueDate: /^\d{4}-\d{2}-\d{2}$/.test(String(task?.dueDate || ""))
        ? String(task.dueDate)
        : toDateInputValue(new Date()),
      startTime: String(task?.startTime || ""),
      endTime: String(task?.endTime || ""),
      color: colors.includes(task?.color) ? task.color : "purple",
      priority: TASK_PRIORITY[task?.priority] ? task.priority : "medium",
      status: TASK_STATUS[task?.status] ? task.status : "todo",
      cost: Math.max(0, numberValue(task?.cost)),
      category: String(task?.category || ""),
      description: String(task?.description || ""),
      checklist: Array.isArray(task?.checklist)
        ? task.checklist.map(item => ({
            id: String(item?.id || `check_${Date.now().toString(36)}`),
            text: String(item?.text || ""),
            done: Boolean(item?.done)
          }))
        : [],
      createdAt: task?.createdAt || now,
      createdBy: task?.createdBy || actor,
      updatedAt: task?.updatedAt || task?.createdAt || now,
      updatedBy: task?.updatedBy || task?.createdBy || actor,
      history: Array.isArray(task?.history) ? task.history : []
    };
  }

  function loadCompanyTasks() {
    const tasks = readJson(TASKS_KEY, []);
    return Array.isArray(tasks)
      ? tasks.filter(task => task && task.id).map(normalizeGraphTask)
      : [];
  }

  function saveCompanyTasks(tasks) {
    localStorage.setItem(
      TASKS_KEY,
      JSON.stringify(tasks.map(normalizeGraphTask))
    );
  }

  function currentActor() {
    const profile = readJson(PROFILE_KEY, {});
    const session = readJson(SESSION_KEY, {});
    return {
      id: session.userId || profile.id || profile.email || "local-user",
      name: profile.name || session.email || "Usuário ZUZ",
      email: String(profile.email || session.email || "").toLowerCase()
    };
  }

  function plannerPersonKey(person) {
    return String(person?.email || person?.id || person?.name || "")
      .trim()
      .toLowerCase();
  }

  function getPlannerPeople() {
    const profile = readJson(PROFILE_KEY, {});
    const ownerSaved = readJson(BUSINESS_OWNER_KEY, {});
    const actor = currentActor();

    const owner = {
      id: ownerSaved.id || profile.id || actor.id || "owner",
      name: ownerSaved.name || profile.name || actor.name || "Proprietário",
      email: String(ownerSaved.email || profile.email || actor.email || "").toLowerCase(),
      role: "Proprietário"
    };

    const team = readJson(TEAM_KEY, []);
    const people = [owner];

    if (Array.isArray(team)) {
      team.forEach(member => {
        people.push({
          id: member.id || member.email || member.name,
          name: member.name || member.email || "Membro",
          email: String(member.email || "").toLowerCase(),
          role: member.role || "Equipe"
        });
      });
    }

    loadCompanyTasks().forEach(task => {
      const key = String(task.assigneeEmail || task.assigneeId || task.assigneeName || "").toLowerCase();
      if (!key) return;

      const exists = people.some(person => plannerPersonKey(person) === key);
      if (!exists) {
        people.push({
          id: task.assigneeId || key,
          name: task.assigneeName || task.assigneeEmail || "Responsável",
          email: String(task.assigneeEmail || "").toLowerCase(),
          role: "Equipe"
        });
      }
    });

    const seen = new Set();
    return people.filter(person => {
      const key = plannerPersonKey(person);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function taskColorClass(task) {
    const allowed = ["purple", "blue", "green", "amber", "coral", "gray"];
    const color = allowed.includes(task?.color) ? task.color : "purple";
    return "color-" + color;
  }

  function taskDate(task) {
    const value = String(task?.dueDate || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function plannerDateKey(year, monthIndex, day) {
    return [
      year,
      String(monthIndex + 1).padStart(2, "0"),
      String(day).padStart(2, "0")
    ].join("-");
  }

  function plannerTaskTime(task) {
    if (task.startTime && task.endTime) return `${task.startTime}–${task.endTime}`;
    return task.startTime || task.endTime || "";
  }

  function plannerTasks() {
    const assignee = els.plannerAssigneeFilter?.value || "";
    const priority = els.plannerPriorityFilter?.value || "";

    return loadCompanyTasks()
      .filter(task => {
        const date = taskDate(task);
        if (!date) return false;
        if (date.getFullYear() !== plannerYear || date.getMonth() !== selectedMonth) return false;

        const taskAssignee = String(task.assigneeEmail || task.assigneeId || task.assigneeName || "").toLowerCase();
        if (assignee && taskAssignee !== assignee) return false;
        if (priority && task.priority !== priority) return false;
        return true;
      })
      .sort((a, b) => {
        const byDate = String(a.dueDate).localeCompare(String(b.dueDate));
        if (byDate) return byDate;
        return String(a.startTime || "99:99").localeCompare(String(b.startTime || "99:99"));
      });
  }

  function plannerMonthText() {
    return new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric"
    }).format(new Date(plannerYear, selectedMonth, 1))
      .replace(/^./, letter => letter.toUpperCase());
  }

  function populatePlannerPeople() {
    const people = getPlannerPeople();

    if (els.plannerAssigneeFilter) {
      const current = els.plannerAssigneeFilter.value;
      els.plannerAssigneeFilter.innerHTML =
        '<option value="">Toda a equipe</option>' +
        people
          .map(person => {
            const key = plannerPersonKey(person);
            return `<option value="${escapeHtml(key)}">${escapeHtml(person.name)}</option>`;
          })
          .join("");

      if (people.some(person => plannerPersonKey(person) === current)) {
        els.plannerAssigneeFilter.value = current;
      }
    }

    if (els.graphTaskAssignee) {
      const current = els.graphTaskAssignee.value;
      els.graphTaskAssignee.innerHTML = people
        .map(person => {
          const key = plannerPersonKey(person);
          return `<option value="${escapeHtml(key)}">${escapeHtml(person.name)} · ${escapeHtml(person.role)}</option>`;
        })
        .join("");

      if (people.some(person => plannerPersonKey(person) === current)) {
        els.graphTaskAssignee.value = current;
      }
    }
  }

  function renderPlannerSummary(tasks) {
    if (!els.plannerSummary) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const doing = tasks.filter(task => task.status === "doing").length;
    const done = tasks.filter(task => task.status === "done").length;
    const overdue = tasks.filter(task => {
      const date = taskDate(task);
      return date && date < now && task.status !== "done";
    }).length;

    const items = [
      ["Tarefas no mês", tasks.length, "bx-task"],
      ["Em andamento", doing, "bx-loader-circle"],
      ["Atrasadas", overdue, "bx-error-circle"],
      ["Concluídas", done, "bx-check-circle"]
    ];

    els.plannerSummary.innerHTML = items
      .map(([label, value, icon]) => `
        <div class="planner-summary-item">
          <i class="bx ${icon}"></i>
          <div>
            <strong>${value}</strong>
            <span>${label}</span>
          </div>
        </div>
      `)
      .join("");
  }

  function plannerTaskChip(task) {
    const time = task.startTime ? `${escapeHtml(task.startTime)} · ` : "";
    const doneClass = task.status === "done" ? " is-done" : "";

    return `
      <button
        class="planner-event ${taskColorClass(task)}${doneClass}"
        type="button"
        data-planner-task="${escapeHtml(task.id)}"
        title="${escapeHtml(task.title || "Tarefa")}"
      >
        <span class="planner-event-dot"></span>
        <span class="planner-event-title">${time}${escapeHtml(task.title || "Tarefa")}</span>
      </button>
    `;
  }

  function renderPlannerCalendar(tasks) {
    if (!els.plannerCalendarGrid) return;

    const firstWeekday = new Date(plannerYear, selectedMonth, 1).getDay();
    const lastDay = new Date(plannerYear, selectedMonth + 1, 0).getDate();
    const today = new Date();
    const byDay = new Map();

    tasks.forEach(task => {
      const date = taskDate(task);
      if (!date) return;
      const day = date.getDate();
      const group = byDay.get(day) || [];
      group.push(task);
      byDay.set(day, group);
    });

    const cells = [];

    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push('<div class="planner-day is-empty" aria-hidden="true"></div>');
    }

    for (let day = 1; day <= lastDay; day += 1) {
      const dayTasks = byDay.get(day) || [];
      const dateKey = plannerDateKey(plannerYear, selectedMonth, day);
      const isToday =
        today.getFullYear() === plannerYear &&
        today.getMonth() === selectedMonth &&
        today.getDate() === day;
      const isSelected = selectedPlannerDate === dateKey;

      const visible = dayTasks.slice(0, 3).map(plannerTaskChip).join("");
      const extra = dayTasks.length > 3
        ? `<span class="planner-day-more">+${dayTasks.length - 3} tarefa(s)</span>`
        : "";

      cells.push(`
        <div
          class="planner-day${isToday ? " is-today" : ""}${isSelected ? " is-selected" : ""}"
          data-planner-date="${dateKey}"
          role="button"
          tabindex="0"
          aria-label="${day} de ${plannerMonthText()}, ${dayTasks.length} tarefa(s)"
        >
          <span class="planner-day-number">${day}</span>
          <div class="planner-day-events">${visible}${extra}</div>
        </div>
      `);
    }

    els.plannerCalendarGrid.innerHTML = cells.join("");

    els.plannerCalendarGrid.querySelectorAll("[data-planner-task]").forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        openGraphTaskModal(button.dataset.plannerTask);
      });
    });

    els.plannerCalendarGrid.querySelectorAll("[data-planner-date]").forEach(day => {
      const open = event => {
        if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
        if (event.type === "keydown") event.preventDefault();
        openGraphDayDrawer(day.dataset.plannerDate);
      };

      day.addEventListener("click", open);
      day.addEventListener("keydown", open);
    });
  }

  function plannerBoardCard(task) {
    const date = taskDate(task);
    const formatted = date
      ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date)
      : "--";

    const cost = Number(task.cost || 0) > 0 ? currency(Number(task.cost)) : "";
    const priority = TASK_PRIORITY[task.priority] || "Média";

    return `
      <article
        class="planner-board-card ${taskColorClass(task)}"
        draggable="true"
        data-board-task-id="${escapeHtml(task.id)}"
      >
        <button class="planner-board-open" type="button" data-board-edit-task="${escapeHtml(task.id)}">
          <div class="planner-board-card-top">
            <span class="planner-board-color"></span>
            <span class="planner-board-priority">${escapeHtml(priority)}</span>
          </div>
          <strong>${escapeHtml(task.title || "Tarefa")}</strong>
          <div class="planner-board-meta">
            <span><i class="bx bx-user"></i>${escapeHtml(task.assigneeName || "Sem responsável")}</span>
            <span><i class="bx bx-calendar"></i>${formatted}</span>
            ${cost ? `<span><i class="bx bx-wallet"></i>${escapeHtml(cost)}</span>` : ""}
          </div>
          <small class="planner-board-edited">Editado por ${escapeHtml(task.updatedBy?.name || task.createdBy?.name || "Usuário")}</small>
        </button>

        <select data-board-status="${escapeHtml(task.id)}" aria-label="Status da tarefa">
          ${Object.entries(TASK_STATUS)
            .map(([value, label]) => `<option value="${value}" ${task.status === value ? "selected" : ""}>${label}</option>`)
            .join("")}
        </select>
      </article>
    `;
  }

  function renderPlannerBoard(tasks) {
    if (!els.plannerBoardView) return;

    const statuses = ["todo", "doing", "blocked", "done"];

    els.plannerBoardView.innerHTML = statuses
      .map(status => {
        const group = tasks.filter(task => task.status === status);
        return `
          <section class="planner-board-column" data-board-column="${status}">
            <div class="planner-board-column-head">
              <strong>${TASK_STATUS[status]}</strong>
              <span>${group.length}</span>
            </div>
            <div class="planner-board-list" data-board-dropzone="${status}">
              ${group.map(plannerBoardCard).join("") || '<div class="planner-board-empty">Nenhuma tarefa</div>'}
            </div>
          </section>
        `;
      })
      .join("");

    els.plannerBoardView.querySelectorAll("[data-board-status]").forEach(select => {
      select.addEventListener("change", () => {
        updatePlannerTaskStatus(select.dataset.boardStatus, select.value);
      });
    });

    els.plannerBoardView.querySelectorAll("[data-board-edit-task]").forEach(button => {
      button.addEventListener("click", () => {
        openGraphTaskModal(button.dataset.boardEditTask);
      });
    });

    els.plannerBoardView.querySelectorAll("[data-board-task-id]").forEach(card => {
      card.addEventListener("dragstart", event => {
        event.dataTransfer.setData("text/plain", card.dataset.boardTaskId);
        event.dataTransfer.effectAllowed = "move";
        card.classList.add("is-dragging");
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("is-dragging");
      });
    });

    els.plannerBoardView.querySelectorAll("[data-board-dropzone]").forEach(zone => {
      zone.addEventListener("dragover", event => {
        event.preventDefault();
        zone.classList.add("is-dragover");
      });

      zone.addEventListener("dragleave", () => {
        zone.classList.remove("is-dragover");
      });

      zone.addEventListener("drop", event => {
        event.preventDefault();
        zone.classList.remove("is-dragover");
        const taskId = event.dataTransfer.getData("text/plain");
        updatePlannerTaskStatus(taskId, zone.dataset.boardDropzone);
      });
    });
  }

  function appendGraphTaskHistory(task, action, actor = currentActor()) {
    const history = Array.isArray(task?.history) ? [...task.history] : [];
    history.push({
      action,
      actorName: actor.name,
      actorEmail: actor.email,
      at: new Date().toISOString()
    });
    return history.slice(-40);
  }

  function updatePlannerTaskStatus(taskId, status) {
    if (!TASK_STATUS[status]) return;

    const tasks = loadCompanyTasks();
    const index = tasks.findIndex(task => String(task.id) === String(taskId));
    if (index < 0) return;

    const actor = currentActor();
    const task = tasks[index];
    const oldStatus = task.status || "todo";

    if (oldStatus === status) return;

    task.status = status;
    task.updatedAt = new Date().toISOString();
    task.updatedBy = actor;
    task.history = appendGraphTaskHistory(
      task,
      `Status alterado de ${TASK_STATUS[oldStatus] || oldStatus} para ${TASK_STATUS[status]}`,
      actor
    );

    tasks[index] = normalizeGraphTask(task);
    saveCompanyTasks(tasks);
    renderPlanner();

    if (selectedPlannerDate && els.graphDayDrawer?.classList.contains("active")) {
      renderGraphDayDrawer(selectedPlannerDate);
    }
  }

  function plannerInitials(value) {
    return String(value || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part[0] || "")
      .join("")
      .toUpperCase();
  }

  function graphDayTaskMarkup(task) {
    const time = plannerTaskTime(task);
    const cost = task.cost > 0 ? currency(task.cost) : "";

    return `
      <article class="graph-day-task ${taskColorClass(task)}">
        <button type="button" data-graph-edit-task="${escapeHtml(task.id)}">
          <div class="graph-day-task-top">
            <span class="graph-task-color"></span>
            <span class="graph-priority priority-${escapeHtml(task.priority)}">${escapeHtml(TASK_PRIORITY[task.priority])}</span>
            <span>${time ? escapeHtml(time) : "Sem horário"}</span>
          </div>
          <strong>${escapeHtml(task.title)}</strong>
          <div class="graph-day-task-meta">
            <span><i class="bx bx-user"></i>${escapeHtml(task.assigneeName || "Sem responsável")}</span>
            ${task.category ? `<span><i class="bx bx-tag"></i>${escapeHtml(task.category)}</span>` : ""}
            ${cost ? `<span><i class="bx bx-wallet"></i>${escapeHtml(cost)}</span>` : ""}
          </div>
        </button>

        <select data-graph-day-status="${escapeHtml(task.id)}" aria-label="Status de ${escapeHtml(task.title)}">
          ${Object.entries(TASK_STATUS)
            .map(([value, label]) => `<option value="${value}" ${task.status === value ? "selected" : ""}>${label}</option>`)
            .join("")}
        </select>
      </article>
    `;
  }

  function renderGraphDayDrawer(dateKey = selectedPlannerDate) {
    if (!dateKey || !els.graphDayDrawer) return;

    const date = taskDate({ dueDate: dateKey });
    if (!date) return;

    const tasks = loadCompanyTasks()
      .filter(task => task.dueDate === dateKey)
      .sort((a, b) => String(a.startTime || "99:99").localeCompare(String(b.startTime || "99:99")));

    const people = getPlannerPeople();
    const involved = new Set(
      tasks
        .map(task => String(task.assigneeEmail || task.assigneeId || "").toLowerCase())
        .filter(Boolean)
    );

    els.graphDayDrawerDate.textContent = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(date).replace(/^./, letter => letter.toUpperCase());

    els.graphDayTaskCount.textContent = String(tasks.length);
    els.graphDayPeopleCount.textContent = String(involved.size);
    els.graphDayDoneCount.textContent = String(tasks.filter(task => task.status === "done").length);

    els.graphDayTeam.innerHTML = people
      .map(person => {
        const key = plannerPersonKey(person);
        const count = tasks.filter(task => {
          const assignee = String(task.assigneeEmail || task.assigneeId || "").toLowerCase();
          return assignee === key;
        }).length;

        return `
          <div class="graph-day-person ${count ? "has-tasks" : ""}">
            <span class="graph-day-avatar">${escapeHtml(plannerInitials(person.name))}</span>
            <div>
              <strong>${escapeHtml(person.name)}</strong>
              <small>${escapeHtml(person.role || "Equipe")}</small>
            </div>
            <span class="graph-day-person-count">${count} tarefa${count === 1 ? "" : "s"}</span>
          </div>
        `;
      })
      .join("");

    els.graphDayTaskList.innerHTML = tasks.length
      ? tasks.map(graphDayTaskMarkup).join("")
      : `
          <div class="graph-day-empty">
            <i class="bx bx-calendar-plus"></i>
            <strong>Dia livre.</strong>
            <span>Não há tarefas cadastradas para esta data.</span>
          </div>
        `;
  }

  function openGraphDayDrawer(dateKey) {
    if (!dateKey || !els.graphDayDrawer) return;

    selectedPlannerDate = dateKey;
    renderPlanner();
    renderGraphDayDrawer(dateKey);

    els.graphDayDrawer.classList.add("active");
    els.graphDayDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeGraphDayDrawer() {
    els.graphDayDrawer?.classList.remove("active");
    els.graphDayDrawer?.setAttribute("aria-hidden", "true");
    selectedPlannerDate = "";
    renderPlanner();

    if (!document.querySelector(".modal-overlay.open")) {
      document.body.style.overflow = "";
    }
  }

  function renderPlannerChecklist() {
    if (!els.graphChecklistItems || !els.graphChecklistProgress) return;

    const done = plannerChecklistDraft.filter(item => item.done).length;
    els.graphChecklistProgress.textContent = `${done}/${plannerChecklistDraft.length} concluídas`;

    els.graphChecklistItems.innerHTML = plannerChecklistDraft.length
      ? plannerChecklistDraft.map(item => `
          <div class="graph-checklist-row" data-check-id="${escapeHtml(item.id)}">
            <label>
              <input type="checkbox" data-check-toggle="${escapeHtml(item.id)}" ${item.done ? "checked" : ""}>
              <span>${escapeHtml(item.text)}</span>
            </label>
            <button type="button" data-check-remove="${escapeHtml(item.id)}" aria-label="Remover etapa">
              <i class="bx bx-x"></i>
            </button>
          </div>
        `).join("")
      : '<div class="graph-checklist-empty">Nenhuma etapa adicionada.</div>';
  }

  function formatGraphTaskDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function renderGraphTaskAudit(task) {
    if (!els.graphTaskAudit || !els.graphTaskAuditSummary || !els.graphTaskHistoryList) return;

    if (!task) {
      els.graphTaskAudit.hidden = true;
      return;
    }

    els.graphTaskAudit.hidden = false;

    const createdName = task.createdBy?.name || "Usuário";
    const updatedName = task.updatedBy?.name || createdName;

    els.graphTaskAuditSummary.innerHTML = `
      <div>
        <span>Criada por</span>
        <strong>${escapeHtml(createdName)}</strong>
        <small>${escapeHtml(formatGraphTaskDateTime(task.createdAt))}</small>
      </div>
      <div>
        <span>Última edição</span>
        <strong>${escapeHtml(updatedName)}</strong>
        <small>${escapeHtml(formatGraphTaskDateTime(task.updatedAt))}</small>
      </div>
    `;

    const history = Array.isArray(task.history) ? [...task.history].reverse() : [];

    els.graphTaskHistoryList.innerHTML = history.length
      ? history.map(entry => `
          <div class="graph-history-item">
            <i class="bx bx-history"></i>
            <div>
              <strong>${escapeHtml(entry.action || "Alteração")}</strong>
              <span>${escapeHtml(entry.actorName || entry.actor?.name || "Usuário")} · ${escapeHtml(formatGraphTaskDateTime(entry.at))}</span>
            </div>
          </div>
        `).join("")
      : '<span class="graph-history-empty">Sem alterações registradas.</span>';
  }

  function openGraphTaskModal(taskId = "", dateKey = "") {
    const tasks = loadCompanyTasks();
    const task = taskId ? tasks.find(item => String(item.id) === String(taskId)) : null;

    editingPlannerTaskId = task?.id || "";
    plannerChecklistDraft = Array.isArray(task?.checklist)
      ? task.checklist.map(item => ({ ...item }))
      : [];

    populatePlannerPeople();

    els.graphTaskModalTitle.textContent = task ? "Editar tarefa" : "Nova tarefa";
    els.graphTaskTitle.value = task?.title || "";
    els.graphTaskDueDate.value = task?.dueDate || dateKey || selectedPlannerDate || toDateInputValue(new Date());
    els.graphTaskPriority.value = task?.priority || "medium";
    els.graphTaskStatus.value = task?.status || "todo";
    els.graphTaskCost.value = task?.cost || "";
    els.graphTaskCategory.value = task?.category || "";
    els.graphTaskStartTime.value = task?.startTime || "";
    els.graphTaskEndTime.value = task?.endTime || "";
    els.graphTaskColor.value = task?.color || "purple";
    els.graphTaskDescription.value = task?.description || "";
    els.graphTaskFeedback.textContent = "";
    els.graphDeleteTask.hidden = !task;

    const assigneeKey = task
      ? String(task.assigneeEmail || task.assigneeId || "").toLowerCase()
      : plannerPersonKey(getPlannerPeople()[0]);

    if ([...els.graphTaskAssignee.options].some(option => option.value === assigneeKey)) {
      els.graphTaskAssignee.value = assigneeKey;
    }

    renderPlannerChecklist();
    renderGraphTaskAudit(task);
    openModal(els.graphTaskModal);
    requestAnimationFrame(() => els.graphTaskTitle?.focus());
  }

  function closeGraphTaskModal() {
    closeModal(els.graphTaskModal);
    editingPlannerTaskId = "";
    plannerChecklistDraft = [];

    if (els.graphDayDrawer?.classList.contains("active")) {
      document.body.style.overflow = "hidden";
    }
  }

  function renderPlanner() {
    if (!els.plannerCalendarGrid || !els.plannerBoardView) return;

    populatePlannerPeople();

    const tasks = plannerTasks();
    const monthText = plannerMonthText();

    if (els.plannerMonthLabel) els.plannerMonthLabel.textContent = monthText;
    if (els.plannerLauncherMonth) els.plannerLauncherMonth.textContent = monthText;

    if (els.agendaPeriodMonth && !els.agendaPeriodPopover?.classList.contains("open")) {
      els.agendaPeriodMonth.value = String(selectedMonth);
    }

    if (els.agendaPeriodYear && !els.agendaPeriodPopover?.classList.contains("open")) {
      els.agendaPeriodYear.value = String(plannerYear);
    }

    renderPlannerSummary(tasks);
    renderPlannerCalendar(tasks);
    renderPlannerBoard(tasks);

    if (els.plannerCalendarView) {
      els.plannerCalendarView.hidden = plannerView !== "calendar";
    }

    els.plannerBoardView.hidden = plannerView !== "board";

    document.querySelectorAll("[data-planner-view]").forEach(button => {
      const active = button.dataset.plannerView === plannerView;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    if (selectedPlannerDate && els.graphDayDrawer?.classList.contains("active")) {
      renderGraphDayDrawer(selectedPlannerDate);
    }
  }

  function changePlannerMonth(delta) {
    const cursor = new Date(plannerYear, selectedMonth + delta, 1);
    plannerYear = cursor.getFullYear();
    selectedMonth = cursor.getMonth();
    selectedPlannerDate = "";
    els.monthFilter.value = String(selectedMonth);
    renderAll();
  }

  function setAgendaPeriodPopover(open) {
    if (!els.agendaPeriodPopover || !els.plannerJumpBtn) return;

    els.agendaPeriodPopover.classList.toggle("open", open);
    els.agendaPeriodPopover.setAttribute("aria-hidden", String(!open));
    els.plannerJumpBtn.setAttribute("aria-expanded", String(open));
    els.agendaQuickPicker?.classList.toggle("is-open", open);

    if (open) {
      if (els.agendaPeriodMonth) els.agendaPeriodMonth.value = String(selectedMonth);
      if (els.agendaPeriodYear) els.agendaPeriodYear.value = String(plannerYear);

      requestAnimationFrame(() => {
        els.agendaPeriodMonth?.focus();
      });
    }
  }

  function applyAgendaPeriod(monthValue, yearValue) {
    const month = clamp(Number(monthValue), 0, 11);
    const year = clamp(Number(yearValue), 2020, 2100);

    selectedMonth = month;
    plannerYear = year;
    selectedPlannerDate = "";
    els.monthFilter.value = String(selectedMonth);

    setAgendaPeriodPopover(false);
    renderAll();
  }

  function initPlanner() {
    els.plannerJumpBtn?.addEventListener("click", event => {
      event.stopPropagation();

      const isOpen = els.agendaPeriodPopover?.classList.contains("open");
      setAgendaPeriodPopover(!isOpen);
    });

    els.agendaPeriodClose?.addEventListener("click", () => {
      setAgendaPeriodPopover(false);
      els.plannerJumpBtn?.focus();
    });

    els.agendaPeriodApply?.addEventListener("click", () => {
      applyAgendaPeriod(
        els.agendaPeriodMonth?.value ?? selectedMonth,
        els.agendaPeriodYear?.value ?? plannerYear
      );
    });

    els.agendaPeriodToday?.addEventListener("click", () => {
      const today = new Date();

      applyAgendaPeriod(
        today.getMonth(),
        today.getFullYear()
      );
    });

    els.agendaPeriodYear?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        els.agendaPeriodApply?.click();
      }
    });

    document.addEventListener("click", event => {
      if (
        els.agendaQuickPicker &&
        !els.agendaQuickPicker.contains(event.target)
      ) {
        setAgendaPeriodPopover(false);
      }
    });

    els.plannerPrevMonth?.addEventListener("click", () => changePlannerMonth(-1));
    els.plannerNextMonth?.addEventListener("click", () => changePlannerMonth(1));

    els.plannerTodayBtn?.addEventListener("click", () => {
      const today = new Date();
      plannerYear = today.getFullYear();
      selectedMonth = today.getMonth();
      els.monthFilter.value = String(selectedMonth);
      openGraphDayDrawer(toDateInputValue(today));
      renderAll();
    });

    els.plannerNewTaskBtn?.addEventListener("click", () => {
      openGraphTaskModal("", selectedPlannerDate || toDateInputValue(new Date()));
    });

    els.plannerAssigneeFilter?.addEventListener("change", renderPlanner);
    els.plannerPriorityFilter?.addEventListener("change", renderPlanner);

    document.querySelectorAll("[data-planner-view]").forEach(button => {
      button.addEventListener("click", () => {
        plannerView = button.dataset.plannerView === "board" ? "board" : "calendar";
        renderPlanner();
      });
    });

    els.graphCloseDayDrawer?.addEventListener("click", closeGraphDayDrawer);

    els.graphDayDrawer?.addEventListener("click", event => {
      if (event.target === els.graphDayDrawer) closeGraphDayDrawer();
    });

    els.graphNewTaskForDay?.addEventListener("click", () => {
      openGraphTaskModal("", selectedPlannerDate || toDateInputValue(new Date()));
    });

    els.graphDayTaskList?.addEventListener("click", event => {
      const button = event.target.closest("[data-graph-edit-task]");
      if (button) openGraphTaskModal(button.dataset.graphEditTask);
    });

    els.graphDayTaskList?.addEventListener("change", event => {
      const select = event.target.closest("[data-graph-day-status]");
      if (select) updatePlannerTaskStatus(select.dataset.graphDayStatus, select.value);
    });

    els.graphCloseTaskModal?.addEventListener("click", closeGraphTaskModal);
    els.graphCancelTask?.addEventListener("click", closeGraphTaskModal);

    els.graphAddChecklistItem?.addEventListener("click", () => {
      const text = els.graphChecklistNew?.value.trim();
      if (!text) {
        els.graphChecklistNew?.focus();
        return;
      }

      plannerChecklistDraft.push({
        id: `check_${Date.now().toString(36)}`,
        text,
        done: false
      });

      els.graphChecklistNew.value = "";
      renderPlannerChecklist();
      els.graphChecklistNew.focus();
    });

    els.graphChecklistNew?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        els.graphAddChecklistItem?.click();
      }
    });

    els.graphChecklistItems?.addEventListener("change", event => {
      const checkbox = event.target.closest("[data-check-toggle]");
      if (!checkbox) return;

      const item = plannerChecklistDraft.find(entry => entry.id === checkbox.dataset.checkToggle);
      if (item) {
        item.done = checkbox.checked;
        renderPlannerChecklist();
      }
    });

    els.graphChecklistItems?.addEventListener("click", event => {
      const button = event.target.closest("[data-check-remove]");
      if (!button) return;

      plannerChecklistDraft = plannerChecklistDraft.filter(
        item => item.id !== button.dataset.checkRemove
      );
      renderPlannerChecklist();
    });

    els.graphTaskForm?.addEventListener("submit", event => {
      event.preventDefault();

      const title = els.graphTaskTitle.value.trim();
      const dueDate = els.graphTaskDueDate.value;
      const assigneeKey = els.graphTaskAssignee.value;
      const startTime = els.graphTaskStartTime.value;
      const endTime = els.graphTaskEndTime.value;

      if (!title) {
        els.graphTaskFeedback.textContent = "Informe o nome da tarefa.";
        els.graphTaskTitle.focus();
        return;
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        els.graphTaskFeedback.textContent = "Informe uma data válida.";
        els.graphTaskDueDate.focus();
        return;
      }

      if (startTime && endTime && endTime <= startTime) {
        els.graphTaskFeedback.textContent = "O horário final precisa ser depois do horário inicial.";
        els.graphTaskEndTime.focus();
        return;
      }

      const person = getPlannerPeople().find(item => plannerPersonKey(item) === assigneeKey);
      if (!person) {
        els.graphTaskFeedback.textContent = "Selecione um responsável válido.";
        els.graphTaskAssignee.focus();
        return;
      }

      const tasks = loadCompanyTasks();
      const actor = currentActor();
      const now = new Date().toISOString();
      const existingIndex = tasks.findIndex(task => task.id === editingPlannerTaskId);

      if (existingIndex >= 0) {
        const existing = tasks[existingIndex];
        const oldStatus = existing.status;

        const updated = normalizeGraphTask({
          ...existing,
          title,
          assigneeId: person.id,
          assigneeName: person.name,
          assigneeEmail: person.email,
          dueDate,
          startTime,
          endTime,
          color: els.graphTaskColor.value,
          priority: els.graphTaskPriority.value,
          status: els.graphTaskStatus.value,
          cost: numberValue(els.graphTaskCost.value),
          category: els.graphTaskCategory.value.trim(),
          description: els.graphTaskDescription.value.trim(),
          checklist: plannerChecklistDraft.map(item => ({ ...item })),
          updatedAt: now,
          updatedBy: actor
        });

        updated.history = appendGraphTaskHistory(
          updated,
          oldStatus !== updated.status
            ? `Tarefa editada · status: ${TASK_STATUS[updated.status]}`
            : "Tarefa editada",
          actor
        );

        tasks[existingIndex] = updated;
      } else {
        const created = normalizeGraphTask({
          id: `task_${Date.now().toString(36)}`,
          title,
          assigneeId: person.id,
          assigneeName: person.name,
          assigneeEmail: person.email,
          dueDate,
          startTime,
          endTime,
          color: els.graphTaskColor.value,
          priority: els.graphTaskPriority.value,
          status: els.graphTaskStatus.value,
          cost: numberValue(els.graphTaskCost.value),
          category: els.graphTaskCategory.value.trim(),
          description: els.graphTaskDescription.value.trim(),
          checklist: plannerChecklistDraft.map(item => ({ ...item })),
          createdAt: now,
          createdBy: actor,
          updatedAt: now,
          updatedBy: actor,
          history: [{
            action: "Tarefa criada",
            actorName: actor.name,
            actorEmail: actor.email,
            at: now
          }]
        });

        tasks.push(created);
      }

      saveCompanyTasks(tasks);

      const savedDate = taskDate({ dueDate });
      if (savedDate) {
        plannerYear = savedDate.getFullYear();
        selectedMonth = savedDate.getMonth();
        selectedPlannerDate = dueDate;
        els.monthFilter.value = String(selectedMonth);
      }

      closeGraphTaskModal();
      renderAll();

      if (selectedPlannerDate) {
        openGraphDayDrawer(selectedPlannerDate);
      }
    });

    els.graphDeleteTask?.addEventListener("click", () => {
      if (!editingPlannerTaskId) return;

      const tasks = loadCompanyTasks();
      const task = tasks.find(item => item.id === editingPlannerTaskId);
      if (!task) return;

      if (!window.confirm(`Excluir a tarefa "${task.title}"?`)) return;

      saveCompanyTasks(tasks.filter(item => item.id !== editingPlannerTaskId));
      closeGraphTaskModal();
      renderAll();

      if (selectedPlannerDate) {
        renderGraphDayDrawer(selectedPlannerDate);
      }
    });

    window.addEventListener("storage", event => {
      if ([TASKS_KEY, TEAM_KEY, PROFILE_KEY, BUSINESS_OWNER_KEY].includes(event.key)) {
        renderPlanner();
      }
    });
  }


  function statCard(label, value, icon, helper) {
    return `
      <article class="stat-card">
        <div class="stat-top">
          <span class="stat-label">${escapeHtml(label)}</span>
          <span class="stat-icon"><i class="bx ${icon}"></i></span>
        </div>
        <div class="stat-value">${escapeHtml(value)}</div>
        <div class="stat-foot">${helper}</div>
      </article>
    `;
  }

  function comparisonText(current, previous, positiveIsGood = true) {
    const change = changePercent(current, previous);
    if (change === null || !Number.isFinite(change)) {
      return "Sem base suficiente para comparar com o mês anterior.";
    }

    const positive = change >= 0;
    const good = positiveIsGood ? positive : !positive;
    const sign = positive ? "+" : "";

    return `<strong style="color:var(${good ? "--green" : "--red"})">${sign}${percent(change)}</strong> em relação ao mês anterior.`;
  }

  function renderStats() {
    const current = monthMetrics(selectedMonth);
    const previous = selectedMonth > 0 ? monthMetrics(selectedMonth - 1) : null;

    els.statsGrid.innerHTML =
      statCard(
        "Faturamento",
        currency(current.revenue),
        "bx-wallet",
        previous ? comparisonText(current.revenue, previous.revenue, true) : "Primeiro mês do período."
      ) +
      statCard(
        "Custos",
        currency(current.costs),
        "bx-receipt",
        previous ? comparisonText(current.costs, previous.costs, false) : "Soma dos custos dos produtos vendidos."
      ) +
      statCard(
        "Margem estimada",
        percent(current.marginPct),
        "bx-line-chart",
        current.revenue > 0
          ? `Resultado estimado de <strong>${currency(current.margin)}</strong>.`
          : "Cadastre vendas para calcular a margem."
      ) +
      statCard(
        "Unidades vendidas",
        String(current.units),
        "bx-package",
        `<strong>${current.products.length}</strong> cadastro(s) neste mês.`
      );
  }

  function renderChart() {
    const metrics = monthNames.map((_, index) => monthMetrics(index));
    const maxValue = Math.max(
      1,
      ...metrics.flatMap(metric => [metric.revenue, metric.costs])
    );

    els.chartBars.innerHTML = "";

    metrics.forEach((metric, index) => {
      const column = document.createElement("div");
      column.className = "month-col" + (index === selectedMonth ? " selected" : "");
      column.setAttribute("role", "button");
      column.setAttribute("tabindex", "0");
      column.setAttribute("aria-label", monthNames[index] + ": faturamento " + currency(metric.revenue) + ", custos " + currency(metric.costs));

      const pair = document.createElement("div");
      pair.className = "bars-pair";

      const revenueBar = createBar(
        "revenue",
        metric.revenue,
        maxValue,
        "Faturamento",
        monthNames[index]
      );

      const costBar = createBar(
        "cost",
        metric.costs,
        maxValue,
        "Custos",
        monthNames[index]
      );

      const label = document.createElement("span");
      label.className = "month-label";
      label.textContent = monthNames[index];

      pair.append(revenueBar, costBar);
      column.append(pair, label);

      const selectMonth = () => {
        selectedMonth = index;
        els.monthFilter.value = String(index);

        document.querySelectorAll(".month-chip").forEach((chip, chipIndex) => {
          chip.setAttribute("aria-selected", String(chipIndex === selectedMonth));
        });

        renderAll();
      };

      column.addEventListener("click", selectMonth);
      column.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectMonth();
        }
      });

      els.chartBars.appendChild(column);
    });
  }

  function createBar(className, value, maxValue, label, month) {
    const bar = document.createElement("div");
    bar.className = "bar " + className;
    bar.style.height = Math.max(4, (value / maxValue) * 100) + "%";
    bar.setAttribute("tabindex", "-1");

    const show = event => {
      const wrapRect = els.chartBars.parentElement.getBoundingClientRect();
      const barRect = bar.getBoundingClientRect();

      els.chartTooltip.textContent = label + " · " + month + ": " + currency(value);
      els.chartTooltip.style.left = (barRect.left - wrapRect.left + barRect.width / 2) + "px";
      els.chartTooltip.style.top = (barRect.top - wrapRect.top) + "px";
      els.chartTooltip.classList.add("show");
    };

    bar.addEventListener("mouseenter", show);
    bar.addEventListener("focus", show);
    bar.addEventListener("mouseleave", hideTooltip);
    bar.addEventListener("blur", hideTooltip);

    return bar;
  }

  function hideTooltip() {
    els.chartTooltip.classList.remove("show");
  }

  function renderInsights() {
    const metrics = monthMetrics(selectedMonth);
    const monthProducts = metrics.products;

    const averageSalePrice = metrics.units > 0
      ? metrics.revenue / metrics.units
      : 0;

    const bestProduct = monthProducts
      .filter(product => numberValue(product.salePrice) > 0)
      .sort((a, b) => productMarginPct(b) - productMarginPct(a))[0];

    const averageMargin = monthProducts.length
      ? monthProducts.reduce((sum, product) => sum + productMarginPct(product), 0) / monthProducts.length
      : 0;

    els.insightList.innerHTML = `
      <div class="insight-item">
        <span>Preço médio de venda</span>
        <strong>${currency(averageSalePrice)}</strong>
        <small>Valor médio por unidade vendida no mês.</small>
      </div>

      <div class="insight-item">
        <span>Margem média</span>
        <strong>${percent(averageMargin)}</strong>
        <small>Média das margens dos produtos cadastrados no mês.</small>
      </div>

      <div class="insight-item">
        <span>Melhor margem</span>
        <strong>${bestProduct ? escapeHtml(bestProduct.name) : "Sem dados"}</strong>
        <small>${bestProduct ? percent(productMarginPct(bestProduct)) + " de margem sobre a venda." : "Cadastre produtos para comparar."}</small>
      </div>
    `;
  }

  function refreshCategoryFilter() {
    const current = els.categoryFilter.value;
    const categories = [...new Set(products.map(product => product.category.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));

    els.categoryFilter.innerHTML =
      '<option value="">Todas as categorias</option>' +
      categories
        .map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
        .join("");

    if (categories.includes(current)) {
      els.categoryFilter.value = current;
    }
  }

  function marginClass(marginPct) {
    if (marginPct < 0) return "bad";
    if (marginPct < 20) return "warn";
    return "good";
  }

  function renderProducts() {
    refreshCategoryFilter();

    const query = els.searchProduct.value.trim().toLocaleLowerCase("pt-BR");
    const category = els.categoryFilter.value;

    const filtered = products
      .slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .filter(product => {
        const matchesQuery =
          !query ||
          product.name.toLocaleLowerCase("pt-BR").includes(query) ||
          product.category.toLocaleLowerCase("pt-BR").includes(query);

        const matchesCategory = !category || product.category === category;
        return matchesQuery && matchesCategory;
      });

    els.productsEmpty.hidden = filtered.length > 0;
    els.productsBody.innerHTML = filtered.map(product => {
      const cost = totalUnitCost(product);
      const marginPct = productMarginPct(product);

      return `
        <tr>
          <td class="product-name-cell">
            <strong>${escapeHtml(product.name)}</strong>
            <span>${formatDate(product.date)}</span>
          </td>
          <td><span class="category-tag">${escapeHtml(product.category)}</span></td>
          <td>${currency(cost)}</td>
          <td><strong style="color:var(--text-primary)">${currency(product.salePrice)}</strong></td>
          <td><span class="margin-tag ${marginClass(marginPct)}">${percent(marginPct)}</span></td>
          <td>${Math.round(numberValue(product.units))}</td>
          <td>
            <div class="row-actions">
              <button class="icon-btn danger" type="button" data-delete-product="${product.id}" aria-label="Excluir ${escapeHtml(product.name)}" title="Excluir produto">
                <i class="bx bx-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    els.productsBody.querySelectorAll("[data-delete-product]").forEach(button => {
      button.addEventListener("click", () => {
        removeProduct(button.dataset.deleteProduct);
      });
    });
  }

  function addCostRow(label = "", value = "") {
    const row = document.createElement("div");
    row.className = "cost-row";

    row.innerHTML = `
      <input type="text" class="cost-label" maxlength="40" placeholder="Ex: Embalagem" aria-label="Nome do custo adicional">
      <input type="number" class="cost-value" min="0" step="0.01" inputmode="decimal" placeholder="0,00" aria-label="Valor do custo adicional">
      <button class="remove-cost" type="button" aria-label="Remover custo adicional"><i class="bx bx-trash"></i></button>
    `;

    row.querySelector(".cost-label").value = label;
    row.querySelector(".cost-value").value = value;

    row.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", updatePricingPreview);
    });

    row.querySelector(".remove-cost").addEventListener("click", () => {
      row.remove();
      updatePricingPreview();
    });

    els.additionalCosts.appendChild(row);
    updatePricingPreview();
  }

  function additionalCostsFromForm() {
    return [...els.additionalCosts.querySelectorAll(".cost-row")]
      .map(row => ({
        label: row.querySelector(".cost-label").value.trim() || "Custo adicional",
        value: Math.max(0, numberValue(row.querySelector(".cost-value").value))
      }))
      .filter(item => item.value > 0);
  }

  function pricingFromForm() {
    const baseCost = Math.max(0, numberValue(els.baseCostInput.value));
    const extras = additionalCostsFromForm();
    const totalCost = baseCost + extras.reduce((sum, item) => sum + item.value, 0);
    const targetMargin = clamp(numberValue(els.targetMarginInput.value), 0, 95);
    const salePrice = Math.max(0, numberValue(els.salePriceInput.value));
    const units = Math.max(0, Math.round(numberValue(els.unitsSoldInput.value)));

    const suggestedPrice = targetMargin >= 100
      ? 0
      : totalCost / (1 - targetMargin / 100);

    const unitMargin = salePrice - totalCost;
    const marginPct = salePrice > 0 ? (unitMargin / salePrice) * 100 : 0;
    const revenue = salePrice * units;

    return {
      baseCost,
      extras,
      totalCost,
      targetMargin,
      salePrice,
      units,
      suggestedPrice,
      unitMargin,
      marginPct,
      revenue
    };
  }

  function updatePricingPreview() {
    const pricing = pricingFromForm();
    const name = els.productNameInput.value.trim();

    els.previewProductName.textContent = name || "Novo produto";
    els.previewSalePrice.textContent = currency(pricing.salePrice);
    els.previewTotalCost.textContent = currency(pricing.totalCost);
    els.previewUnitMargin.textContent = currency(pricing.unitMargin);
    els.previewMarginPct.textContent = percent(pricing.marginPct);
    els.previewRevenue.textContent = currency(pricing.revenue);
    els.suggestedPrice.textContent = currency(pricing.suggestedPrice);

    els.previewStatus.className = "preview-status";

    if (pricing.totalCost <= 0 || pricing.salePrice <= 0) {
      els.previewStatus.textContent = "Informe os custos e o preço para analisar a margem.";
      return;
    }

    if (pricing.unitMargin < 0) {
      els.previewStatus.classList.add("bad");
      els.previewStatus.textContent = "O preço está abaixo do custo total. Revise a precificação.";
      return;
    }

    if (pricing.marginPct + 0.01 < pricing.targetMargin) {
      els.previewStatus.classList.add("warn");
      els.previewStatus.textContent = "A margem atual está abaixo da margem desejada.";
      return;
    }

    els.previewStatus.classList.add("good");
    els.previewStatus.textContent = "A margem atual atende à meta definida.";
  }

  function resetProductForm() {
    els.productForm.reset();
    els.productNameInput.value = "";
    els.productCategoryInput.value = "";
    els.baseCostInput.value = "";
    els.targetMarginInput.value = "30";
    els.salePriceInput.value = "";
    els.unitsSoldInput.value = "1";
    els.productDateInput.value = toDateInputValue(new Date());
    els.additionalCosts.innerHTML = "";
    els.productFormError.textContent = "";
    updatePricingPreview();
  }

  function openModal(modal) {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      const firstInput = modal.querySelector("input, select, button");
      firstInput?.focus();
    });
  }

  function closeModal(modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");

    if (!document.querySelector(".modal-overlay.open")) {
      document.body.style.overflow = "";
    }
  }

  function openProductModal() {
    resetProductForm();
    openModal(els.modalProduct);
    requestAnimationFrame(() => els.productNameInput.focus());
  }

  function renderManageList() {
    if (!products.length) {
      els.manageList.innerHTML = `
        <div class="empty-state">
          <i class="bx bx-package"></i>
          <strong>Nenhum produto cadastrado</strong>
          <span>Cadastre um produto para começar.</span>
        </div>
      `;
      return;
    }

    els.manageList.innerHTML = products
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .map(product => `
        <div class="manage-row">
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            <span>${escapeHtml(product.category)} · ${currency(product.salePrice)} · margem ${percent(productMarginPct(product))}</span>
          </div>
          <button class="icon-btn danger" type="button" data-manage-delete="${product.id}" aria-label="Excluir ${escapeHtml(product.name)}">
            <i class="bx bx-trash"></i>
          </button>
        </div>
      `)
      .join("");

    els.manageList.querySelectorAll("[data-manage-delete]").forEach(button => {
      button.addEventListener("click", () => {
        removeProduct(button.dataset.manageDelete);
        renderManageList();
      });
    });
  }

  function removeProduct(productId) {
    const product = products.find(item => item.id === productId);
    if (!product) return;

    products = products.filter(item => item.id !== productId);
    saveProducts();
    renderAll();
    showToast("Produto removido: " + product.name);
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2600);
  }

  function renderAll() {
    renderStats();
    renderChart();
    renderInsights();
    renderProducts();
    renderPlanner();
  }

  els.searchProduct.addEventListener("input", renderProducts);
  els.categoryFilter.addEventListener("change", renderProducts);

  [els.newProductBtn, els.newProductBtn2].forEach(button => {
    button.addEventListener("click", openProductModal);
  });

  els.manageProductsBtn.addEventListener("click", () => {
    renderManageList();
    openModal(els.modalManage);
  });

  els.addCostBtn.addEventListener("click", () => {
    addCostRow("", "");
    const rows = els.additionalCosts.querySelectorAll(".cost-row");
    rows[rows.length - 1]?.querySelector(".cost-label")?.focus();
  });

  els.useSuggestedPriceBtn.addEventListener("click", () => {
    const pricing = pricingFromForm();

    if (pricing.totalCost <= 0) {
      els.productFormError.textContent = "Informe primeiro o custo do produto.";
      els.baseCostInput.focus();
      return;
    }

    els.salePriceInput.value = pricing.suggestedPrice.toFixed(2);
    els.productFormError.textContent = "";
    updatePricingPreview();
    els.salePriceInput.focus();
  });

  [
    els.productNameInput,
    els.productCategoryInput,
    els.baseCostInput,
    els.targetMarginInput,
    els.salePriceInput,
    els.unitsSoldInput
  ].forEach(input => {
    input.addEventListener("input", updatePricingPreview);
  });

  els.productForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = els.productNameInput.value.trim();
    const category = els.productCategoryInput.value.trim() || "Sem categoria";
    const pricing = pricingFromForm();
    const date = els.productDateInput.value;

    if (!name) {
      els.productFormError.textContent = "Informe o nome do produto.";
      els.productNameInput.focus();
      return;
    }

    if (pricing.totalCost <= 0) {
      els.productFormError.textContent = "Informe um custo total maior que zero.";
      els.baseCostInput.focus();
      return;
    }

    if (pricing.salePrice <= 0) {
      els.productFormError.textContent = "Informe um preço de venda maior que zero.";
      els.salePriceInput.focus();
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      els.productFormError.textContent = "Informe uma data válida.";
      els.productDateInput.focus();
      return;
    }

    products.push(normalizeProduct({
      id: id(),
      name,
      category,
      baseCost: pricing.baseCost,
      additionalCosts: pricing.extras,
      targetMargin: pricing.targetMargin,
      salePrice: pricing.salePrice,
      units: pricing.units,
      date
    }));

    selectedMonth = monthFromDate(date);
    els.monthFilter.value = String(selectedMonth);

    saveProducts();
    closeModal(els.modalProduct);
    renderAll();
    showToast("Produto cadastrado com sucesso.");
  });

  document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
      const overlay = button.closest(".modal-overlay");
      if (overlay) closeModal(overlay);
    });
  });

  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("mousedown", event => {
      if (event.target !== overlay) return;

      if (overlay === els.graphTaskModal) {
        closeGraphTaskModal();
      } else {
        closeModal(overlay);
      }
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    if (els.agendaPeriodPopover?.classList.contains("open")) {
      setAgendaPeriodPopover(false);
      els.plannerJumpBtn?.focus();
      return;
    }

    if (els.graphTaskModal?.classList.contains("open")) {
      closeGraphTaskModal();
      return;
    }

    if (els.graphDayDrawer?.classList.contains("active")) {
      closeGraphDayDrawer();
      return;
    }

    document.querySelectorAll(".modal-overlay.open").forEach(closeModal);
  });

  initMonthFilter();
  initPlanner();
  renderAll();
})();
