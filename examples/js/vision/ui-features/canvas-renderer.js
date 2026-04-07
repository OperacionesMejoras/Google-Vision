// canvas-renderer.js — Funciones de dibujo sobre el canvas

import { state } from "./state.js";

const canvas      = document.getElementById("canvas");
const ctx         = canvas.getContext("2d");
const sliderScore = document.getElementById("minScore");
const layerInputs = document.querySelectorAll("#layerTree input");

export const FACE_COLORS = {
  ojos:     "#6366f1",
  cejas:    "#a855f7",
  nariz:    "#10b981",
  labios:   "#f43f5e",
  contorno: "rgba(100, 116, 139, 0.5)",
};

const OBJ_COLORS = ["#6366f1","#10b981","#f43f5e","#f59e0b","#8b5cf6","#06b6d4","#ec4899","#d946ef","#f97316"];
export const getObjColor = (i) => OBJ_COLORS[i % OBJ_COLORS.length];

const SILUETA_MAP = {
  ojo_repaso_izq: { points: ["LEFT_EYE_LEFT_CORNER","LEFT_EYE_TOP_BOUNDARY","LEFT_EYE_RIGHT_CORNER","LEFT_EYE_BOTTOM_BOUNDARY"], closed: true,  color: FACE_COLORS.ojos   },
  ojo_repaso_der: { points: ["RIGHT_EYE_LEFT_CORNER","RIGHT_EYE_TOP_BOUNDARY","RIGHT_EYE_RIGHT_CORNER","RIGHT_EYE_BOTTOM_BOUNDARY"], closed: true, color: FACE_COLORS.ojos   },
  ceja_izq:       { points: ["LEFT_OF_LEFT_EYEBROW","LEFT_EYEBROW_UPPER_MIDPOINT","RIGHT_OF_LEFT_EYEBROW"], closed: false, color: FACE_COLORS.cejas  },
  ceja_der:       { points: ["LEFT_OF_RIGHT_EYEBROW","RIGHT_EYEBROW_UPPER_MIDPOINT","RIGHT_OF_RIGHT_EYEBROW"], closed: false, color: FACE_COLORS.cejas  },
  nariz_puente:   { points: ["NOSE_TIP","UPPER_LIP"], closed: false, color: FACE_COLORS.nariz  },
  labios_ext:     { points: ["MOUTH_LEFT","UPPER_LIP","MOUTH_RIGHT","LOWER_LIP"], closed: true, color: FACE_COLORS.labios },
};

