// webcam.js — Captura de cámara web con preview en canvas

import { state } from "./state.js";
import { renderAll } from "./canvas-renderer.js";

const canvas = document.getElementById("canvas");
const ctx    = canvas.getContext("2d");

let videoEl    = null;
let animFrameId = null;

export let isWebcamActive = false;

// ── Loop de preview ──────────────────────────────────────────────

function drawLoop() {
  if (!isWebcamActive || !videoEl) return;
  const vw = videoEl.videoWidth, vh = videoEl.videoHeight;
  if (vw && vh) {
    const s  = Math.min(canvas.width / vw, canvas.height / vh);
    const dx = (canvas.width  - vw * s) / 2;
    const dy = (canvas.height - vh * s) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(videoEl, dx, dy, vw * s, vh * s);
  }
  animFrameId = requestAnimationFrame(drawLoop);
}

// ── API pública ──────────────────────────────────────────────────

export async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    videoEl           = document.createElement("video");
    videoEl.srcObject = stream;
    videoEl.autoplay  = true;
    videoEl.playsInline = true;
    await videoEl.play();
    isWebcamActive = true;
    drawLoop();
    return true;
  } catch (err) {
    console.error("Error al acceder a la cámara:", err);
    return false;
  }
}

export function stopWebcam() {
  isWebcamActive = false;
  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
  if (videoEl?.srcObject) {
    videoEl.srcObject.getTracks().forEach(t => t.stop());
    videoEl = null;
  }
}

// Captura el frame actual, lo guarda en state y detiene el preview
export function captureFrame() {
  if (!videoEl || !isWebcamActive) return null;

  const vw = videoEl.videoWidth, vh = videoEl.videoHeight;
  const off = document.createElement("canvas");
  off.width = vw; off.height = vh;
  off.getContext("2d").drawImage(videoEl, 0, 0);

  const dataURL = off.toDataURL("image/jpeg", 0.92);
  state.imgBase64    = dataURL.split(",")[1];
  state.currentImage = new Image();
  state.currentImage.src = dataURL;

  stopWebcam();

  // Ajustar escala y centrado del frame capturado
  const s = Math.min(canvas.width / vw, canvas.height / vh) * 0.9;
  state.scale = s;
  state.panX  = (canvas.width  - vw * s) / 2;
  state.panY  = (canvas.height - vh * s) / 2;

  return new Promise(resolve => {
    state.currentImage.onload = () => { renderAll(); resolve(); };
  });
}