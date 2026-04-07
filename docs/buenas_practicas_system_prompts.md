# Buenas Prácticas: System Prompts

Guía de referencia para escribir system prompts efectivos con Gemini y Claude. Está pensada para el equipo que construye o itera herramientas en KeepSmiling, como complemento a los skills en `/examples/skills/`.

---

## ¿Qué es un system prompt?

Es la instrucción que define **quién es el modelo y cómo debe comportarse** antes de que el usuario hable. No es una pregunta. No es un mensaje. Es la configuración de identidad, restricciones y formato de salida del modelo para toda la conversación.

```
System prompt → define el rol y las reglas
User message  → la tarea concreta de esa llamada
```

La app Gemini de este proyecto (`examples/js/gemini/`) lo implementa así: el system prompt va en `systemInstruction` y el mensaje de usuario (opcional) en `contents`. El modelo lee las reglas del system prompt antes de procesar cualquier imagen.

---

## Anatomía de un system prompt efectivo

Todo system prompt que funciona bien tiene estas cinco partes, en este orden:

### 1. Identidad — *¿Quién sos?*

Una oración que define el rol con precisión clínica. No "sos un asistente útil". Especificidad total.

```
✗  Sos un experto en imágenes dentales.
✓  Sos un especialista en documentación fotográfica clínica odontológica,
   con formación en ortodoncia y alineadores.
```

La identidad importa porque ancla el vocabulario, el nivel de detalle y el tono del modelo en todas las respuestas. Un modelo con identidad vaga produce respuestas genéricas. Con identidad específica, produce respuestas de especialista.

> **Principio**: igual que un perfil psicológico no reduce a una persona a un diagnóstico, la identidad del modelo no debe reducirse a una etiqueta. Describí el *rol*, la *especialización* y el *criterio* que usa.

---

### 2. Función — *¿Qué hacés?*

Uno o dos párrafos que describen la tarea concreta. Sin ambigüedades.

```
Tu función es analizar imágenes dentales y clasificarlas con precisión
clínica para estandarizar el archivo fotográfico de los pacientes.
```

---

### 3. Taxonomía o Marco de referencia — *¿Con qué categorías trabajás?*

Si el modelo tiene que elegir entre opciones, dáselas explícitas. No confíes en que el modelo "ya sabe" cuáles son las categorías correctas para tu caso de uso.

El `classifier_skill.md` de este proyecto lista 20 tipos de fotografías dentales con su código exacto en `snake_case`. Eso elimina variación: el modelo no puede inventar `"foto_lateral"` cuando la categoría correcta es `"intraoral_lateral_derecha_oclusion"`.

Para otros dominios:
- Niveles de severidad → `["leve", "moderado", "severo", "crítico"]`
- Tipos de documento → `["receta", "consentimiento", "historia_clinica", "presupuesto"]`
- Categorías de consulta → nombres exactos de tu sistema interno

---

### 4. Reglas críticas — *¿Qué nunca podés hacer?*

Las restricciones más importantes van numeradas y en negrita. No enterradas en un párrafo.

```markdown
## Reglas críticas

1. **JSON puro**: tu respuesta es ÚNICAMENTE el objeto JSON. Sin texto antes ni después.
2. **Confianza honesta**: si la imagen es ambigua, indicá `"baja"` y explicalo.
3. **Si no es imagen dental**: devolvé `"tipo": "no_clasificable"` con la razón.
```

> **Principio**: los buenos perfiles clínicos siempre incluyen lo que el modelo *no debe hacer* además de lo que debe hacer. "Nunca reducir a un diagnóstico", "nunca inventar datos que no están en la imagen". Las restricciones son parte de la identidad, no penalizaciones.

---

### 5. Formato de salida — *¿Cómo entregás el resultado?*

Si esperás un formato estructurado, mostrá el schema exacto con un ejemplo real. El modelo no adivina tu estructura preferida.

```markdown
## Formato de respuesta

```json
{
  "tipo": "nombre_del_tipo",
  "descripcion": "descripción clínica breve",
  "nombre_sugerido": "nombre_estandarizado.jpg",
  "confianza": "alta | media | baja",
  "notas_clinicas": "observaciones adicionales o vacío"
}
```

Incluí al menos dos ejemplos: uno del caso feliz y uno del caso borde (imagen ambigua, elemento no reconocido, error esperado).

---

## Las 5 reglas de oro

### 1. Especificidad > generalidad

Cada vez que usás una palabra vaga, el modelo la interpreta a su criterio. "Relevante", "detallado", "apropiado" no significan nada sin contexto. Reemplazalas por descripciones concretas.

| Vago | Específico |
| :--- | :--- |
| Sé detallado | Incluí nombre, score de confianza y coordenadas del bounding box |
| Respondé en JSON | Respondé exclusivamente con el objeto JSON, sin markdown ni texto adicional |
| Analizá la imagen | Identificá el tipo de fotografía clínica según el listado de tipos |

---

### 2. El formato manda sobre las instrucciones

Si pedís JSON pero no lo explicás bien, el modelo va a envolver el JSON en ```markdown. Si pedís texto libre pero no aclarás el largo, puede devolver dos líneas o veinte.

**Siempre especificá:**
- Formato exacto (JSON, markdown, texto plano)
- Si el JSON va envuelto en markdown o no
- Largo esperado de la respuesta (`"descripción breve"` ≠ `"descripción de máximo 2 oraciones"`)
- Idioma si hay riesgo de mezcla

