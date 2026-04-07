// gemini-app.js
// Analizador de imágenes multipropósito.
// El system prompt define el rol/comportamiento; la consulta adicional es el mensaje de usuario.

// ── Refs DOM ─────────────────────────────────────────────────────
const fileInput      = document.getElementById("fileInput");
const previewGrid    = document.getElementById("previewGrid");
const promptFile     = document.getElementById("promptFile");
const promptTA       = document.getElementById("promptTextarea");
const charCountEl    = document.getElementById("charCount");
const btnClearPr     = document.getElementById("btnClearPrompt");
const optionalPrompt = document.getElementById("optionalPrompt");
const modelSelect    = document.getElementById("modelSelect");
const tempRange      = document.getElementById("tempRange");
const tempValEl      = document.getElementById("tempVal");
const maxTokensEl    = document.getElementById("maxTokens");
const chkThinking    = document.getElementById("chkThinking");
const btnClassify    = document.getElementById("btnClassify");
const btnClearRes    = document.getElementById("btnClearResults");
const statusEl       = document.getElementById("status");
const resultsEl      = document.getElementById("results");

// ── Estado ───────────────────────────────────────────────────────
const images = new Map();   // filename → { dataUrl, mimeType, base64, name }

// ── Inicializar selector de modelos ──────────────────────────────
GEMINI_MODELS.forEach(({ id, label }) => {
  const opt = document.createElement("option");
  opt.value = id;
  opt.textContent = label;
  if (id === GEMINI_DEFAULT_MODEL) opt.selected = true;
  modelSelect.appendChild(opt);
});

// ── Controles de UI ──────────────────────────────────────────────
tempRange.addEventListener("input", () => {
  tempValEl.textContent = parseFloat(tempRange.value).toFixed(1);
});

promptTA.addEventListener("input", () => {
  charCountEl.textContent = promptTA.value.length;
  updateBtn();
});

btnClearPr.addEventListener("click", () => {
  promptTA.value = "";
  charCountEl.textContent = "0";
  updateBtn();
});

// Importar system prompt desde archivo .md / .txt
promptFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    promptTA.value = ev.target.result;
    charCountEl.textContent = promptTA.value.length;
    updateBtn();
  };
  reader.readAsText(file, "utf-8");
  promptFile.value = "";
});

// Limpiar resultados procesados
btnClearRes.addEventListener("click", () => {
  resultsEl.innerHTML = "";
  statusEl.textContent = "";
});

// ── Carga de imágenes ────────────────────────────────────────────
fileInput.addEventListener("change", (e) => {
  Array.from(e.target.files).forEach(readFile);
  fileInput.value = "";
});

function readFile(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl  = ev.target.result;
    const base64   = dataUrl.split(",")[1];
    const mimeType = file.type || "image/jpeg";
    images.set(file.name, { dataUrl, base64, mimeType, name: file.name });
    renderThumbs();
  };
  reader.readAsDataURL(file);
}

function renderThumbs() {
  previewGrid.innerHTML = "";
  images.forEach(({ dataUrl, name }) => {
    const card = document.createElement("div");
    card.className = "thumb-card";
    card.innerHTML = `
      <img src="${dataUrl}" alt="${name}">
      <div class="fname">${name}</div>
      <button class="remove-btn" title="Quitar">✕</button>
    `;
    card.querySelector(".remove-btn").addEventListener("click", () => {
      images.delete(name);
      renderThumbs();
      updateBtn();
    });
    previewGrid.appendChild(card);
  });
  updateBtn();
}

function updateBtn() {
  // La consulta adicional es opcional; solo requiere imágenes y system prompt
  btnClassify.disabled = images.size === 0 || promptTA.value.trim().length === 0;
}

// ── Analizar ─────────────────────────────────────────────────────
btnClassify.addEventListener("click", analizarTodas);

async function analizarTodas() {
  const systemPrompt = promptTA.value.trim();
  const userMessage  = optionalPrompt.value.trim() || "Analizá esta imagen.";
  if (!systemPrompt || images.size === 0) return;

  btnClassify.disabled = true;
  statusEl.textContent = `Analizando ${images.size} imagen(es)…`;

  const model       = modelSelect.value;
  const temperature = parseFloat(tempRange.value);
  const maxTokens   = parseInt(maxTokensEl.value, 10);
  const useThinking = chkThinking.checked;

  let completadas = 0;
  const total = images.size;

  for (const img of images.values()) {
    statusEl.textContent = `Procesando ${img.name} (${completadas + 1}/${total})…`;
    const card = crearCardEspera(img);
    resultsEl.prepend(card);   // los nuevos resultados aparecen arriba

    const t0 = performance.now();
    try {
      const { texto, raw } = await llamarGemini(img, systemPrompt, userMessage, model, temperature, maxTokens, useThinking);
      const ms = Math.round(performance.now() - t0);
      rellenarCard(card, img, texto, raw, ms);
    } catch (err) {
      mostrarError(card, err.message);
    }
    completadas++;
  }

  statusEl.textContent = `Listo. ${completadas} imagen(es) procesada(s).`;
  btnClassify.disabled = false;
}

