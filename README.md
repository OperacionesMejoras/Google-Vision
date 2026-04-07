# Google Vision & Gemini — Integration Examples

Ejemplos de integración de **Google Cloud Vision API** y **Gemini API** orientados al flujo de trabajo clínico de KeepSmiling.

---

## Estructura del proyecto

```
examples/
├── js/
│   ├── vision/          # App web: explorador de Vision API
│   └── gemini/          # App web + script Node: clasificador con Gemini
└── skills/
    └── classifier_skill.md   # System prompt del clasificador dental
docs/
├── capacidades_vision_api.md  # Qué puede y qué no puede hacer Vision API
└── workflow_google_vision.md  # Flujo de trabajo y comparativa Vision vs Gemini
```

---

## Configuración de credenciales

Copiar el template y completar con las claves reales:

```bash
cp credencials/cred.json.example credencials/cred.json
```

Editar `credencials/cred.json`:

```json
{
  "GOOGLE_VISION_API_KEY": "tu_clave_de_vision_api",
  "GEMINI_API_KEY": "tu_clave_de_gemini"
}
```

> Las claves se obtienen en [Google Cloud Console](https://console.cloud.google.com/apis/credentials).  
> La carpeta `credencials/` está excluida del repositorio via `.gitignore`.

---

## Apps web (sin servidor)

Abrir directamente en el navegador desde el sistema de archivos:

| App | Archivo | Descripción |
| :--- | :--- | :--- |
| Vision API Explorer | `examples/js/vision/index.html` | Sube una imagen y ejecuta cualquier feature de Vision API con bounding boxes |
| Gemini Image Analyzer | `examples/js/gemini/index.html` | Analiza imágenes con un system prompt configurable |

Las apps web piden la API key por modal y la guardan en `localStorage` del navegador. No necesitan el archivo `cred.json`.

---

## Script Node.js — Clasificador dental

Clasifica una imagen usando Gemini + el skill de clasificación clínica.

```bash
cd examples/js/gemini
npm install
node analyze.js
```

La imagen de prueba y el modelo se configuran en `constants.js`. Requiere `credencials/cred.json` con la `GEMINI_API_KEY`.

---

## Documentación

- [Capacidades de Vision API](docs/capacidades_vision_api.md) — features disponibles, ejemplos de input/output, limitaciones
- [Workflow y comparativa](docs/workflow_google_vision.md) — cuándo usar Vision API vs Gemini
- [Buenas prácticas: system prompts](docs/buenas_practicas_system_prompts.md) — guía para escribir skills y system prompts efectivos