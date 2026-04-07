import { readFileSync } from "fs";
import { GOOGLE_VISION_ENDPOINT, DETECT_IMAGE } from "./constants.js";

/**
 * Lee una imagen y la convierte a base64 para enviar a Vision API.
 */
function imagenABase64(rutaImagen) {
  const data = readFileSync(rutaImagen);
  return data.toString("base64");
}

/**
 * Llama a Google Vision API con OBJECT_LOCALIZATION.
 * Devuelve los objetos detectados con nombre, confianza y bounding box.
 * @param {string} rutaImagen - Ruta al archivo de imagen
 * @returns {Promise<Array>} - Lista de objetos detectados
 */
async function detectarObjetos(rutaImagen) {
  const imagenBase64 = imagenABase64(rutaImagen);

  const body = {
    requests: [
      {
        image:    { content: imagenBase64 },
        features: [{ type: "OBJECT_LOCALIZATION", maxResults: 20 }],
      },
    ],
  };

  const response = await fetch(GOOGLE_VISION_ENDPOINT, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vision API error ${response.status}: ${error}`);
  }

  const json    = await response.json();
  const objetos = json.responses?.[0]?.localizedObjectAnnotations ?? [];
  return objetos;
}

/**
 * Formatea el bounding box normalizado a porcentajes legibles.
 */
function formatBoundingBox(bbox) {
  const v      = bbox.normalizedVertices;
  const top    = (v[0].y * 100).toFixed(1);
  const left   = (v[0].x * 100).toFixed(1);
  const bottom = (v[2].y * 100).toFixed(1);
  const right  = (v[2].x * 100).toFixed(1);
  return `top:${top}% left:${left}% → bottom:${bottom}% right:${right}%`;
}

// ─── Ejecución principal ──────────────────────────────────────────
console.log(`Detectando objetos en: ${DETECT_IMAGE}\n`);
console.log("Nota: Vision API usa categorías generales. No detecta 'caries'");
console.log("directamente — detecta estructuras como 'Tooth', 'Jaw', 'X-ray'.\n");
console.log("─".repeat(65));

detectarObjetos(DETECT_IMAGE)
  .then((objetos) => {
    if (objetos.length === 0) {
      console.log("No se detectaron objetos localizables en la imagen.");
      return;
    }

    console.log(`${objetos.length} objeto(s) detectado(s):\n`);

    objetos.forEach((obj, i) => {
      const confianza = (obj.score * 100).toFixed(1);
      const bbox      = formatBoundingBox(obj.boundingPoly);
      console.log(`[${i + 1}] ${obj.name}`);
      console.log(`    Confianza : ${confianza}%`);
      console.log(`    Posición  : ${bbox}`);
      console.log();
    });

    console.log("─".repeat(65));
    console.log("Raw JSON completo:");
    console.log(JSON.stringify(objetos, null, 2));
  })
  .catch((err) => console.error("Error:", err.message));