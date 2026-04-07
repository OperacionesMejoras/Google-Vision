import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "fs";
import { GEMINI_API_KEY, GEMINI_MODEL, TEST_IMAGE, CLASSIFY_PROMPT } from "./constants.js";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Lee una imagen del disco y devuelve sus bytes en base64 con mime type.
 */
function imagenABase64(rutaImagen) {
  const data = readFileSync(rutaImagen);
  const ext  = rutaImagen.split(".").pop().toLowerCase();
  const mimeMap = { jpg: "image/jpeg", jpeg: "image/jpeg", jfif: "image/jpeg", png: "image/png", webp: "image/webp" };
  return {
    data:     data.toString("base64"),
    mimeType: mimeMap[ext] ?? "image/jpeg",
  };
}

/**
 * Clasifica una imagen dental usando Gemini + el skill cargado.
 * @param {string} rutaImagen - Ruta absoluta al archivo de imagen
 * @returns {Promise<object>} - JSON con tipo, descripcion, nombre_sugerido, confianza, notas_clinicas
 */
async function clasificarImagen(rutaImagen) {
  const { data, mimeType } = imagenABase64(rutaImagen);

  const response = await ai.models.generateContent({
    model:    GEMINI_MODEL,
    contents: [
      {
        parts: [
          { text: CLASSIFY_PROMPT },
          { inlineData: { mimeType, data } },
        ],
      },
    ],
  });

  let texto = response.text.trim();

  // Extraer JSON si viene envuelto en markdown
  if (texto.includes("```")) {
    texto = texto.split("```")[1];
    if (texto.startsWith("json")) texto = texto.slice(4);
  }

  return JSON.parse(texto.trim());
}

// ─── Ejecución principal ──────────────────────────────────────
console.log(`Clasificando: ${TEST_IMAGE}\n`);

clasificarImagen(TEST_IMAGE)
  .then((resultado) => console.log(JSON.stringify(resultado, null, 2)))
  .catch((err) => console.error("Error:", err.message));