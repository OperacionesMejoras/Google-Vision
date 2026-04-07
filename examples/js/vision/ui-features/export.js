// export.js — Funciones de exportación (imagen, OCR, JSON)

import { state } from "./state.js";
import { renderAll } from "./canvas-renderer.js";

async function saveAsFile(content, filename, type) {
  try {
    if (window.showSaveFilePicker) {
      const handle   = await window.showSaveFilePicker({ suggestedName: filename });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
    } else {
      const blob = new Blob([content], { type });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    if (err.name !== "AbortError") console.error("Error al guardar archivo:", err);
  }
}

export function exportarImagenAnalizada() {
  if (!state.currentImage) return;
  const off = document.createElement("canvas");
  off.width  = state.currentImage.naturalWidth;
  off.height = state.currentImage.naturalHeight;
  renderAll(off.getContext("2d"), 1, 0, 0);
  const link = document.createElement("a");
  link.download = "vision-capture.png";
  link.href     = off.toDataURL();
  link.click();
}

export async function exportarReporteTXT() {
  if (!state.lastResponse?.textAnnotations) return;
  const content = `REPORTE OCR\n==========\n\n${state.lastResponse.textAnnotations[0].description}`;
  await saveAsFile(content, "vision-ocr.txt", "text/plain");
}

export async function exportarJSONCrudo() {
  if (!state.lastResponse) return;
  const content = JSON.stringify(state.lastResponse, null, 2);
  await saveAsFile(content, "vision-response.json", "application/json");
}