---

### 3. Los ejemplos valen más que las instrucciones

Una instrucción dice `"devolvé confianza alta, media o baja"`. Un ejemplo muestra qué significa "baja" en la práctica:

```json
{
  "confianza": "baja",
  "descripcion": "Imagen borrosa sin estructuras dentales identificables."
}
```

Incluí siempre al menos:
- **Ejemplo positivo** (caso ideal)
- **Ejemplo de caso borde** (imagen ambigua, fuera de categoría, baja calidad)

---

### 4. Calibrá la temperatura según la tarea

La temperatura no es un parámetro técnico menor. Define si el modelo explora o ejecuta.

| Tarea | Temperatura recomendada |
| :--- | :--- |
| Clasificación / extracción de datos | `0.0 – 0.2` |
| Evaluación clínica con razonamiento | `0.2 – 0.4` |
| Análisis interpretativo / diagnóstico diferencial | `0.4 – 0.6` |
| Generación de texto creativo o redacción | `0.6 – 0.9` |

Para las herramientas de KeepSmiling (clasificación, evaluación de calce, viabilidades), el rango `0.1 – 0.3` es el correcto. Alta temperatura en clasificación genera variación innecesaria en los nombres de tipo.

---

### 5. Declaración de honestidad ante la incertidumbre

El modelo tenderá a responder con confianza incluso cuando no la tiene. Para tareas clínicas, esto es peligroso. Instruilo explícitamente:

```
Si la imagen no permite determinar el tipo con certeza, indicá "confianza": "baja"
y explicá en "descripcion" por qué. No inventes un tipo que no puedas justificar.
```

> **Principio del Psicólogo**: los perfiles psicológicos bien construidos siempre tienen un campo de limitaciones — "esta observación asume X", "sin más contexto no es posible determinar Y". El modelo debe hacer lo mismo.

---

## Errores frecuentes

### El prompt no tiene identidad, solo instrucciones

```
✗  Cuando recibas una imagen, identificá qué tipo de foto es y devolvé un JSON
   con el tipo y la descripción.

✓  Sos un especialista en documentación fotográfica clínica odontológica. Tu
   función es clasificar imágenes dentales con precisión clínica. [continúa...]
```

Sin identidad, el modelo adopta una genérica. Con identidad, el vocabulario y el criterio son los del especialista.

---

### Instrucciones de formato enterradas en texto

```
✗  Respondé con un JSON que tenga tipo, descripcion, nombre_sugerido y confianza,
   y si hay notas clínicas también incluílas, todo sin markdown.

✓  ## Formato de respuesta
   Respondé ÚNICAMENTE con el siguiente objeto JSON, sin markdown, sin texto adicional:
   { "tipo": ..., "descripcion": ..., "nombre_sugerido": ..., "confianza": ..., "notas_clinicas": ... }
```

---

### Taxonomía implícita

```
✗  Identificá el tipo de fotografía.

✓  Identificá el tipo de fotografía según esta lista exacta:
   - intraoral_frontal_oclusion
   - intraoral_lateral_derecha_oclusion
   - [... lista completa ...]
   Si no coincide con ninguna, devolvé "no_clasificable".
```

---

### Ausencia del caso borde

Un prompt que solo describe el caso ideal falla cuando llega una imagen borrosa, una foto de algo que no es dental, o una imagen de baja calidad. Siempre definí qué hace el modelo en el peor caso.

---

### Confianza ciega en el modelo

El modelo no "entiende" el dominio. Razona sobre patrones de lenguaje. Para clasificaciones clínicas, el criterio está en el sistema prompt, no en el modelo. Si el criterio no está escrito, el modelo improvisa.

---

## Plantilla base

```markdown
# [Nombre del skill]

Sos un **[rol específico]** con [especialización]. Tu función es [tarea concreta].

## Tu identidad y criterio

- **Rol**: [descripción del rol]
- **Especialización**: [área específica]
- **Criterio**: [cómo tomás decisiones]
- **Comportamiento**: [restricción clave de formato]

## [Categorías / Marco de referencia]

[Lista o tabla con las opciones válidas — no dejes esto implícito]

## Reglas críticas

1. **[Regla de formato]**: [descripción exacta]
2. **[Regla de honestidad]**: [qué hacer cuando no hay certeza]
3. **[Regla del caso borde]**: [qué devolver cuando algo no encaja]

## Formato de respuesta

```json
{
  "campo_1": "descripción del valor esperado",
  "campo_2": "opciones posibles: a | b | c",
  "campo_3": "descripción o vacío si no aplica"
}
```

## Ejemplos

**Ejemplo 1 — Caso ideal:**
```json
{ ... }
```

**Ejemplo 2 — Caso borde / baja calidad:**
```json
{ ... }
```
```

---

## Referencia: classifier_skill.md

El skill en `examples/skills/classifier_skill.md` es el ejemplo canónico de esta guía aplicado al dominio dental. Revisarlo antes de escribir un skill nuevo. Tiene:

- Identidad declarada en la primera oración
- 20 tipos de fotografías con código exacto
- 5 reglas críticas numeradas
- Schema JSON con descripción de cada campo
- 3 ejemplos (caso ideal, caso con alineador, caso no clasificable)

Cualquier skill nuevo debería tener la misma estructura.