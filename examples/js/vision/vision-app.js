// vision-app.js — Orquestador principal

import { state, config } from "./ui-features/state.js";
import { renderAll } from "./ui-features/canvas-renderer.js";
import { initZoomPan } from "./ui-features/zoom-pan.js";
import { initCredentials } from "./ui-features/credentials.js";
import { exportarImagenAnalizada, exportarReporteTXT, exportarJSONCrudo } from "./ui-features/export.js";
import { actualizarListaResultados } from "./ui-features/results-panel.js";
import { startWebcam, stopWebcam, captureFrame } from "./ui-features/webcam.js";

// ── DOM ─────────────────────────────────────────────────────────
const canvas       = document.getElementById("canvas");
const wrapper      = document.querySelector(".canvas-wrapper");
const fileInput    = document.getElementById("fileInput");
const list         = document.getElementById("resultList");
const statusEl     = document.getElementById("status");
const rawJsonEl    = document.getElementById("rawJson");
const btnRun       = document.getElementById("btnRun");
const btnIMG       = document.getElementById("btnExportIMG");
const btnSelectImg = document.getElementById("btnSelectImg");
const toggleWebcam = document.getElementById("toggleWebcam");
const webcamStatus = document.getElementById("webcamStatus");
const layerInputs  = document.querySelectorAll("#layerTree input");
const sliderScore  = document.getElementById("minScore");
const scoreValEl   = document.getElementById("scoreVal");
const sliderMax    = document.getElementById("maxResults");
const maxValEl     = document.getElementById("maxResultsVal");

// ── Inicialización del workspace ─────────────────────────────────

function resetWorkspace() {
  state.lastResponse    = null;
  rawJsonEl.textContent = "{}";
  list.innerHTML = `<li style="color:var(--text-muted); text-align:center;">Analiza la imagen para ver datos</li>`;
  layerInputs.forEach(input => {
    input.checked = false;
    const item = input.closest(".tree-item");
    if (item) item.classList.remove("active");
  });
  renderAll();
}

function resizeCanvas() {
  const rect    = wrapper.getBoundingClientRect();
  canvas.width  = rect.width;
  canvas.height = rect.height;
  renderAll();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ── Controles de UI ──────────────────────────────────────────────

if (sliderScore) sliderScore.addEventListener("input", () => { scoreValEl.textContent = `${sliderScore.value}%`; });
if (sliderMax)   sliderMax.addEventListener("input",   () => { maxValEl.textContent    = sliderMax.value; });
if (btnIMG)      btnIMG.addEventListener("click", exportarImagenAnalizada);

if (btnSelectImg) btnSelectImg.addEventListener("click", () => fileInput.click());

// ── Webcam Toggle ────────────────────────────────────────────────

toggleWebcam.addEventListener("change", async () => {
  if (toggleWebcam.checked) {
    const ok = await startWebcam();
    if (!ok) {
      toggleWebcam.checked = false;
      statusEl.textContent = "No se pudo acceder a la cámara";
      return;
    }
    webcamStatus.classList.remove("hidden");
    btnSelectImg.disabled = true;
    btnRun.disabled = false;
    resetWorkspace();
  } else {
    stopWebcam();
    webcamStatus.classList.add("hidden");
    btnSelectImg.disabled = false;
    btnRun.disabled = !state.imgBase64;
    renderAll();
  }
});

// ── Botón Analizar (con soporte webcam) ──────────────────────────

if (btnRun) btnRun.addEventListener("click", async () => {
  if (toggleWebcam.checked) {
    await captureFrame();
    // Tras capturar, apagamos el toggle visualmente (la cámara ya se detuvo en captureFrame)
    toggleWebcam.checked = false;
    webcamStatus.classList.add("hidden");
    btnSelectImg.disabled = false;
  }
  if (state.imgBase64) llamarVisionAPI();
});

// ── Carga de archivo ─────────────────────────────────────────────

fileInput.addEventListener("change", (e) => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = (ev) => {
    state.imgBase64    = ev.target.result.split(",")[1];
    state.currentImage = new Image();
    state.currentImage.onload = () => {
      resetWorkspace();
      btnRun.disabled = false;
      const rw = canvas.width  / state.currentImage.naturalWidth;
      const rh = canvas.height / state.currentImage.naturalHeight;
      state.scale = Math.min(rw, rh, 1) * 0.9;
      state.panX  = (canvas.width  - state.currentImage.naturalWidth  * state.scale) / 2;
      state.panY  = (canvas.height - state.currentImage.naturalHeight * state.scale) / 2;
      renderAll();
    };
    state.currentImage.src = ev.target.result;
  };
  r.readAsDataURL(f);
});

