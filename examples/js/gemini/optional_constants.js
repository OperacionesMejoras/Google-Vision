/**
 * optional_constants.js
 * ─────────────────────
 * Configuración opcional. No es necesaria para ejecutar analyze.js.
 */

import { join } from "path";
import { mkdirSync } from "fs";
import { BASE_DIR } from "./constants.js";

// ─── Credenciales secundarias (service accounts) ──────────────────
export const GEMINI_SERVICE_ACCOUNT_PATH  = join(BASE_DIR, "credencials", "ypur_service_acount_credentials.json");

// ─── Salida de archivos ───────────────────────────────────────────
export const OUTPUT_DIR = join(BASE_DIR, "examples", "output");
mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── Logging ──────────────────────────────────────────────────────
export const LOG_RESPONSES = true;
export const LOG_PATH      = join(OUTPUT_DIR, "classify_log.json");

// ─── Procesamiento por lote ───────────────────────────────────────
export const BATCH_EXTENSIONS = [".jpg", ".jpeg", ".png", ".jfif", ".webp"];
export const RENAME_FILES     = false;

// ─── Imagen de prueba alternativa ─────────────────────────────────
// Descomentar para sobrescribir TEST_IMAGE sin tocar constants.js
// import { IMAGES_DIR } from "./constants.js";
// export const TEST_IMAGE = join(IMAGES_DIR, "mi_otra_imagen.jpg");
