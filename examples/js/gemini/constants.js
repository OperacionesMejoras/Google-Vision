import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// ─── Rutas base ───────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

export const EXAMPLES_DIR = join(__dirname, "../..");   // examples/
export const BASE_DIR     = join(EXAMPLES_DIR, "..");   // raíz del proyecto
export const SKILLS_DIR   = join(EXAMPLES_DIR, "skills");

// ─── Credenciales ─────────────────────────────────────────────
const creds = JSON.parse(readFileSync(join(BASE_DIR, "credencials", "your_credentials_file.json"), "utf-8"));

export const GEMINI_API_KEY = creds.GEMINI_API_KEY;
export const GEMINI_MODEL   = "gemini-2.5-flash";

// ─── Imágenes ─────────────────────────────────────────────────
export const IMAGES_DIR = join(EXAMPLES_DIR, "images");
export const TEST_IMAGE = join(IMAGES_DIR, "images.jfif");

// ─── Loader de Skills ─────────────────────────────────────────
export function loadSkill(skillFilename) {
  return readFileSync(join(SKILLS_DIR, skillFilename), "utf-8");
}

// ─── System Prompts (cargados desde /skills) ──────────────────
export const CLASSIFY_PROMPT = loadSkill("classifier_skill.md");
