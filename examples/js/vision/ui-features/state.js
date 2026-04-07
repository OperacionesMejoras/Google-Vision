// state.js — Estado compartido y configuración de la aplicación

export const state = {
  imgBase64:    null,
  currentImage: null,
  lastResponse: null,
  scale:        1,
  panX:         0,
  panY:         0,
  isDragging:   false,
  lastMouseX:   0,
  lastMouseY:   0,
};

export const config = {
  apiKey:   localStorage.getItem("vision_api_key") || "",
  endpoint: "",
};
config.endpoint = config.apiKey
  ? `https://vision.googleapis.com/v1/images:annotate?key=${config.apiKey}`
  : "";

export function setApiKey(key) {
  config.apiKey   = key;
  config.endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${key}`;
}
