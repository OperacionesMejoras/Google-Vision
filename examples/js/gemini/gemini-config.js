// gemini-config.js
// Lee la API key de localStorage (guardada por el modal de credenciales).
// Si no hay clave guardada, la variable queda vacía y el modal la pedirá.

let GEMINI_API_KEY = localStorage.getItem("gemini_api_key") || "";

const GEMINI_MODELS = [
  { id: "gemini-2.5-flash",   label: "Gemini 2.5 Flash  (rápido, bajo costo)" },
  { id: "gemini-2.5-pro",     label: "Gemini 2.5 Pro    (más capaz, más lento)" },
  { id: "gemini-1.5-flash",   label: "Gemini 1.5 Flash  (estable)" },
  { id: "gemini-1.5-pro",     label: "Gemini 1.5 Pro    (estable, alto costo)" },
];

const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";
const GEMINI_DEFAULT_TEMP  = 0.2;

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";