# PROJECT CONTEXT — ARVIA AI AUTOMATION

> **Fuente de verdad absoluta del sistema.**
> Toda IA o desarrollador debe leer este documento antes de modificar cualquier componente.
> Última actualización: 2026-04-28 (v1.1 Bulk Support & Architecture Cleanup)

---

## 1. Arquitectura General (Arvia v1.1)

El sistema opera en una arquitectura híbrida producción-local optimizada para escalabilidad:

- **Frontend**: Next.js 14 alojado en **Vercel** (arvia-nu.vercel.app).
- **Identidad**: **Firebase Authentication** (Google + Email/Password).
- **Cerebro (n8n)**: Orquestación alojada localmente via Docker. Se han separado los flujos para mayor estabilidad:
    - **Workflow Telegram**: Gestiona el bot omnicanal. (Archivo: `InitCore Telegram AI Agent (Full) [completo].json`)
    - **Workflow Web API**: Gestiona búsquedas, publicaciones y carga masiva. (Archivo: `web_api_workflow_final.json`)
- **Túnel**: Túnel fijo **ngrok** con dominio estático. Requiere `authtoken` verificado.
- **Persistencia**: PostgreSQL local (Docker).
- **LLM**: Ollama (llama3) para clasificación y generación de respuestas.

---

## 2. Capas del Sistema

### 2.1 Identidad (Firebase)
- **Proveedor**: Firebase Auth.
- **Dominios Autorizados**: `localhost`, `arvia-nu.vercel.app`.

### 2.2 Frontend (Arvia UI)
- **Framework**: Next.js 14 (App Router).
- **Styling**: Tailwind CSS + Framer Motion.
- **API Client**: `src/services/api.ts` centraliza las peticiones con headers de bypass para ngrok (`ngrok-skip-browser-warning: 69420`).

---

## 3. Base de Datos (PostgreSQL)

### 3.1 Tablas Principales
- `properties`: Catálogo inmobiliario.
- `messages`: Historial de conversaciones (Omnicanal).
- `leads`: Captura de interesados.
- `user_state`: Máquina de estados para el Wizard de Telegram.

### 3.2 Acceso Local
- **Puerto Externo**: `5433`
- **Docker Stack**: Gestionado por `docker-compose.yml` en la raíz.

---

## 4. Infraestructura y Despliegue

### 4.1 Túnel Fijo (ngrok)
- **Dominio**: `atrium-pony-reburial.ngrok-free.dev`
- **Configuración**: Ejecutar `ngrok config add-authtoken TU_TOKEN` antes de iniciar.

### 4.2 Scripts de Inicio
- **`start-n8n.bat`**: Levanta Docker y el túnel ngrok automáticamente.

---

## 5. Change Log

### [2026-04-28] - Arvia v1.1 Bulk Update
- **Descripción**: Añadida capacidad de carga masiva de propiedades. Generación de dataset de muestra (`propiedades_muestra_chile.csv`). Arreglo de CORS y bypass de ngrok. Reestructuración de workflows en n8n en dos archivos separados para evitar errores de importación.

---

## 6. Instrucciones para la IA / Handoff

```markdown
- Ubicación: D:\InitCore
- Frontend: Next.js en /frontend
- Backend: n8n local (Workflows separados: Telegram y Web API)
- DB: Postgres en puerto 5433
- Importante: Siempre usar el header de bypass para ngrok en peticiones API.
```