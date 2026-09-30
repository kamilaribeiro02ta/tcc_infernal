// Tema
(function () {
  const toggleBtn = document.getElementById("themeToggle");
  const label = document.getElementById("themeLabel");
  const iconSun = document.getElementById("iconSun");
  const iconMoon = document.getElementById("iconMoon");

  function applyTheme(isDark) {
    document.body.classList.toggle("dark", isDark);
    toggleBtn?.setAttribute("aria-pressed", String(isDark));
    if (label) label.textContent = isDark ? "Modo Escuro" : "Modo Claro";
    if (iconSun) iconSun.style.display = isDark ? "none" : "block";
    if (iconMoon) iconMoon.style.display = isDark ? "block" : "none";
  }

  const saved = localStorage.getItem("zuz-theme");
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  applyTheme(saved ? saved === "dark" : prefersDark);

  toggleBtn?.addEventListener("click", () => {
    const isDark = !document.body.classList.contains("dark");
    applyTheme(isDark);
    localStorage.setItem("zuz-theme", isDark ? "dark" : "light");
  });
})();

// Cards expansíveis
document.querySelectorAll(".about-card").forEach((card) => {
  const trigger = card.querySelector(".card-trigger");

  trigger?.addEventListener("click", () => {
    const willOpen = !card.classList.contains("open");

    document.querySelectorAll(".about-card.open").forEach((openCard) => {
      if (openCard !== card) {
        openCard.classList.remove("open");
        openCard.querySelector(".card-trigger")?.setAttribute("aria-expanded", "false");
      }
    });

    card.classList.toggle("open", willOpen);
    trigger.setAttribute("aria-expanded", String(willOpen));
  });
});



prototypeReal?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    prototypeReal.classList.toggle("is-open");
  }
});


