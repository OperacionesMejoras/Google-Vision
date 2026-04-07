// vision-config.js
// Lee la API key de localStorage (guardada por el modal de credenciales).
// Si no hay clave guardada, las variables quedan vacías y el modal la pedirá.

let VISION_API_KEY     = localStorage.getItem("vision_api_key") || "";
let VISION_ENDPOINT    = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;
let VISION_MAX_RESULTS = 20;

// Umbral mínimo de confianza para mostrar un resultado (0.0 - 1.0)
const VISION_MIN_SCORE = 0.60;

// Features que se envían en la misma llamada.
const VISION_FEATURES = [
  { type: "OBJECT_LOCALIZATION", maxResults: VISION_MAX_RESULTS },
  { type: "LABEL_DETECTION",     maxResults: VISION_MAX_RESULTS },
];