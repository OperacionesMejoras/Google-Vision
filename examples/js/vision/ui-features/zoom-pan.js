// zoom-pan.js — Controles de zoom y paneo del canvas

import { state } from "./state.js";
import { renderAll } from "./canvas-renderer.js";

const canvas = document.getElementById("canvas");

export function initZoomPan() {
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const factor = Math.pow(1.1, -e.deltaY / 100);
    const rect   = canvas.getBoundingClientRect();
    const mX = e.clientX - rect.left, mY = e.clientY - rect.top;
    const bX = (mX - state.panX) / state.scale, bY = (mY - state.panY) / state.scale;
    state.scale = Math.min(Math.max(0.05, state.scale * factor), 50);
    state.panX  = mX - bX * state.scale;
    state.panY  = mY - bY * state.scale;
    renderAll();
  }, { passive: false });

  canvas.addEventListener("mousedown", (e) => {
    state.isDragging = true;
    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;
  });

  window.addEventListener("mousemove", (e) => {
    if (!state.isDragging) return;
    state.panX      += e.clientX - state.lastMouseX;
    state.panY      += e.clientY - state.lastMouseY;
    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;
    renderAll();
  });

  window.addEventListener("mouseup", () => { state.isDragging = false; });
}
