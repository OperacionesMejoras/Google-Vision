// vision-app.js
// Lógica: lee imagen, llama a Vision API, dibuja bounding boxes en canvas.

const canvas   = document.getElementById("canvas");
const ctx      = canvas.getContext("2d");
const input    = document.getElementById("fileInput");
const list     = document.getElementById("resultList");
const statusEl = document.getElementById("status");
const rawJsonEl = document.getElementById("rawJson");
const rawSection = document.getElementById("rawSection");
const btnRun   = document.getElementById("btnRun");

// Controles de parámetros
const sliderScore  = document.getElementById("minScore");
const scoreValEl   = document.getElementById("scoreVal");
const inputMax     = document.getElementById("maxResults");
const featObj      = document.getElementById("featObj");
const featLabel    = document.getElementById("featLabel");
const featText     = document.getElementById("featText");
const featFace     = document.getElementById("featFace");
const featLogo     = document.getElementById("featLogo");
const featSafe     = document.getElementById("featSafe");
const featProps    = document.getElementById("featProps");
const featWeb      = document.getElementById("featWeb");

let imgBase64 = null;

// Actualizar etiqueta del slider en tiempo real
sliderScore.addEventListener("input", () => {
  scoreValEl.textContent = `${sliderScore.value}%`;
});

btnRun.addEventListener("click", () => {
  if (imgBase64) llamarVisionAPI();
});

// ── Leer parámetros actuales desde los controles ─────────────────
function getParams() {
  const minScore  = Number(sliderScore.value) / 100;
  const maxResults = Math.max(1, Number(inputMax.value));

  const features = [];
  if (featObj.checked)   features.push({ type: "OBJECT_LOCALIZATION",  maxResults });
  if (featLabel.checked) features.push({ type: "LABEL_DETECTION",      maxResults });
  if (featText.checked)  features.push({ type: "TEXT_DETECTION",       maxResults });
  if (featFace.checked)  features.push({ type: "FACE_DETECTION",       maxResults });
  if (featLogo.checked)  features.push({ type: "LOGO_DETECTION",       maxResults });
  if (featSafe.checked)  features.push({ type: "SAFE_SEARCH_DETECTION", maxResults: 1 });
  if (featProps.checked) features.push({ type: "IMAGE_PROPERTIES",     maxResults: 1 });
  if (featWeb.checked)   features.push({ type: "WEB_DETECTION",        maxResults });

  return { minScore, maxResults, features };
}

// ── 1. Lectura de imagen via FileReader ──────────────────────────
input.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (ev) => {
    const dataUrl = ev.target.result;
    imgBase64 = dataUrl.split(",")[1];

    const img = new Image();
    img.onload = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      btnRun.disabled = false;
      llamarVisionAPI();
    };
    img.src = dataUrl;
  };

  reader.readAsDataURL(file);
});

