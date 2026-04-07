// credentials.js — Gestión de API key y tema visual

import { setApiKey } from "./state.js";

const overlay      = document.getElementById("credsOverlay");
const inputKey     = document.getElementById("inputVisionKey");
const keyIndicator = document.getElementById("keyIndicator");
const credsError   = document.getElementById("credsError");
const themeToggle  = document.getElementById("themeToggle");

export function updateIndicator() {
  const ok = !!localStorage.getItem("vision_api_key");
  if (keyIndicator) keyIndicator.style.background = ok ? "#22c55e" : "#ef4444";
}

export function openModal() {
  const saved = localStorage.getItem("vision_api_key") || "";
  inputKey.value = saved ? "••••••••••••••••" + saved.slice(-4) : "";
  inputKey.dataset.hasExisting = saved ? "1" : "0";
  credsError.style.display = "none";
  overlay.classList.add("open");
}

function closeModal() { overlay.classList.remove("open"); }

export function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  if (themeToggle) {
    const icon = themeToggle.querySelector("i");
    if (icon) icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
  }
}

export function initCredentials() {
  document.getElementById("btnOpenCreds").addEventListener("click", openModal);
  document.getElementById("btnCancelCreds").addEventListener("click", closeModal);
  document.getElementById("btnSaveCreds").addEventListener("click", () => {
    const val = inputKey.value.trim();
    if (!val && inputKey.dataset.hasExisting === "1") { closeModal(); return; }
    if (!val || val.length < 20) { credsError.style.display = "block"; return; }
    localStorage.setItem("vision_api_key", val);
    setApiKey(val);
    updateIndicator();
    closeModal();
  });

  inputKey.addEventListener("focus", () => {
    if (inputKey.dataset.hasExisting === "1") {
      inputKey.value = "";
      inputKey.dataset.hasExisting = "0";
    }
  });

  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    setTheme(next);
  });

  const initial = localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  setTheme(initial);
  updateIndicator();

  if (!localStorage.getItem("vision_api_key") && overlay) openModal();
}