// Delegación para botones generados dinámicamente
list.addEventListener("click", (e) => {
  if (e.target.closest(".btn-ocr-download")) exportarReporteTXT();
});
document.body.addEventListener("click", (e) => {
  if (e.target.closest(".btn-json-download")) exportarJSONCrudo();
});

// ── Vision API ───────────────────────────────────────────────────

async function llamarVisionAPI() {
  const features   = [];
  const maxResults = parseInt(sliderMax.value) || 20;
  const featControls = {
    featFace:  "FACE_DETECTION",
    featObj:   "OBJECT_LOCALIZATION",
    featLabel: "LABEL_DETECTION",
    featText:  "TEXT_DETECTION",
    featLogo:  "LOGO_DETECTION",
    featSafe:  "SAFE_SEARCH_DETECTION",
    featProps: "IMAGE_PROPERTIES",
    featWeb:   "WEB_DETECTION",
  };
  Object.entries(featControls).forEach(([id, type]) => {
    const el = document.getElementById(id);
    if (el?.checked) features.push({ type, maxResults });
  });

  statusEl.textContent = "Analizando...";
  btnRun.disabled = true;
  try {
    const res  = await fetch(config.endpoint, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ requests: [{ image: { content: state.imgBase64 }, features }] }),
    });
    const json = await res.json();
    state.lastResponse    = json.responses?.[0] || {};
    rawJsonEl.textContent = JSON.stringify(json, null, 2);
    activarCapasDinamicamente();
    renderAll();
    actualizarListaResultados();
    statusEl.textContent = "Análisis completo";
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
  } finally {
    btnRun.disabled = false;
  }
}

function activarCapasDinamicamente() {
  const hasF = !!state.lastResponse.faceAnnotations?.length;
  const hasO = !!state.lastResponse.localizedObjectAnnotations?.length;
  const hasG = !!state.lastResponse.logoAnnotations?.length;
  const hasT = !!state.lastResponse.textAnnotations?.length;
  const hasL = !!state.lastResponse.labelAnnotations?.length;

  const faceDetails    = document.querySelector('[data-layer="face_box"]')?.closest('details');
  const objectsDetails = document.querySelector('[data-layer="objects"]')?.closest('details');
  const textDetails    = document.querySelector('[data-layer="text_boxes"]')?.closest('details');
  const metaDetails    = document.querySelector('[data-layer="labels_overlay"]')?.closest('details');

  if (faceDetails)    faceDetails.open    = hasF;
  if (objectsDetails) objectsDetails.open = hasO || hasG;
  if (textDetails)    textDetails.open    = hasT;
  if (metaDetails)    metaDetails.open    = hasL;

  layerInputs.forEach(input => {
    const l = input.dataset.layer;
    let checked = false;
    if (l?.startsWith("face_") && hasF)  checked = true;
    if (l === "objects"        && hasO)  checked = true;
    if (l === "logos"          && hasG)  checked = true;
    if (l?.startsWith("text_") && hasT)  checked = true;
    if (l === "labels_overlay" && hasL)  checked = true;
    input.checked = checked;
    const item = input.closest(".tree-item");
    if (item) checked ? item.classList.add("active") : item.classList.remove("active");
  });
}

// ── Bootstrap ────────────────────────────────────────────────────
initZoomPan();
initCredentials();