// ── Llamada a Gemini REST API ────────────────────────────────────
async function llamarGemini(img, systemPrompt, userMessage, model, temperature, maxTokens, useThinking) {
  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const generationConfig = { temperature, maxOutputTokens: maxTokens };

  if (useThinking && model.startsWith("gemini-2.5")) {
    generationConfig.thinkingConfig = { thinkingBudget: 1024 };
  }

  const body = {
    // systemInstruction define el rol/comportamiento del modelo
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    // contents es el turno de usuario: mensaje + imagen
    contents: [{
      parts: [
        { text: userMessage },
        { inline_data: { mime_type: img.mimeType, data: img.base64 } }
      ]
    }],
    generationConfig
  };

  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body)
  });

  const raw = await res.json();

  if (!res.ok) {
    const msg = raw.error?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // Concatenar todos los parts de texto (ignora thinking parts)
  const parts = raw.candidates?.[0]?.content?.parts ?? [];
  const texto = parts
    .filter(p => p.text !== undefined)
    .map(p => p.text)
    .join("")
    .trim();

  return { texto, raw };
}

// ── Tarjetas de resultado ────────────────────────────────────────
function crearCardEspera(img) {
  const card = document.createElement("div");
  card.className = "result-card";
  card.innerHTML = `
    <div class="result-header">
      <img src="${img.dataUrl}" alt="${img.name}">
      <div class="meta">
        <strong>${img.name}</strong><br>
        <span style="color:#888; font-size:13px">Procesando…</span>
      </div>
    </div>
    <div class="result-body" style="color:#888">Esperando respuesta de Gemini…</div>
  `;
  return card;
}

const CONF_CLASS = { alta: "conf-alta", media: "conf-media", baja: "conf-baja" };

function rellenarCard(card, img, texto, raw, ms) {
  const usage  = raw.usageMetadata ?? {};
  const ptok   = usage.promptTokenCount     ?? "—";
  const ctok   = usage.candidatesTokenCount ?? "—";
  const ttok   = usage.totalTokenCount      ?? "—";
  const model  = raw.modelVersion ?? modelSelect.value;

  const maxBar = 2048;
  const pct    = typeof ttok === "number" ? Math.min(100, (ttok / maxBar) * 100).toFixed(1) : 0;

  // Intentar parsear como JSON para render estructurado
  let parsed  = null;
  let limpio  = texto;

  if (texto.includes("```")) {
    limpio = texto.split("```")[1] ?? "";
    if (limpio.startsWith("json")) limpio = limpio.slice(4);
    limpio = limpio.trim();
  }

  try { parsed = JSON.parse(limpio); } catch { /* respuesta es texto libre */ }

  card.innerHTML = `
    <div class="result-header">
      <img src="${img.dataUrl}" alt="${img.name}">
      <div class="meta">
        <strong>${img.name}</strong><br>
        <span style="font-size:13px; color:#555">${model}</span>
      </div>
      <div class="metrics">
        ⏱ ${ms} ms<br>
        🔤 ${ttok} tokens<br>
        <small>prompt: ${ptok} · resp: ${ctok}</small>
      </div>
    </div>
    <div class="result-body">
      ${parsed ? renderJson(parsed) : renderTexto(texto)}
      <hr style="border:none; border-top:1px solid #eee; margin:12px 0 8px">
      <div class="field-row" style="align-items:center">
        <span class="field-label" style="font-size:12px">Tokens</span>
        <span style="font-size:12px; margin-right:8px">${ptok} + ${ctok} = ${ttok}</span>
        <div class="token-bar-wrap">
          <div class="token-bar" style="width:${pct}%"></div>
        </div>
      </div>
      <details class="raw-json">
        <summary>Respuesta cruda de la API</summary>
        <pre class="raw">${escHtml(JSON.stringify(raw, null, 2))}</pre>
      </details>
    </div>
  `;
}

// Renderiza un JSON como tabla de clave → valor (cualquier estructura)
function renderJson(obj, depth) {
  depth = depth || 0;
  if (depth > 3) return escHtml(JSON.stringify(obj));   // evitar recursión infinita

  if (Array.isArray(obj)) {
    return obj.map((item, i) =>
      `<div class="field-row">
        <span class="field-label">[${i}]</span>
        <span>${typeof item === "object" && item !== null ? renderJson(item, depth + 1) : formatVal(item)}</span>
       </div>`
    ).join("");
  }

  return Object.entries(obj).map(([k, v]) => {
    const label = k.replace(/_/g, " ");
    const value = (typeof v === "object" && v !== null)
      ? `<div style="padding-left:12px; border-left:2px solid #eee; margin-top:4px">${renderJson(v, depth + 1)}</div>`
      : formatVal(v, k);
    return `<div class="field-row">
              <span class="field-label">${escHtml(label)}</span>
              <span>${value}</span>
            </div>`;
  }).join("");
}

// Colorea valores de confianza conocidos; el resto los escapa
function formatVal(val, key) {
  const s = String(val);
  if (key === "confianza" || key === "confidence") {
    const cls = CONF_CLASS[s.toLowerCase()] ?? "";
    return cls ? `<span class="${cls}">${escHtml(s)}</span>` : escHtml(s);
  }
  return escHtml(s);
}

// Renderiza texto libre con saltos de línea respetados
function renderTexto(texto) {
  return `<div style="white-space:pre-wrap; font-size:14px; line-height:1.6">${escHtml(texto)}</div>`;
}

function mostrarError(card, msg) {
  card.querySelector(".result-body").innerHTML =
    `<div class="error-card">Error: ${escHtml(msg)}</div>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}