// ── 2. Llamada a Google Vision API ──────────────────────────────
async function llamarVisionAPI() {
  const { minScore, features } = getParams();

  if (features.length === 0) {
    statusEl.textContent = "Selecciona al menos una feature.";
    return;
  }

  statusEl.textContent = "Llamando a Vision API...";
  list.innerHTML = "";
  rawJsonEl.textContent = "";
  rawSection.open = false;

  const body = {
    requests: [{
      image:    { content: imgBase64 },
      features
    }]
  };

  try {
    const res = await fetch(VISION_ENDPOINT, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json     = await res.json();
    const response = json.responses?.[0] ?? {};

    // Mostrar JSON crudo
    rawJsonEl.textContent = JSON.stringify(json, null, 2);

    // OBJECT_LOCALIZATION
    const objetos = (response.localizedObjectAnnotations ?? [])
      .filter(o => o.score >= minScore);

    // LABEL_DETECTION
    const etiquetas = (response.labelAnnotations ?? [])
      .filter(l => l.score >= minScore);

    // TEXT_DETECTION
    const textos = response.textAnnotations ?? [];

    // FACE_DETECTION
    const caras = response.faceAnnotations ?? [];

    // LOGO_DETECTION
    const logos = (response.logoAnnotations ?? [])
      .filter(l => l.score >= minScore);

    // SAFE_SEARCH_DETECTION
    const safeSearch = response.safeSearchAnnotation ?? null;

    // IMAGE_PROPERTIES
    const colores = response.imagePropertiesAnnotation?.dominantColors?.colors ?? [];

    // WEB_DETECTION
    const web = response.webDetection ?? null;

    const partes = [];
    if (featObj.checked)   partes.push(`${objetos.length} objeto(s)`);
    if (featLabel.checked) partes.push(`${etiquetas.length} etiqueta(s)`);
    if (featText.checked)  partes.push(textos.length ? "texto detectado" : "sin texto");
    if (featFace.checked)  partes.push(`${caras.length} cara(s)`);
    if (featLogo.checked)  partes.push(`${logos.length} logo(s)`);
    if (featSafe.checked)  partes.push("safe search ✓");
    if (featProps.checked) partes.push(`${colores.length} color(es)`);
    if (featWeb.checked)   partes.push(`${web?.webEntities?.length ?? 0} entidad(es) web`);

    statusEl.textContent = partes.join(" | ") + ` (umbral ≥ ${(minScore * 100).toFixed(0)}%)`;

    // Redibujar imagen limpia antes de los boxes
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      dibujarBoxes(objetos);
    };
    img.src = `data:image/jpeg;base64,${imgBase64}`;

    mostrarLista(objetos, etiquetas, textos, caras, logos, safeSearch, colores, web);

  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
  }
}

// ── 3. Dibujar bounding boxes en canvas ─────────────────────────
const COLORES = [
  "#e63946", "#2a9d8f", "#e9c46a", "#264653",
  "#f4a261", "#a8dadc", "#457b9d", "#1d3557"
];

function dibujarBoxes(objetos) {
  objetos.forEach((obj, i) => {
    const vertices = obj.boundingPoly.normalizedVertices;
    const color    = COLORES[i % COLORES.length];

    const x = vertices[0].x * canvas.width;
    const y = vertices[0].y * canvas.height;
    const w = (vertices[2].x - vertices[0].x) * canvas.width;
    const h = (vertices[2].y - vertices[0].y) * canvas.height;

    ctx.strokeStyle = color;
    ctx.lineWidth   = 3;
    ctx.strokeRect(x, y, w, h);

    const label    = `${i + 1}. ${obj.name} ${(obj.score * 100).toFixed(0)}%`;
    const fontSize = Math.max(12, canvas.width * 0.018);
    ctx.font       = `bold ${fontSize}px monospace`;

    const textW = ctx.measureText(label).width;
    ctx.fillStyle = color;
    ctx.fillRect(x, y - fontSize - 4, textW + 8, fontSize + 6);

    ctx.fillStyle = "#fff";
    ctx.fillText(label, x + 4, y - 4);
  });
}

