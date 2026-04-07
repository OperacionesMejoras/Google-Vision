// results-panel.js — Panel lateral de resultados analíticos

import { state } from "./state.js";
import { FACE_COLORS, getObjColor } from "./canvas-renderer.js";

const list        = document.getElementById("resultList");
const sliderScore = document.getElementById("minScore");

export function actualizarListaResultados() {
  list.innerHTML = "";
  if (!state.lastResponse) return;

  const { faceAnnotations, localizedObjectAnnotations, logoAnnotations, textAnnotations, labelAnnotations } = state.lastResponse;

  // 1. Etiquetas / Conceptos
  if (labelAnnotations?.length) {
    const li = document.createElement("li");
    li.className = "result-card";
    li.style.cssText = "padding:14px; margin-bottom:16px;";
    const labelsHtml = labelAnnotations.slice(0, 10).map(l => {
      const pct = (l.score * 100).toFixed(0);
      return `
        <div style="margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:4px;">
            <span style="color:var(--text);">${l.description.toUpperCase()}</span>
            <span style="color:var(--primary); font-weight:700;">${pct}%</span>
          </div>
          <div style="width:100%; height:4px; background:var(--input-bg); border-radius:2px; overflow:hidden;">
            <div style="width:${pct}%; height:100%; background:var(--primary); opacity:0.8;"></div>
          </div>
        </div>`;
    }).join("");
    li.innerHTML = `
      <div style="font-weight:700; color:var(--primary); margin-bottom:12px; font-size:11px; text-transform:uppercase;">🏷️ Conceptos / Etiquetas</div>
      ${labelsHtml}`;
    list.appendChild(li);
  }

  // 2. OCR
  if (textAnnotations?.length) {
    const li = document.createElement("li");
    li.style.padding = "10px";
    li.innerHTML = `
      <div style="font-weight:700; color:var(--primary); margin-bottom:8px; font-size:11px; text-transform:uppercase; padding-left:4px;">📝 Análisis Textual (OCR)</div>
      <div style="font-size:12.5px; background:var(--input-bg); color:var(--text); padding:12px; border-radius:12px; max-height:200px; overflow-y:auto; white-space:pre-wrap; border:1px solid var(--border); font-family:'JetBrains Mono', monospace; line-height:1.5;">${textAnnotations[0].description}</div>
      <button class="btn btn-outline btn-ocr-download" style="width:100%; margin-top:8px; font-size:10px; padding:8px; display:flex; align-items:center; justify-content:center; gap:8px;">
        <i class="fas fa-file-download"></i> Descargar Texto (OCR)
      </button>`;
    list.appendChild(li);
  }

  // 3. Rostros
  if (faceAnnotations?.length) {
    faceAnnotations.forEach((f, i) => {
      const li = document.createElement("li");
      li.style.cssText = "padding:12px; margin-top:10px; background:var(--input-bg); border-radius:12px;";
      li.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:4px; height:24px; background:${FACE_COLORS.ojos}; border-radius:2px;"></div>
          <div style="flex:1;">
            <strong style="color:var(--text); font-size:13px;">👤 Sujeto ${i + 1}</strong>
            <div style="font-size:10px; margin-top:4px;"><span class="badge">Inclinación: ${f.panAngle.toFixed(1)}°</span></div>
          </div>
        </div>`;
      list.appendChild(li);
    });
  }

  // 4. Objetos
  if (localizedObjectAnnotations?.length) {
    const min      = Number(sliderScore.value) / 100;
    const total    = localizedObjectAnnotations.length;
    const filtered = localizedObjectAnnotations.filter(o => o.score < min).length;
    const badge    = filtered > 0
      ? `<span style="color:var(--primary); margin-left:6px;">${total - filtered}/${total}</span> <span style="color:var(--text-muted); font-size:9px;">(${filtered} bajo umbral)</span>`
      : `<span style="color:var(--primary); margin-left:6px;">${total}</span>`;

    const head = document.createElement("li");
    head.style.padding = "20px 10px 4px";
    head.innerHTML = `<div style="font-weight:700; color:var(--text-muted); font-size:10px; text-transform:uppercase;">📦 Morfología de Objetos ${badge}</div>`;
    list.appendChild(head);

    localizedObjectAnnotations.forEach((o, i) => {
      const belowThreshold = o.score < min;
      const color = getObjColor(i);
      const li    = document.createElement("li");
      li.style.cssText = `padding:10px; margin-top:8px; border:1px solid ${color}${belowThreshold ? "22" : "44"}; border-radius:10px; background:${color}${belowThreshold ? "04" : "08"}; opacity:${belowThreshold ? "0.5" : "1"};`;
      li.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="fas fa-cube" style="color:${color};"></i>
            <span style="font-weight:600; color:var(--text);">${o.name}</span>
            ${belowThreshold ? `<span style="font-size:9px; color:var(--text-muted);">bajo umbral</span>` : ""}
          </div>
          <span style="font-weight:700; color:var(--text-muted); font-size:11px;">${(o.score * 100).toFixed(0)}%</span>
        </div>`;
      list.appendChild(li);
    });
  }

  // 5. Logos
  if (logoAnnotations?.length) {
    const li = document.createElement("li");
    li.style.cssText = "padding:14px; margin-top:16px;";
    li.innerHTML = `
      <div style="font-weight:700; color:var(--primary); margin-bottom:12px; font-size:11px; text-transform:uppercase;">🏷️ Logos Detectados</div>
      ${logoAnnotations.map((l, i) => {
        const pct = (l.score * 100).toFixed(0);
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border);">
            <div style="display:flex; align-items:center; gap:10px;">
              <i class="fas fa-tag" style="color:#f59e0b;"></i>
              <span style="font-weight:600; color:var(--text);">${l.description}</span>
            </div>
            <span style="font-weight:700; color:var(--text-muted); font-size:11px;">${pct}%</span>
          </div>`;
      }).join("")}`;
    list.appendChild(li);
  }
}
