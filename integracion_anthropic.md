# PROYECTO ARVIA — INTEGRACIÓN ANTHROPIC & HERMES
> **Fecha: 2026-04-30**
> **Versión: 1.2 (Resiliencia Híbrida)**

---

## 🚀 Logros del Día (Resumen Técnico)

### 1. Resiliencia de la API e Infraestructura (n8n v6)
*   **Workflow v6**: Se desplegó una nueva versión del workflow `web-api` con manejo de errores robusto.
*   **Garantía de Respuesta**: Implementación de `continueOnFail: true` y bloques `try/catch` en nodos críticos. Esto resolvió el error de "n8n no envió respuesta" (HTTP 200 vacío) durante las cargas masivas.
*   **Base de Datos**: Se actualizó el esquema local (`init.sql`) para incluir columnas de auditoría (`source`, `status`, `property_type`) y, fundamentalmente, `user_id`.

### 2. Identidad y Asociación de Datos
*   **Vínculo con Usuario**: El frontend ahora envía el `UID` de Firebase en todas las peticiones de publicación (individual y masiva).
*   **Dashboard Personalizado**: La consulta de propiedades en el dashboard ahora filtra automáticamente por el usuario logueado, permitiendo una experiencia multi-tenant real.

### 3. Integración Hermes Open Source
*   **Hermes Agent Framework**: Descargado y clonado en `D:\HERMES` para su uso transversal en proyectos.
*   **Inferencia Local**: Se integró **Hermes 3 (8b)** vía Ollama para manejar la carga operativa del sistema sin costos de API externos.

---

## 🧠 Arquitectura de IA Híbrida (Propuesta Implementada)

Se ha configurado una jerarquía de modelos para optimizar costos y garantizar disponibilidad:

| Tarea | Modelo Primario | Fallback (Respaldo) | Ubicación |
| :--- | :--- | :--- | :--- |
| **Operativa** (Chat, FAQ) | **Hermes 3 / Mistral** | Llama 3.1 | Local (Ollama) |
| **Inteligente** (Extracción) | **Claude / GPT** | **Hermes 3** | Nube → Local |

### Lógica de Fallback Automático en n8n:
Si una petición a un modelo premium (como Claude) falla por falta de internet, límites de cuota o error del proveedor, n8n redirige la tarea automáticamente a **Hermes 3** en el servidor local.

---

## 🛠️ Archivos Clave Creados/Modificados
- `web_api_workflow_v6.json`: Workflow maestro con lógica de resiliencia.
- `frontend/src/services/api.ts`: Cliente actualizado con soporte para `userId`.
- `D:\HERMES`: Framework de agentes de Nous Research.
- `D:\InitCore\init.sql`: Esquema de base de datos unificado.

---

## 📝 Change Log (2026-04-30)
- Implementación de selectores de Región/Comuna en cascada (datos SERVEL).
- Corrección de exportación en componentes UI (SelectLabel) para Vercel.
- Integración de `user_id` en todo el pipeline de datos.
- Configuración de arquitectura híbrida Anthropic/Hermes.

---
**Instrucción para Handoff:**
Para mantener la resiliencia, siempre asegurar que Ollama esté corriendo con el modelo `hermes3:8b` antes de iniciar el entorno de producción local.