// ── 4. Lista de resultados debajo del canvas ─────────────────────
function mostrarLista(objetos, etiquetas, textos, caras, logos, safeSearch, colores, web) {
  // Objetos localizados
  if (featObj.checked) {
    const h3 = document.createElement("h3");
    h3.textContent = "Objetos localizados (con bounding box)";
    list.appendChild(h3);

    if (objetos.length === 0) {
      list.appendChild(Object.assign(document.createElement("li"), { textContent: "Ninguno sobre el umbral." }));
    } else {
      objetos.forEach((obj, i) => {
        const color = COLORES[i % COLORES.length];
        const v     = obj.boundingPoly.normalizedVertices;
        const li = document.createElement("li");
        li.innerHTML =
          `<span style="color:${color}">■</span> ` +
          `<strong>${obj.name}</strong> — ` +
          `confianza: ${(obj.score * 100).toFixed(1)}% | ` +
          `top ${(v[0].y * 100).toFixed(1)}% ` +
          `left ${(v[0].x * 100).toFixed(1)}% ` +
          `→ bottom ${(v[2].y * 100).toFixed(1)}% ` +
          `right ${(v[2].x * 100).toFixed(1)}%`;
        list.appendChild(li);
      });
    }
  }

  // Etiquetas generales
  if (featLabel.checked) {
    const h3 = document.createElement("h3");
    h3.textContent = "Etiquetas detectadas (LABEL_DETECTION)";
    list.appendChild(h3);

    if (etiquetas.length === 0) {
      list.appendChild(Object.assign(document.createElement("li"), { textContent: "Ninguna sobre el umbral." }));
    } else {
      etiquetas.forEach((lbl) => {
        const li = document.createElement("li");
        li.innerHTML =
          `<strong>${lbl.description}</strong> — ` +
          `confianza: ${(lbl.score * 100).toFixed(1)}%`;
        list.appendChild(li);
      });
    }
  }

  // Texto detectado
  if (featText.checked && textos.length > 0) {
    const h3 = document.createElement("h3");
    h3.textContent = "Texto detectado (TEXT_DETECTION)";
    list.appendChild(h3);
    const li = document.createElement("li");
    li.innerHTML = `<pre style="white-space:pre-wrap">${textos[0].description}</pre>`;
    list.appendChild(li);
  }

  // Caras detectadas
  if (featFace.checked) {
    const h3 = document.createElement("h3");
    h3.textContent = `Caras detectadas (FACE_DETECTION): ${caras.length}`;
    list.appendChild(h3);
    caras.forEach((cara, i) => {
      const li = document.createElement("li");
      li.innerHTML =
        `Cara ${i+1} — ` +
        `alegría: ${cara.joyLikelihood} | ` +
        `sorpresa: ${cara.surpriseLikelihood} | ` +
        `enojo: ${cara.angerLikelihood} | ` +
        `confianza detección: ${(cara.detectionConfidence * 100).toFixed(1)}%`;
      list.appendChild(li);
    });
  }

  // Logos detectados
  if (featLogo.checked) {
    const h3 = document.createElement("h3");
    h3.textContent = "Logos detectados (LOGO_DETECTION)";
    list.appendChild(h3);
    if (logos.length === 0) {
      list.appendChild(Object.assign(document.createElement("li"), { textContent: "Ninguno sobre el umbral." }));
    } else {
      logos.forEach((logo) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${logo.description}</strong> — confianza: ${(logo.score * 100).toFixed(1)}%`;
        list.appendChild(li);
      });
    }
  }

  // Safe Search
  if (featSafe.checked && safeSearch) {
    const h3 = document.createElement("h3");
    h3.textContent = "Safe Search (SAFE_SEARCH_DETECTION)";
    list.appendChild(h3);
    const campos = ["adult", "spoof", "medical", "violence", "racy"];
    campos.forEach((campo) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${campo}</strong>: ${safeSearch[campo]}`;
      list.appendChild(li);
    });
  }

  // Colores dominantes
  if (featProps.checked && colores.length > 0) {
    const h3 = document.createElement("h3");
    h3.textContent = "Colores dominantes (IMAGE_PROPERTIES)";
    list.appendChild(h3);
    colores.slice(0, 8).forEach((c) => {
      const { red = 0, green = 0, blue = 0 } = c.color;
      const hex = `#${[red, green, blue].map(v => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
      const li = document.createElement("li");
      li.innerHTML =
        `<span style="display:inline-block;width:14px;height:14px;background:${hex};border:1px solid #999;vertical-align:middle;margin-right:6px"></span>` +
        `${hex} — pixelFraction: ${(c.pixelFraction * 100).toFixed(1)}% | score: ${(c.score * 100).toFixed(1)}%`;
      list.appendChild(li);
    });
  }

  // Web Detection
  if (featWeb.checked && web) {
    const h3 = document.createElement("h3");
    h3.textContent = "Web Detection (WEB_DETECTION)";
    list.appendChild(h3);

    (web.webEntities ?? []).slice(0, 10).forEach((e) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${e.description ?? "(sin descripción)"}</strong> — score: ${(e.score ?? 0).toFixed(3)}`;
      list.appendChild(li);
    });

    if (web.bestGuessLabels?.length) {
      const li = document.createElement("li");
      li.innerHTML = `<em>Mejor descripción de la imagen: "${web.bestGuessLabels[0].label}"</em>`;
      list.appendChild(li);
    }
  }
}