/* Modelo 3D interativo do protótipo ZUZ */
(async function initPrototype3D() {
  const canvas = document.getElementById("prototypeCanvas");
  const wrap = document.getElementById("prototypeCanvasWrap");
  const explodeButton = document.getElementById("explodePrototype");
  const labels = document.getElementById("prototypeLabels");
  const tooltip = document.getElementById("prototypeTooltip");

  if (!canvas || !wrap) return;

  try {
    const THREE = await import("https://esm.sh/three@0.169.0");
    const { OrbitControls } = await import("https://esm.sh/three@0.169.0/examples/jsm/controls/OrbitControls.js");

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(7.8, 5.4, 9.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 6;
    controls.maxDistance = 16;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.82;
    controls.target.set(0, 0.2, 0);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x35244a, 2.1);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 3.4);
    key.position.set(6, 8, 7);
    key.castShadow = true;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x9d7bff, 1.8);
    fill.position.set(-7, 2, 5);
    scene.add(fill);

    const purple = new THREE.MeshStandardMaterial({
      color: 0x7c4ce3,
      roughness: 0.38,
      metalness: 0.08
    });

    const purpleDark = new THREE.MeshStandardMaterial({
      color: 0x42206f,
      roughness: 0.42,
      metalness: 0.06
    });

    const black = new THREE.MeshStandardMaterial({
      color: 0x121019,
      roughness: 0.28,
      metalness: 0.14
    });

    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x120d1d,
      roughness: 0.18,
      metalness: 0.1,
      emissive: 0x16062f,
      emissiveIntensity: 0.35
    });

    const pcb = new THREE.MeshStandardMaterial({
      color: 0x161719,
      roughness: 0.52,
      metalness: 0.18
    });

    const metal = new THREE.MeshStandardMaterial({
      color: 0xc8a86a,
      roughness: 0.32,
      metalness: 0.72
    });

    const silver = new THREE.MeshStandardMaterial({
      color: 0xaeb4bf,
      roughness: 0.28,
      metalness: 0.75
    });

    const speakerMat = new THREE.MeshStandardMaterial({
      color: 0x202124,
      roughness: 0.65,
      metalness: 0.08
    });

    const glow = new THREE.MeshStandardMaterial({
      color: 0xe7dfff,
      emissive: 0x7e42ff,
      emissiveIntensity: 3.2,
      roughness: 0.2
    });

    function roundedRectShape(w, h, r) {
      const x = -w / 2;
      const y = -h / 2;
      const s = new THREE.Shape();
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      return s;
    }

    function roundedBox(w, h, d, r, material) {
      const geometry = new THREE.ExtrudeGeometry(
        roundedRectShape(w, h, r),
        {
          depth: d,
          bevelEnabled: true,
          bevelSegments: 3,
          steps: 1,
          bevelSize: Math.min(r * 0.28, 0.12),
          bevelThickness: 0.08,
          curveSegments: 8
        }
      );
      geometry.center();
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }

    function box(w, h, d, material) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }

    function cylinder(radius, depth, material, segments = 32) {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, depth, segments),
        material
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }

    const model = new THREE.Group();
    model.rotation.x = -0.04;
    scene.add(model);

    const interactiveMeshes = [];
    const pieces = [];

    function addPiece(name, description, object, closed, exploded) {
      object.position.set(...closed);
      object.userData.componentName = name;
      object.userData.componentDescription = description;
      object.traverse((child) => {
        if (child.isMesh) {
          child.userData.componentName = name;
          child.userData.componentDescription = description;
          interactiveMeshes.push(child);
        }
      });
      model.add(object);
      pieces.push({
        object,
        closed: new THREE.Vector3(...closed),
        exploded: new THREE.Vector3(...exploded)
      });
      return object;
    }

    const rear = new THREE.Group();
    rear.add(roundedBox(4.1, 4.35, 1.55, 0.52, purpleDark));
    const rearInset = roundedBox(3.55, 3.75, 1.1, 0.4, purple);
    rearInset.position.z = 0.15;
    rear.add(rearInset);
    addPiece(
      "Carcaça traseira",
      "Estrutura impressa em 3D que protege e organiza os componentes internos.",
      rear,
      [0, 0, -0.85],
      [5.4, 0, -0.55]
    );

    const speaker = new THREE.Group();
    const speakerFrame = box(1.65, 1.65, 0.3, black);
    speaker.add(speakerFrame);
    const cone = cylinder(0.62, 0.28, speakerMat, 48);
    cone.rotation.x = Math.PI / 2;
    cone.position.z = 0.25;
    speaker.add(cone);
    const coneInner = cylinder(0.28, 0.31, black, 48);
    coneInner.rotation.x = Math.PI / 2;
    coneInner.position.z = 0.4;
    speaker.add(coneInner);
    addPiece(
      "Alto-falante",
      "Responsável pela saída de áudio do assistente físico.",
      speaker,
      [0.85, -0.45, 0],
      [3.5, -0.25, 0]
    );

    const mic = new THREE.Group();
    const micBoard = box(0.68, 0.45, 0.16, pcb);
    mic.add(micBoard);
    const micCapsule = cylinder(0.18, 0.18, silver, 24);
    micCapsule.rotation.x = Math.PI / 2;
    micCapsule.position.z = 0.16;
    mic.add(micCapsule);
    addPiece(
      "Microfone",
      "Capta a voz do usuário para a interação com o agente de IA.",
      mic,
      [0.9, -1.45, 0.3],
      [3.25, -1.55, 0.2]
    );

    const esp = new THREE.Group();
    esp.add(box(1.45, 2.35, 0.22, pcb));
    const module = box(0.85, 0.85, 0.15, silver);
    module.position.set(0, 0.45, 0.18);
    esp.add(module);
    const usb = box(0.55, 0.22, 0.24, silver);
    usb.position.set(0, -1.12, 0.18);
    esp.add(usb);
    for (let i = -3; i <= 3; i++) {
      const pinL = box(0.08, 0.13, 0.08, metal);
      pinL.position.set(-0.66, i * 0.3, 0.18);
      esp.add(pinL);
      const pinR = pinL.clone();
      pinR.position.x = 0.66;
      esp.add(pinR);
    }
    addPiece(
      "ESP32",
      "Controlador principal que conecta o hardware ao software da ZUZ.",
      esp,
      [0, 0.05, 0.1],
      [1.55, 0.05, 0.1]
    );

    const frame = new THREE.Group();
    const frameTop = box(3.15, 0.22, 0.28, black);
    frameTop.position.y = 1.55;
    frame.add(frameTop);
    const frameBottom = frameTop.clone();
    frameBottom.position.y = -1.55;
    frame.add(frameBottom);
    const frameLeft = box(0.22, 3.1, 0.28, black);
    frameLeft.position.x = -1.47;
    frame.add(frameLeft);
    const frameRight = frameLeft.clone();
    frameRight.position.x = 1.47;
    frame.add(frameRight);
    addPiece(
      "Suporte do display",
      "Mantém o display alinhado e fixo dentro da carcaça.",
      frame,
      [0, 0, 0.72],
      [-1.25, 0, 0.72]
    );

    const display = new THREE.Group();
    display.add(roundedBox(3.05, 2.55, 0.3, 0.22, black));
    const screen = roundedBox(2.62, 2.08, 0.08, 0.15, screenMat);
    screen.position.z = 0.18;
    display.add(screen);

    const eyeL = cylinder(0.23, 0.06, glow, 28);
    eyeL.rotation.x = Math.PI / 2;
    eyeL.position.set(-0.58, 0.25, 0.28);
    display.add(eyeL);

    const eyeR = eyeL.clone();
    eyeR.position.x = 0.58;
    display.add(eyeR);

    const mouth = new THREE.Mesh(
      new THREE.TorusGeometry(0.33, 0.055, 12, 30, Math.PI),
      glow
    );
    mouth.rotation.z = Math.PI;
    mouth.position.set(0, -0.45, 0.31);
    display.add(mouth);

    addPiece(
      "Display",
      "Tela principal onde aparece o rosto do mascote e as respostas do agente.",
      display,
      [0, 0.1, 1.15],
      [-2.8, 0.1, 1.15]
    );

    const front = new THREE.Group();
    const shell = roundedBox(4.55, 4.65, 0.62, 0.62, purple);
    front.add(shell);

    const blackPanel = roundedBox(3.72, 3.18, 0.18, 0.4, black);
    blackPanel.position.set(0, 0.4, 0.37);
    front.add(blackPanel);

    const speakerVent = new THREE.Group();
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const hole = cylinder(0.075, 0.08, black, 18);
        hole.rotation.x = Math.PI / 2;
        hole.position.set(-1.45 + col * 0.22, -1.58 + row * 0.22, 0.4);
        speakerVent.add(hole);
      }
    }
    front.add(speakerVent);

    const micHole = cylinder(0.09, 0.08, black, 18);
    micHole.rotation.x = Math.PI / 2;
    micHole.position.set(0.25, -1.38, 0.4);
    front.add(micHole);

    addPiece(
      "Carcaça frontal",
      "Parte frontal impressa em 3D que envolve a tela e protege o conjunto.",
      front,
      [0, 0, 1.62],
      [-5.1, 0, 1.62]
    );

    const topCover = roundedBox(1.9, 0.85, 0.22, 0.16, purpleDark);
    topCover.rotation.x = Math.PI / 2;
    topCover.position.set(0, 2.22, -0.2);
    topCover.userData.componentName = "Tampa superior";
    topCover.userData.componentDescription = "Peça superior da carcaça, com ventilação e acesso à montagem.";
    interactiveMeshes.push(topCover);
    model.add(topCover);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(7, 64),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.08,
        roughness: 1
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.55;
    floor.receiveShadow = true;
    scene.add(floor);

    let exploded = false;
    let pinned = false;

    function setExploded(value) {
      exploded = value;
      explodeButton?.setAttribute("aria-pressed", String(value));
      if (explodeButton) {
        explodeButton.querySelector("span").textContent = value ? "Fechar componentes" : "Abrir componentes";
      }
      labels?.classList.toggle("visible", value);
    }

    let prototypeHoverTimer;

    wrap.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse" && !pinned) {
        clearTimeout(prototypeHoverTimer);
        prototypeHoverTimer = setTimeout(() => setExploded(true), 180);
      }
    });

    wrap.addEventListener("pointerleave", (event) => {
      clearTimeout(prototypeHoverTimer);
      if (event.pointerType === "mouse" && !pinned) setExploded(false);
      if (tooltip) tooltip.style.display = "none";
    });

    explodeButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      pinned = !exploded || !pinned;
      setExploded(!exploded);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    wrap.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(interactiveMeshes, false)[0];

      if (hit && tooltip) {
        tooltip.innerHTML =
          "<strong>" + hit.object.userData.componentName + "</strong><br>" +
          hit.object.userData.componentDescription;
        tooltip.style.left = (event.clientX - rect.left) + "px";
        tooltip.style.top = (event.clientY - rect.top) + "px";
        tooltip.style.display = "block";
      } else if (tooltip) {
        tooltip.style.display = "none";
      }
    });

    function resize() {
      const width = wrap.clientWidth;
      const height = wrap.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);
    resize();

    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.04);
      const speed = 1 - Math.pow(0.001, delta);

      pieces.forEach((piece) => {
        const target = exploded ? piece.exploded : piece.closed;
        piece.object.position.lerp(target, speed);
      });

      controls.update();
      renderer.render(scene, camera);
    }

    animate();
  } catch (error) {
    console.error("Não foi possível carregar o modelo 3D da ZUZ:", error);
    wrap.classList.add("prototype-3d-error");
    wrap.innerHTML = '<p style="padding:24px;color:var(--text-secondary);font-size:12px;">Não foi possível carregar o visualizador 3D neste navegador.</p>';
  }
})();
