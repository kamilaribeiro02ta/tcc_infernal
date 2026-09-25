document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const PROFILE_KEY = "zuz-profile";
  const PHOTO_EXPORT_SIZE = 720;
  const PHOTO_SOURCE_MAX = 1600;

  const $ = id => document.getElementById(id);

  const profileName = $("profileName");
  const profileEmail = $("profileEmail");
  const accountName = $("accountName");
  const accountEmail = $("accountEmail");
  const accountCreatedAt = $("accountCreatedAt");

  const profileImage = $("profileImage");
  const profilePlaceholder = $("profilePlaceholder");
  const profilePhotoInput = $("profilePhotoInput");
  const changePhotoBtn = $("changePhotoBtn");
  const openPhotoEditorBtn = $("openPhotoEditorBtn");

  const bannerImage = $("bannerImage");
  const bannerInput = $("bannerInput");
  const changeBannerBtn = $("changeBannerBtn");

  const sidebarProfileImage = $("sidebarProfileImage");
  const sidebarDefaultAvatar = $("sidebarDefaultAvatar");
  const sidebarUserName = $("sidebarUserName");
  const sidebarUserSubtitle = $("sidebarUserSubtitle");

  const profileModal = $("profileModal");
  const editProfileBtn = $("editProfileBtn");
  const closeProfileModal = $("closeProfileModal");
  const cancelProfileBtn = $("cancelProfileBtn");
  const profileForm = $("profileForm");
  const officialNameInput = $("officialNameInput");

  const photoEditorModal = $("photoEditorModal");
  const closePhotoEditorBtn = $("closePhotoEditorBtn");
  const cancelPhotoEditorBtn = $("cancelPhotoEditorBtn");
  const replacePhotoBtn = $("replacePhotoBtn");
  const centerPhotoBtn = $("centerPhotoBtn");
  const savePhotoEditorBtn = $("savePhotoEditorBtn");
  const photoEditorStage = $("photoEditorStage");
  const photoEditorCanvas = $("photoEditorCanvas");
  const photoZoom = $("photoZoom");
  const photoZoomValue = $("photoZoomValue");

  const profileProducts = $("profileProducts");
  const profileCategories = $("profileCategories");
  const profileAverageMargin = $("profileAverageMargin");
  const profileRevenue = $("profileRevenue");

  const themeToggle = $("themeToggle");
  const themeLabel = $("themeLabel");
  const iconSun = $("iconSun");
  const iconMoon = $("iconMoon");

  const defaultProfile = {
    name: "Usuário ZUZ",
    email: "email@exemplo.com",
    createdAt: new Date().toISOString(),
    photo: "",
    photoSource: "",
    photoCrop: {
      zoom: 1,
      offsetX: 0,
      offsetY: 0
    },
    banner: ""
  };

  let lastFocusedElement = null;

  const editor = {
    image: null,
    source: "",
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    minScale: 1,
    dragging: false,
    pointerId: null,
    lastX: 0,
    lastY: 0
  };

  /* =========================
     TEMA
  ========================= */

  function applyTheme(isDark) {
    document.body.classList.toggle("dark", isDark);
    themeToggle?.setAttribute("aria-pressed", String(isDark));

    if (themeLabel) {
      themeLabel.textContent = isDark ? "MODO ESCURO" : "MODO CLARO";
    }

    if (iconSun) {
      iconSun.style.display = isDark ? "none" : "block";
    }

    if (iconMoon) {
      iconMoon.style.display = isDark ? "block" : "none";
    }
  }

  const savedTheme = localStorage.getItem("zuz-theme");
  applyTheme(savedTheme === "dark");

  themeToggle?.addEventListener("click", () => {
    const isDark = !document.body.classList.contains("dark");
    localStorage.setItem("zuz-theme", isDark ? "dark" : "light");
    applyTheme(isDark);
  });

  /* =========================
     PERFIL
  ========================= */

  function getProfile() {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (!saved) return { ...defaultProfile, photoCrop: { ...defaultProfile.photoCrop } };

      const parsed = JSON.parse(saved);
      return {
        ...defaultProfile,
        ...parsed,
        photoCrop: {
          ...defaultProfile.photoCrop,
          ...(parsed.photoCrop || {})
        }
      };
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      return { ...defaultProfile, photoCrop: { ...defaultProfile.photoCrop } };
    }
  }

  function saveProfile(profile) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      return true;
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert("Não foi possível salvar o perfil. Tente usar imagens menores.");
      return false;
    }
  }

  function formatDate(value) {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  function firstName(fullName) {
    const clean = String(fullName || "").trim();
    return clean ? clean.split(/\s+/)[0] : "Minha Conta";
  }

  function renderProfile() {
    const profile = getProfile();

    if (profileName) profileName.textContent = profile.name;
    if (accountName) accountName.textContent = profile.name;
    if (profileEmail) profileEmail.textContent = profile.email;
    if (accountEmail) accountEmail.textContent = profile.email;
    if (accountCreatedAt) accountCreatedAt.textContent = formatDate(profile.createdAt);

    if (sidebarUserName) sidebarUserName.textContent = firstName(profile.name);
    if (sidebarUserSubtitle) sidebarUserSubtitle.textContent = "Meu perfil";

    const hasPhoto = Boolean(profile.photo);

    if (profileImage) {
      if (hasPhoto) {
        profileImage.src = profile.photo;
        profileImage.hidden = false;
      } else {
        profileImage.hidden = true;
        profileImage.removeAttribute("src");
      }
    }

    if (profilePlaceholder) {
      profilePlaceholder.hidden = hasPhoto;
    }

    if (sidebarProfileImage) {
      if (hasPhoto) {
        sidebarProfileImage.src = profile.photo;
        sidebarProfileImage.hidden = false;
      } else {
        sidebarProfileImage.hidden = true;
        sidebarProfileImage.removeAttribute("src");
      }
    }

    if (sidebarDefaultAvatar) {
      sidebarDefaultAvatar.style.display = hasPhoto ? "none" : "";
    }

    if (bannerImage) {
      if (profile.banner) {
        bannerImage.src = profile.banner;
        bannerImage.hidden = false;
      } else {
        bannerImage.hidden = true;
        bannerImage.removeAttribute("src");
      }
    }
  }

  /* =========================
     MODAL PERFIL
  ========================= */

  function openModal(modal, focusTarget) {
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      focusTarget?.focus();
    });
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lastFocusedElement?.focus?.();
  }

  editProfileBtn?.addEventListener("click", () => {
    const profile = getProfile();
    if (officialNameInput) officialNameInput.value = profile.name || "";
    openModal(profileModal, officialNameInput);
  });

  closeProfileModal?.addEventListener("click", () => closeModal(profileModal));
  cancelProfileBtn?.addEventListener("click", () => closeModal(profileModal));

  profileModal?.addEventListener("click", event => {
    if (event.target === profileModal) closeModal(profileModal);
  });

  profileForm?.addEventListener("submit", event => {
    event.preventDefault();
    const newName = officialNameInput?.value.trim();
    if (!newName) {
      officialNameInput?.focus();
      return;
    }

    const profile = getProfile();
    profile.name = newName;

    if (saveProfile(profile)) {
      renderProfile();
      closeModal(profileModal);
    }
  });

  /* =========================
     UTILIDADES DE IMAGEM
  ========================= */

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  async function normalizeImageSource(file, maxDimension = PHOTO_SOURCE_MAX, quality = 0.9) {
    const raw = await readFileAsDataURL(file);
    const image = await loadImage(raw);

    const longest = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = Math.min(1, maxDimension / longest);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível.");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/webp", quality);
  }

  async function prepareBanner(file) {
    return normalizeImageSource(file, 1800, 0.84);
  }

  /* =========================
     EDITOR DE FOTO
  ========================= */

  function stageSize() {
    if (!photoEditorCanvas) return 420;
    const rect = photoEditorCanvas.getBoundingClientRect();
    return rect.width || 420;
  }

  function calculateMinScale(image, size) {
    return Math.max(size / image.naturalWidth, size / image.naturalHeight);
  }

  function clampEditorOffset() {
    if (!editor.image) return;

    const size = stageSize();
    const scale = editor.minScale * editor.zoom;
    const renderedWidth = editor.image.naturalWidth * scale;
    const renderedHeight = editor.image.naturalHeight * scale;

    const maxX = Math.max(0, (renderedWidth - size) / 2);
    const maxY = Math.max(0, (renderedHeight - size) / 2);

    editor.offsetX = Math.max(-maxX, Math.min(maxX, editor.offsetX));
    editor.offsetY = Math.max(-maxY, Math.min(maxY, editor.offsetY));
  }

  function renderPhotoEditor() {
    if (!photoEditorCanvas || !editor.image) return;

    const cssSize = stageSize();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const pixelSize = Math.round(cssSize * dpr);

    if (photoEditorCanvas.width !== pixelSize || photoEditorCanvas.height !== pixelSize) {
      photoEditorCanvas.width = pixelSize;
      photoEditorCanvas.height = pixelSize;
    }

    const ctx = photoEditorCanvas.getContext("2d");
    if (!ctx) return;

    editor.minScale = calculateMinScale(editor.image, cssSize);
    clampEditorOffset();

    const scale = editor.minScale * editor.zoom;
    const drawWidth = editor.image.naturalWidth * scale;
    const drawHeight = editor.image.naturalHeight * scale;
    const x = (cssSize - drawWidth) / 2 + editor.offsetX;
    const y = (cssSize - drawHeight) / 2 + editor.offsetY;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssSize, cssSize);
    ctx.fillStyle = document.body.classList.contains("dark") ? "#17102f" : "#eeeaff";
    ctx.fillRect(0, 0, cssSize, cssSize);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(editor.image, x, y, drawWidth, drawHeight);

    if (photoZoomValue) {
      photoZoomValue.textContent = `${Math.round(editor.zoom * 100)}%`;
    }
  }

  async function startPhotoEditor(source, crop = null) {
    try {
      editor.source = source;
      editor.image = await loadImage(source);

      const size = stageSize();
      editor.minScale = calculateMinScale(editor.image, size);
      editor.zoom = Math.min(3, Math.max(1, Number(crop?.zoom) || 1));
      editor.offsetX = (Number(crop?.offsetX) || 0) * size;
      editor.offsetY = (Number(crop?.offsetY) || 0) * size;

      if (photoZoom) {
        photoZoom.value = String(editor.zoom);
      }

      clampEditorOffset();
      openModal(photoEditorModal, photoZoom);
      requestAnimationFrame(renderPhotoEditor);
    } catch (error) {
      console.error("Erro ao abrir editor de foto:", error);
      alert("Não foi possível abrir essa imagem.");
    }
  }

  async function handlePhotoFile(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Selecione uma imagem válida.");
      return;
    }

    try {
      const source = await normalizeImageSource(file);
      await startPhotoEditor(source, {
        zoom: 1,
        offsetX: 0,
        offsetY: 0
      });
    } catch (error) {
      console.error("Erro ao preparar foto:", error);
      alert("Não foi possível carregar a foto.");
    }
  }

  function requestPhotoFile() {
    profilePhotoInput?.click();
  }

  changePhotoBtn?.addEventListener("click", requestPhotoFile);

  openPhotoEditorBtn?.addEventListener("click", async () => {
    const profile = getProfile();

    if (!profile.photoSource && !profile.photo) {
      requestPhotoFile();
      return;
    }

    await startPhotoEditor(
      profile.photoSource || profile.photo,
      profile.photoCrop
    );
  });

  replacePhotoBtn?.addEventListener("click", requestPhotoFile);

  profilePhotoInput?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    await handlePhotoFile(file);
  });

  photoZoom?.addEventListener("input", () => {
    editor.zoom = Math.min(3, Math.max(1, Number(photoZoom.value) || 1));
    clampEditorOffset();
    renderPhotoEditor();
  });

  centerPhotoBtn?.addEventListener("click", () => {
    editor.zoom = 1;
    editor.offsetX = 0;
    editor.offsetY = 0;

    if (photoZoom) photoZoom.value = "1";
    renderPhotoEditor();
  });

  function pointerPosition(event) {
    const rect = photoEditorStage.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  photoEditorStage?.addEventListener("pointerdown", event => {
    if (!editor.image) return;

    editor.dragging = true;
    editor.pointerId = event.pointerId;

    const point = pointerPosition(event);
    editor.lastX = point.x;
    editor.lastY = point.y;

    photoEditorStage.classList.add("is-dragging");
    photoEditorStage.setPointerCapture?.(event.pointerId);
  });

  photoEditorStage?.addEventListener("pointermove", event => {
    if (!editor.dragging || event.pointerId !== editor.pointerId) return;

    const point = pointerPosition(event);
    editor.offsetX += point.x - editor.lastX;
    editor.offsetY += point.y - editor.lastY;
    editor.lastX = point.x;
    editor.lastY = point.y;

    clampEditorOffset();
    renderPhotoEditor();
  });

  function endDrag(event) {
    if (!editor.dragging) return;
    if (event?.pointerId != null && event.pointerId !== editor.pointerId) return;

    editor.dragging = false;
    photoEditorStage?.classList.remove("is-dragging");

    if (editor.pointerId != null) {
      try {
        photoEditorStage?.releasePointerCapture?.(editor.pointerId);
      } catch (_) {}
    }

    editor.pointerId = null;
  }

  photoEditorStage?.addEventListener("pointerup", endDrag);
  photoEditorStage?.addEventListener("pointercancel", endDrag);
  photoEditorStage?.addEventListener("pointerleave", event => {
    if (editor.dragging && event.buttons === 0) endDrag(event);
  });

  function exportPhoto() {
    if (!editor.image) return "";

    const previewSize = stageSize();
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = PHOTO_EXPORT_SIZE;
    exportCanvas.height = PHOTO_EXPORT_SIZE;

    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return "";

    const minScaleExport = calculateMinScale(editor.image, PHOTO_EXPORT_SIZE);
    const scale = minScaleExport * editor.zoom;
    const drawWidth = editor.image.naturalWidth * scale;
    const drawHeight = editor.image.naturalHeight * scale;

    const normalizedX = editor.offsetX / previewSize;
    const normalizedY = editor.offsetY / previewSize;

    const offsetX = normalizedX * PHOTO_EXPORT_SIZE;
    const offsetY = normalizedY * PHOTO_EXPORT_SIZE;

    const x = (PHOTO_EXPORT_SIZE - drawWidth) / 2 + offsetX;
    const y = (PHOTO_EXPORT_SIZE - drawHeight) / 2 + offsetY;

    ctx.fillStyle = document.body.classList.contains("dark") ? "#17102f" : "#eeeaff";
    ctx.fillRect(0, 0, PHOTO_EXPORT_SIZE, PHOTO_EXPORT_SIZE);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(editor.image, x, y, drawWidth, drawHeight);

    return exportCanvas.toDataURL("image/webp", 0.92);
  }

  savePhotoEditorBtn?.addEventListener("click", () => {
    const photo = exportPhoto();
    if (!photo) return;

    const size = stageSize();
    const profile = getProfile();

    profile.photo = photo;
    profile.photoSource = editor.source;
    profile.photoCrop = {
      zoom: editor.zoom,
      offsetX: size ? editor.offsetX / size : 0,
      offsetY: size ? editor.offsetY / size : 0
    };

    if (saveProfile(profile)) {
      renderProfile();
      closeModal(photoEditorModal);
    }
  });

  closePhotoEditorBtn?.addEventListener("click", () => closeModal(photoEditorModal));
  cancelPhotoEditorBtn?.addEventListener("click", () => closeModal(photoEditorModal));

  photoEditorModal?.addEventListener("click", event => {
    if (event.target === photoEditorModal) closeModal(photoEditorModal);
  });

  window.addEventListener("resize", () => {
    if (photoEditorModal?.getAttribute("aria-hidden") === "false") {
      renderPhotoEditor();
    }
  });

  /* =========================
     BANNER
  ========================= */

  changeBannerBtn?.addEventListener("click", () => bannerInput?.click());

  bannerInput?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Selecione uma imagem válida.");
      return;
    }

    try {
      const banner = await prepareBanner(file);
      const profile = getProfile();
      profile.banner = banner;

      if (saveProfile(profile)) {
        renderProfile();
      }
    } catch (error) {
      console.error("Erro ao carregar banner:", error);
      alert("Não foi possível carregar o banner.");
    }
  });

  /* =========================
     RESUMO DO NEGÓCIO
  ========================= */

  function getProducts() {
    const keys = ["zuz-products", "zuzProducts", "products", "produtos"];

    for (const key of keys) {
      try {
        const saved = localStorage.getItem(key);
        if (!saved) continue;

        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed?.products)) return parsed.products;
        if (Array.isArray(parsed?.produtos)) return parsed.produtos;
      } catch (error) {
        console.warn(`Erro ao ler ${key}:`, error);
      }
    }

    return [];
  }

  function toNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value !== "string") return 0;

    let clean = value.replace(/R\$/gi, "").replace(/\s/g, "");

    if (clean.includes(",")) {
      clean = clean.replace(/\./g, "").replace(",", ".");
    }

    const number = Number(clean);
    return Number.isFinite(number) ? number : 0;
  }

  function getNumber(object, keys) {
    for (const key of keys) {
      if (object?.[key] !== undefined && object?.[key] !== null) {
        return toNumber(object[key]);
      }
    }
    return 0;
  }

  function getCategory(product) {
    return String(product?.category || product?.categoria || product?.categoryName || "").trim();
  }

  function getCost(product) {
    return getNumber(product, ["totalCost", "grossPrice", "cost", "baseCost", "custo", "custoTotal", "precoBruto"]);
  }

  function getSalePrice(product) {
    return getNumber(product, ["salePrice", "price", "preco", "precoVenda"]);
  }

  function getMargin(product) {
    const stored = getNumber(product, ["margin", "marginPct", "marginPercentage", "margem", "margemPercentual"]);
    if (stored !== 0) return stored;

    const cost = getCost(product);
    const price = getSalePrice(product);

    return price > 0 ? ((price - cost) / price) * 100 : 0;
  }

  function getRevenue(product) {
    const direct = getNumber(product, ["revenue", "estimatedRevenue", "faturamento", "faturamentoEstimado"]);
    if (direct !== 0) return direct;

    const price = getSalePrice(product);
    const units = getNumber(product, ["units", "unitsSold", "quantity", "estimatedUnits", "vendas", "quantidade"]);

    return price * units;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(Number(value) || 0);
  }

  function renderBusinessSummary() {
    const products = getProducts();

    if (profileProducts) profileProducts.textContent = String(products.length);

    const categories = new Set(products.map(getCategory).filter(Boolean));
    if (profileCategories) profileCategories.textContent = String(categories.size);

    const margins = products.map(getMargin).filter(Number.isFinite);
    const averageMargin = margins.length
      ? margins.reduce((sum, value) => sum + value, 0) / margins.length
      : 0;

    if (profileAverageMargin) {
      profileAverageMargin.textContent = `${averageMargin.toFixed(1)}%`;
    }

    const revenue = products.reduce((sum, product) => sum + getRevenue(product), 0);
    if (profileRevenue) profileRevenue.textContent = formatCurrency(revenue);
  }

  /* =========================
     FECHAMENTO / SINCRONIZAÇÃO
  ========================= */

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    if (photoEditorModal?.getAttribute("aria-hidden") === "false") {
      closeModal(photoEditorModal);
      return;
    }

    if (profileModal?.getAttribute("aria-hidden") === "false") {
      closeModal(profileModal);
    }
  });

  window.addEventListener("storage", event => {
    if (event.key === PROFILE_KEY) renderProfile();
    if (event.key === "zuz-theme") applyTheme(event.newValue === "dark");
    renderBusinessSummary();
  });

  renderProfile();
  renderBusinessSummary();
});