function getThemeColor(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

function roundRect(c, x, y, width, height, radius) {
  c.beginPath();
  c.moveTo(x + radius, y);
  c.lineTo(x + width - radius, y);
  c.quadraticCurveTo(x + width, y, x + width, y + radius);
  c.lineTo(x + width, y + height - radius);
  c.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  c.lineTo(x + radius, y + height);
  c.quadraticCurveTo(x, y + height, x, y + height - radius);
  c.lineTo(x, y + radius);
  c.quadraticCurveTo(x, y, x + radius, y);
  c.closePath();
}

function dibujarObjetos(ob, c, s) {
  const min = Number(sliderScore.value) / 100;
  ob.forEach((o, i) => {
    if (o.score < min) return;
    const v     = o.boundingPoly.normalizedVertices;
    const color = getObjColor(i);
    const x = (v[0].x || 0) * state.currentImage.naturalWidth;
    const y = (v[0].y || 0) * state.currentImage.naturalHeight;
    const w = ((v[1]?.x || v[2]?.x) - (v[0].x || 0)) * state.currentImage.naturalWidth;
    const h = ((v[2]?.y || v[3]?.y) - (v[0].y || 0)) * state.currentImage.naturalHeight;
    c.strokeStyle = color; c.lineWidth = 3 / s; c.strokeRect(x, y, w, h);
    c.fillStyle = color; c.font = `bold ${12 / s}px Inter`;
    c.fillText(`${o.name} ${(o.score * 100).toFixed(0)}%`, x + 5 / s, y + 15 / s);
  });
}

function dibujarLogos(lg, c, s) {
  const min = Number(sliderScore.value) / 100;
  lg.forEach((o, i) => {
    if (o.score < min) return;
    const v     = o.boundingPoly.vertices || o.boundingPoly.normalizedVertices;
    const color = "#f59e0b";
    let x, y, w, h;
    if (v[0].x !== undefined) {
      x = v[0].x; y = v[0].y;
      w = v[1].x - v[0].x; h = v[2].y - v[0].y;
    } else {
      x = v[0].x * state.currentImage.naturalWidth;
      y = v[0].y * state.currentImage.naturalHeight;
      w = (v[1].x - v[0].x) * state.currentImage.naturalWidth;
      h = (v[2].y - v[0].y) * state.currentImage.naturalHeight;
    }
    c.strokeStyle = color; c.lineWidth = 3 / s; c.strokeRect(x, y, w, h);
    c.fillStyle = color; c.font = `bold ${12 / s}px Inter`;
    c.fillText(`🏷️ ${o.description} ${(o.score * 100).toFixed(0)}%`, x + 5 / s, y + 15 / s);
  });
}

function dibujarCajaRostro(f, idx, c, s) {
  const v = f.boundingPoly.vertices; if (!v) return;
  c.strokeStyle = FACE_COLORS.contorno; c.lineWidth = 1 / s; c.beginPath();
  c.moveTo(v[0].x, v[0].y);
  for (let i = 1; i < v.length; i++) c.lineTo(v[i].x, v[i].y);
  c.closePath(); c.stroke();
}

function dibujarLandmarks(f, gradient, c, s) {
  if (!f.landmarks) return;
  const getPointColor = (type) => {
    if (type.includes("EYE") && !type.includes("BROW")) return FACE_COLORS.ojos;
    if (type.includes("BROW"))                           return FACE_COLORS.cejas;
    if (type.includes("NOSE") || type.includes("CHIN")) return FACE_COLORS.nariz;
    if (type.includes("MOUTH") || type.includes("LIP")) return FACE_COLORS.labios;
    return "#94a3b8";
  };
  f.landmarks.forEach(l => {
    c.fillStyle = gradient ? "rgba(148, 163, 184, 0.6)" : getPointColor(l.type);
    c.beginPath();
    c.arc(l.position.x, l.position.y, gradient ? 2 / s : 3.5 / s, 0, Math.PI * 2);
    c.fill();
    if (!gradient) {
      c.strokeStyle = "rgba(255,255,255,0.6)";
      c.lineWidth   = 0.5 / s;
      c.stroke();
    }
  });
}

function dibujarSiluetas(f, c, s) {
  const map = {};
  f.landmarks.forEach(l => (map[l.type] = l.position));
  c.lineWidth = 2 / s;
  Object.values(SILUETA_MAP).forEach(grp => {
    const coords = grp.points.map(p => map[p]).filter(Boolean);
    if (coords.length < 2) return;
    c.strokeStyle = grp.color; c.beginPath(); c.moveTo(coords[0].x, coords[0].y);
    for (let i = 1; i < coords.length; i++) c.lineTo(coords[i].x, coords[i].y);
    if (grp.closed) c.closePath(); c.stroke();
  });
}

function dibujarTexto(an, conf, c, s) {
  if (!conf.boxes && !conf.content) return;
  const st = an.length > 1 ? 1 : 0;
  c.lineWidth = 1 / s;
  for (let i = st; i < an.length; i++) {
    const t = an[i], v = t.boundingPoly.vertices; if (!v) continue;
    const x = v[0].x || 0, y = v[0].y || 0;
    if (conf.boxes)   { c.strokeStyle = "#10b981"; c.strokeRect(x, y, v[1].x - x, v[2].y - y); }
    if (conf.content) { c.fillStyle = getThemeColor("--text"); c.font = `${12 / s}px Inter`; c.fillText(t.description, x, y - 5 / s); }
  }
}

export function dibujarLabelsOverlay(lbl, c, s) {
  const min  = Number(sliderScore.value) / 100;
  const filt = lbl.filter(l => l.score >= min).slice(0, 10);
  if (!filt.length) return;

  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.shadowBlur  = 20;
  c.shadowColor = "rgba(0,0,0,0.3)";
  c.fillStyle   = getThemeColor("--surface");
  c.strokeStyle = getThemeColor("--border");
  c.lineWidth   = 2;

  const width = 280, x = 30, y = 30;
  const h = filt.length * 32 + 70;

  c.save();
  c.beginPath(); roundRect(c, x, y, width, h, 20); c.fill(); c.stroke();
  c.shadowBlur = 0;
  c.font = "bold 13px Outfit"; c.fillStyle = getThemeColor("--primary");
  c.fillText("DETECCIÓN DE CONCEPTOS", x + 20, y + 35);

  filt.forEach((l, i) => {
    const pct = (l.score * 100).toFixed(0);
    c.fillStyle = l.score > 0.8 ? "#10b981" : getThemeColor("--text-muted");
    c.font = "600 11px Inter";
    c.fillText(`${pct}%`, x + 20, y + 70 + i * 32);
    c.fillStyle = getThemeColor("--text");
    c.font = "400 12px Inter";
    c.fillText(l.description.toUpperCase(), x + 60, y + 70 + i * 32);
  });
  c.restore();
}

export function renderAll(targetCtx = ctx, s = state.scale, pX = state.panX, pY = state.panY) {
  if (targetCtx === ctx) {
    targetCtx.setTransform(1, 0, 0, 1, 0, 0);
    targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
  }
  if (!state.currentImage) return;

  const ly = Array.from(layerInputs).filter(i => i.checked).map(i => i.dataset.layer);

  targetCtx.save();
  targetCtx.translate(pX, pY);
  targetCtx.scale(s, s);
  targetCtx.drawImage(state.currentImage, 0, 0);

  if (state.lastResponse) {
    if (ly.includes("objects") && state.lastResponse.localizedObjectAnnotations)
      dibujarObjetos(state.lastResponse.localizedObjectAnnotations, targetCtx, s);

    if (ly.includes("logos") && state.lastResponse.logoAnnotations)
      dibujarLogos(state.lastResponse.logoAnnotations, targetCtx, s);

    if (state.lastResponse.faceAnnotations)
      state.lastResponse.faceAnnotations.forEach((f, i) => {
        if (ly.includes("face_box"))      dibujarCajaRostro(f, i, targetCtx, s);
        if (ly.includes("face_outline"))  dibujarSiluetas(f, targetCtx, s);
        if (ly.includes("face_land"))     dibujarLandmarks(f, false, targetCtx, s);
        if (ly.includes("face_gradient")) dibujarLandmarks(f, true,  targetCtx, s);
      });

    if (state.lastResponse.textAnnotations?.length)
      dibujarTexto(
        state.lastResponse.textAnnotations,
        { boxes: ly.includes("text_boxes"), content: ly.includes("text_content") },
        targetCtx, s
      );

    if (ly.includes("labels_overlay") && state.lastResponse.labelAnnotations)
      dibujarLabelsOverlay(state.lastResponse.labelAnnotations, targetCtx, s);
  }

  targetCtx.restore();
}
