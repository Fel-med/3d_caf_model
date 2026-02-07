// src/main.js
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let carRoot = null;
let targetMaterials = [];
let originalStates = [];
let stripTexturesForSolidColor = false;

// ---------- Make the page non-scroll (important for mobile) ----------
document.documentElement.style.height = "100%";
document.body.style.height = "100%";
document.body.style.margin = "0";
document.body.style.overflow = "hidden";

// ---------- Scene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f6fb);

// ---------- Camera ----------
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 50000);

// ---------- Renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.domElement.style.display = "block";
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";
document.body.appendChild(renderer.domElement);

// ---------- Lights ----------
scene.add(new THREE.AmbientLight(0xffffff, 1.15));

const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(6, 10, 7);
scene.add(key);

const fill = new THREE.DirectionalLight(0xffffff, 0.65);
fill.position.set(-6, 4, -3);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.55);
rim.position.set(0, 6, -10);
scene.add(rim);

// ---------- Controls ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;

// ---------- UI ----------
const ui = document.createElement("div");
ui.className = "ui";
ui.innerHTML = `
  <div class="header">
    <div>
      <div class="title">Car Configurator</div>
      <div class="subtitle">Change car paint color</div>
    </div>
    <button id="resetBtn" class="btn">Reset</button>
  </div>

  <div class="palette">
    <button class="chip" data-color="#0b0f14" title="Black"><span style="background:#0b0f14"></span></button>
    <button class="chip" data-color="#ef4444" title="Red"><span style="background:#ef4444"></span></button>
    <button class="chip" data-color="#3b82f6" title="Blue"><span style="background:#3b82f6"></span></button>
    <button class="chip" data-color="#22c55e" title="Green"><span style="background:#22c55e"></span></button>
    <button class="chip" data-color="#f59e0b" title="Orange"><span style="background:#f59e0b"></span></button>
    <button class="chip" data-color="#a855f7" title="Purple"><span style="background:#a855f7"></span></button>
    <button class="chip" data-color="#ffffff" title="White"><span style="background:#ffffff"></span></button>
    <button class="chip" data-color="#9ca3af" title="Silver"><span style="background:#9ca3af"></span></button>
  </div>

  <div class="row">
    <label class="label">Custom</label>
    <input id="picker" type="color" value="#3b82f6" />
    <div class="grow"></div>
  </div>

  <div class="row">
    <label class="label">Solid</label>
    <input id="solid" type="checkbox" />
    <div class="hint">strong color</div>
    <div class="grow"></div>
  </div>

  <div id="status" class="status">Loading…</div>
`;
document.body.appendChild(ui);

const style = document.createElement("style");
style.textContent = `
  .ui{
    position:fixed;
    left:16px;
    bottom:16px;
    width:320px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 32px);
    overflow: auto;

    padding:14px 14px 12px;
    border-radius:18px;
    background:rgba(15,23,42,.72);
    border:1px solid rgba(255,255,255,.12);
    backdrop-filter: blur(10px);
    box-shadow:0 16px 34px rgba(0,0,0,.28);

    color:#fff;
    font-family: ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial;
    user-select:none;
    -webkit-overflow-scrolling: touch;
  }

  .header{
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:10px;
  }

  .title{font-weight:800;font-size:16px;letter-spacing:.2px}
  .subtitle{font-size:12px;opacity:.8;margin-top:2px}

  .palette{
    margin-top:10px;
    display:grid;
    grid-template-columns:repeat(8, 1fr);
    gap:8px;
  }

  .chip{
    border:1px solid rgba(255,255,255,.18);
    background:rgba(255,255,255,.06);
    border-radius:14px;
    padding:7px;
    cursor:pointer;
    transition: transform .08s ease, background .12s ease, border-color .12s ease;
  }

  .chip:hover{
    transform:translateY(-1px);
    background:rgba(255,255,255,.10);
    border-color:rgba(255,255,255,.35)
  }

  .chip:active{transform:translateY(0)}

  .chip span{
    display:block;
    width:100%;
    height:28px;
    border-radius:11px;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,.25), 0 4px 10px rgba(0,0,0,.22);
  }

  .row{
    margin-top:12px;
    display:flex;
    align-items:center;
    gap:10px;
  }

  .grow{flex:1}

  .label{font-size:12px;opacity:.85;width:55px}

  #picker{
    width:46px;height:34px;
    border:none;background:transparent;
    cursor:pointer;padding:0;
  }

  .btn{
    padding:8px 10px;
    border-radius:12px;
    border:1px solid rgba(255,255,255,.18);
    background:rgba(255,255,255,.08);
    color:#fff;
    cursor:pointer;
    font-size:12px;
    transition: background .12s ease, border-color .12s ease;
    flex-shrink:0;
  }

  .btn:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.28)}
  .hint{font-size:12px;opacity:.75}
  .status{margin-top:10px;font-size:12px;opacity:.88;line-height:1.25}

  /* ------- MOBILE LAYOUT: bottom sheet ------- */
  @media (max-width: 520px){
    .ui{
      left: 10px;
      right: 10px;
      bottom: 10px;
      width: auto;

      border-radius: 20px;
      padding: 12px;

      /* keep it compact, avoid covering whole screen */
      max-height: 42vh;
    }

    .palette{
      grid-template-columns: repeat(8, 1fr);
      gap: 7px;
    }

    .chip span{ height: 24px; }

    .title{ font-size: 15px; }
    .subtitle{ font-size: 11px; }

    /* Make inputs easier to tap */
    #picker{ width: 52px; height: 36px; }
    .btn{ padding: 8px 12px; }
  }

  /* Even smaller devices: allow palette wrap */
  @media (max-width: 360px){
    .palette{
      grid-template-columns: repeat(6, 1fr);
    }
  }
`;
document.head.appendChild(style);

