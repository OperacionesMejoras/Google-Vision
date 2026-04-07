# Guía de Inicio: Google Vision API

Este documento detalla las necesidades básicas para comenzar a integrar Google Cloud Vision en el proyecto.

## 1. Requisitos de Infraestructura
Para utilizar la API, es indispensable contar con lo siguiente:

- **Cuenta en Google Cloud Console:** Registro activo con facturación habilitada (aunque existe una capa gratuita generosa).
- **Proyecto en GCP:** Crear un proyecto específico para organizar los recursos.
- **API Habilitada:** Activar la "Cloud Vision API" dentro de la biblioteca de APIs del proyecto.

## 2. Autenticación y Seguridad
La forma recomendada de interactuar con la API es mediante **Cuentas de Servicio**.

| Elemento | Descripción |
| :--- | :--- |
| **Service Account** | Crear una cuenta con el rol `Cloud Vision AI Viewer` o similar. |
| **Credenciales (JSON)** | Generar y descargar la llave privada en formato `.json`. |
| **Variable de Entorno** | Configurar `GOOGLE_APPLICATION_CREDENTIALS` con la ruta del archivo JSON. |

## 3. Entorno de Desarrollo
Dependiendo del lenguaje elegido, se deben instalar las librerías cliente oficiales:

- **Node.js:** `@google-cloud/vision`
- **Python:** `google-cloud-vision`
- **Go:** `cloud.google.com/go/vision/apiv1`

## 4. Funcionalidades para Implementar
A continuación, las capacidades que exploraremos inicialmente:

- **Detección de Etiquetas:** Identificación de objetos o conceptos en la imagen.
- **OCR (Detección de Texto):** Extracción de texto impreso o manuscrito.
- **Propiedades de Imagen:** Análisis de colores dominantes y composición.
- **Safe Search:** Detección de contenido explícito o inapropiado.

---
> [!IMPORTANT]
> Nunca incluyas el archivo JSON de credenciales en el control de versiones (Git). Añádelo siempre a tu `.gitignore`.
