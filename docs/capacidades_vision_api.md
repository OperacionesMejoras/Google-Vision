# Capacidades Reales de Google Vision API

Este documento consolida qué puede y qué no puede hacer Google Cloud Vision API, con ejemplos concretos de input/output. El objetivo es tener claro cuándo tiene sentido usarla y cuándo Gemini es la herramienta correcta.

---

## ¿Qué es Google Vision API?

Es un conjunto de **modelos pre-entrenados fijos** especializados en tareas concretas de visión computacional. No razona, no interpreta contexto clínico, no entiende instrucciones en lenguaje natural.

> [!IMPORTANT]
> Google Vision API **no recibe prompts**. Recibe imágenes y devuelve datos estructurados de categorías predefinidas. No se puede personalizar su comportamiento más allá de elegir qué "feature" ejecutar.

---

## Features Disponibles (lo que realmente hace)

| Feature | Qué detecta | Útil para |
| :--- | :--- | :--- |
| `LABEL_DETECTION` | Etiquetas generales de la imagen | Catalogar imágenes genéricas |
| `TEXT_DETECTION` | Todo el texto visible en la imagen | Fotos de documentos, carteles |
| `DOCUMENT_TEXT_DETECTION` | Texto con estructura (bloques, párrafos, palabras) | Facturas, formularios, PDFs escaneados |
| `FACE_DETECTION` | Coordenadas y expresión de rostros humanos | Apps de seguridad, reconocimiento |
| `OBJECT_LOCALIZATION` | Objetos con bounding box y coordenadas | Inventarios, conteo de objetos |
| `SAFE_SEARCH_DETECTION` | Contenido adulto, violento o médico | Moderación de contenido |
| `IMAGE_PROPERTIES` | Colores dominantes y su porcentaje | Diseño, paletas de color |
| `LANDMARK_DETECTION` | Lugares geográficos famosos | Turismo, geolocalización |
| `LOGO_DETECTION` | Logos de marcas conocidas | Marketing, auditoría de marca |
| `WEB_DETECTION` | Imágenes similares en la web | Búsqueda inversa de imágenes |
| `CROP_HINTS` | Sugerencia de recorte óptimo | Thumbnails, composición |

---

## Ejemplos de Input / Output

### 1. LABEL_DETECTION — Imagen dental (radiografía)

**Input:** imagen JPEG de una radiografía dental

| Campo enviado | Valor |
| :--- | :--- |
| Imagen | `radiografia.jpg` (bytes en base64) |
| Feature | `LABEL_DETECTION` |
| maxResults | `10` |

**Output real:**

| Label devuelta | Score de confianza |
| :--- | :--- |
| X-ray | 0.97 |
| Medical imaging | 0.91 |
| Jaw | 0.84 |
| Tooth | 0.79 |
| Black and white | 0.71 |
| Medical equipment | 0.65 |
| Bone | 0.60 |

> [!WARNING]
> Vision API **no devuelve** `"periapical"`, `"panorámica"`, `"bite-wing"` ni ningún término odontológico específico. No tiene vocabulario clínico especializado. Para eso es necesario Gemini con el skill de clasificación.

---

### 2. DOCUMENT_TEXT_DETECTION — Formulario o receta

**Input:** foto de un formulario impreso

**Output (estructura simplificada):**

```json
{
  "fullTextAnnotation": {
    "text": "Paciente: Juan García\nFecha: 07/04/2026\nDiagnóstico: Caries mesial...",
    "pages": [
      {
        "blocks": [
          {
            "blockType": "TEXT",
            "boundingBox": { "vertices": [{"x": 12, "y": 44}, ...] },
            "paragraphs": [...]
          }
        ]
      }
    ]
  }
}
```

| Dato extraído | Tipo | Coordenadas |
| :--- | :--- | :--- |
| "Paciente: Juan García" | Línea de texto | x:12 y:44 → x:340 y:44 |
| "07/04/2026" | Línea de texto | x:12 y:70 → x:180 y:70 |
| "Caries mesial" | Línea de texto | x:12 y:96 → x:220 y:96 |

> [!TIP]
> Este es el caso de uso más sólido de Vision API: extraer texto de documentos escaneados con posición exacta de cada palabra. Gemini puede hacer esto también pero es más lento y costoso a escala.

---

### 3. OBJECT_LOCALIZATION — Imagen con múltiples elementos

**Input:** foto de una bandeja de instrumental dental

**Output:**

| Objeto detectado | Score | Bounding Box (normalizado) |
| :--- | :--- | :--- |
| Tray | 0.92 | top:0.1 left:0.05 bottom:0.9 right:0.95 |
| Tool | 0.87 | top:0.2 left:0.15 bottom:0.5 right:0.25 |
| Tool | 0.81 | top:0.2 left:0.35 bottom:0.5 right:0.45 |

> No identifica `"espejo bucal"` o `"explorador"` — solo categorías generales como `"Tool"` o `"Instrument"`.

---

### 4. SAFE_SEARCH_DETECTION — Moderación de contenido

**Input:** cualquier imagen

**Output:**

| Categoría | Nivel |
| :--- | :--- |
| adult | VERY_UNLIKELY |
| violence | UNLIKELY |
| medical | POSSIBLE |
| racy | VERY_UNLIKELY |
| spoof | VERY_UNLIKELY |

> Detecta que una imagen es de tipo médico, pero no qué tipo ni qué muestra.

---

## Lo que Google Vision API NO puede hacer

| Capacidad | Vision API | Gemini |
| :--- | :---: | :---: |
| Clasificar tipo de radiografía dental | No | Sí |
| Devolver diagnóstico clínico inferido | No | Sí |
| Seguir instrucciones de un prompt | No | Sí |
| Generar texto descriptivo de la imagen | No | Sí |
| Identificar patología visible | No | Sí |
| OCR de texto impreso con coordenadas | Sí | Parcial |
| Detectar objetos con bounding box | Sí | No (solo describe) |
| Procesar 1000 imágenes/min en batch | Sí | No (rate limits bajos) |
| Moderar contenido explícito | Sí | Parcial |

---

## Conclusión: ¿Cuándo usarla en este proyecto?

Para el flujo actual de clasificación de imágenes dentales, **Google Vision API no reemplaza a Gemini**. Su aporte real en este proyecto sería como **filtro previo** o **paso complementario**:

```
Imagen entrada
     │
     ▼
[Vision API] SAFE_SEARCH → ¿es imagen médica? → si NO, rechazar
     │
     ▼
[Vision API] LABEL_DETECTION → ¿contiene "Tooth", "X-ray"? → filtro básico
     │
     ▼
[Gemini + Skill] → clasificación clínica específica
     │
     ▼
JSON estructurado con tipo, diagnóstico, nombre_sugerido
```

Este enfoque híbrido tendría sentido solo si el volumen de imágenes es alto y se quiere reducir llamadas a Gemini (que es más costoso). Para volumen bajo, **Gemini directo es suficiente y más preciso**.