const statusEl = ui.querySelector("#status");
const picker = ui.querySelector("#picker");
const resetBtn = ui.querySelector("#resetBtn");
const solidChk = ui.querySelector("#solid");

// ---------- Fit camera ----------
function fitCameraToObject(cam, object, orbit, offset = 1.35) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = (cam.fov * Math.PI) / 180;
  let cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2));
  cameraZ *= offset;

  cam.position.set(center.x + cameraZ, center.y + cameraZ * 0.35, center.z + cameraZ);

  cam.near = Math.max(0.01, maxDim / 100);
  cam.far = maxDim * 100;
  cam.updateProjectionMatrix();

  orbit.target.copy(center);
  orbit.update();
}

// ---------- Collect recolorable materials ----------
function collectRecolorableMaterials(root) {
  const set = new Set();

  root.traverse((obj) => {
    if (!obj.isMesh) return;

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((m) => {
      if (!m || !m.color) return;

      // Skip glass-like transparency
      if (m.transparent === true && m.opacity !== undefined && m.opacity < 0.98) return;

      set.add(m);
    });
  });

  return Array.from(set);
}

// ---------- Apply color (stronger paint) ----------
function applyColor(hex) {
  if (targetMaterials.length === 0) {
    statusEl.textContent = "No materials detected to recolor.";
    return;
  }

  const col = new THREE.Color(hex);

  targetMaterials.forEach((mat) => {
    mat.color.copy(col);

    if (stripTexturesForSolidColor) {
      mat.map = null; // makes color pop (removes dark baked texture)
    }

    if ("roughness" in mat) mat.roughness = 0.22;
    if ("metalness" in mat) mat.metalness = 0.08;

    if ("clearcoat" in mat) mat.clearcoat = 1.0;
    if ("clearcoatRoughness" in mat) mat.clearcoatRoughness = 0.08;

    mat.needsUpdate = true;
  });

  statusEl.textContent = `Color: ${hex.toUpperCase()} (materials: ${targetMaterials.length})`;
}

window.setCarColor = applyColor;

// ---------- UI events ----------
ui.querySelectorAll(".chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    const c = btn.getAttribute("data-color");
    picker.value = c;
    applyColor(c);
  });
});

picker.addEventListener("input", (e) => applyColor(e.target.value));

solidChk.addEventListener("change", () => {
  stripTexturesForSolidColor = solidChk.checked;
  statusEl.textContent = stripTexturesForSolidColor
    ? "Solid ON ✅ (strong paint color)"
    : "Solid OFF (tint textures)";
});

// Reset
resetBtn.addEventListener("click", () => {
  if (targetMaterials.length === 0) return;

  targetMaterials.forEach((mat, i) => {
    const st = originalStates[i];
    if (!st) return;

    mat.color.copy(st.color);
    if ("roughness" in mat && st.roughness !== undefined) mat.roughness = st.roughness;
    if ("metalness" in mat && st.metalness !== undefined) mat.metalness = st.metalness;
    if ("clearcoat" in mat && st.clearcoat !== undefined) mat.clearcoat = st.clearcoat;
    if ("clearcoatRoughness" in mat && st.clearcoatRoughness !== undefined) mat.clearcoatRoughness = st.clearcoatRoughness;

    mat.map = st.map;
    mat.needsUpdate = true;
  });

  statusEl.textContent = "Reset ✅";
});

// ---------- Load model ----------
console.log(import.meta.env.BASE_URL)
const modelUrl = `${import.meta.env.BASE_URL}models/model.glb`;
const loader = new GLTFLoader();
loader.load(
  modelUrl,
  (gltf) => {
    carRoot = gltf.scene;
    scene.add(carRoot);

    carRoot.traverse((o) => {
      if (o.isMesh) o.frustumCulled = false;
    });

    fitCameraToObject(camera, carRoot, controls, 1.35);

    targetMaterials = collectRecolorableMaterials(carRoot);

    originalStates = targetMaterials.map((m) => ({
      color: m.color ? m.color.clone() : new THREE.Color(1, 1, 1),
      map: m.map ?? null,
      roughness: "roughness" in m ? m.roughness : undefined,
      metalness: "metalness" in m ? m.metalness : undefined,
      clearcoat: "clearcoat" in m ? m.clearcoat : undefined,
      clearcoatRoughness: "clearcoatRoughness" in m ? m.clearcoatRoughness : undefined,
    }));

    statusEl.textContent = `Model loaded ✅ (materials: ${targetMaterials.length})`;
  },
  (xhr) => {
    if (xhr.total) statusEl.textContent = `Loading: ${((xhr.loaded / xhr.total) * 100).toFixed(0)}%`;
  },
  (err) => {
    console.error("GLB load error:", err);
    statusEl.textContent = "ERROR loading model ❌ (check console)";
  }
);

// ---------- Animate ----------
function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// ---------- Resize ----------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
