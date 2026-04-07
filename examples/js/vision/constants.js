import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// ─── Rutas base ───────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

export const EXAMPLES_DIR = join(__dirname, "../..");   // examples/
export const BASE_DIR     = join(EXAMPLES_DIR, "..");   // raíz del proyecto

// ─── Credenciales ─────────────────────────────────────────────
const creds = JSON.parse(readFileSync(join(BASE_DIR, "credencials", "cred.json"), "utf-8"));

export const GOOGLE_VISION_API_KEY = creds.GOOGLE_VISION_API_KEY;
export const GOOGLE_VISION_ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${creds.GOOGLE_VISION_API_KEY}`;

// ─── Imágenes ─────────────────────────────────────────────────
export const IMAGES_DIR  = join(EXAMPLES_DIR, "images");
export const DETECT_IMAGE = join(IMAGES_DIR, "detect objet.jfif");