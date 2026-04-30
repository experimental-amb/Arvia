# PROJECT CONTEXT — ARVIA AI AUTOMATION
> **Fuente de verdad absoluta del sistema.**
> Toda IA o desarrollador debe leer este documento antes de modificar cualquier componente.
> **Última actualización:** 2026-04-30 (v1.5 — API Key validation, UNNEST bulk insert, Auditoría de seguridad)

---

## 1. Arquitectura General

```
Browser (Vercel)
  └─▶ /api/n8n  [Next.js proxy — mismo origen, sin CORS]
        └─▶ ngrok (atrium-pony-reburial.ngrok.io/webhook/web-api)
              └─▶ n8n 2.17.3 (Docker local)
                    └─▶ PostgreSQL 15 (Docker local, puerto 5433)
```

- **Frontend**: Next.js 14 — `arvia-nu.vercel.app`
- **Auth**: Firebase Auth (Google + Email/Password)
- **Proxy API**: `frontend/src/app/api/n8n/route.ts` — elimina errores CORS
- **Backend**: n8n 2.17.3 con workflow maestro `web_api_workflow_v7.json`
- **IA primaria**: Claude 3 Sonnet (nodo Anthropic n8n)
- **IA fallback**: Hermes 3 8b (Ollama local, `host.docker.internal:11434`)
- **Túnel**: ngrok dominio fijo `atrium-pony-reburial` (no cambia al reiniciar)

---

## 2. Archivos Clave

| Archivo | Propósito |
|---|---|
| `web_api_workflow_v7.json` | **Workflow maestro** — importar y activar en n8n |
| `init.sql` | Schema PostgreSQL completo |
| `docker-compose.yml` | Docker Stack (n8n + PostgreSQL) |
| `ARVIA_START_PRO.bat` | Lanzador: Docker + ngrok + abre apps |
| `frontend/src/app/api/n8n/route.ts` | Proxy Next.js (elimina CORS) |
| `frontend/src/services/api.ts` | Cliente API con unwrap del envelope n8n |
| `frontend/src/components/BulkImportModal.tsx` | Carga masiva CSV/XLSX |
| `frontend/src/components/DashboardTable.tsx` | Tabla con toggle publicar/ocultar |
| `plantilla_arvia.csv` | Plantilla para importación masiva |
| `contexto_an.md` | Memoria técnica detallada (en .gitignore, no se sube) |

---

## 3. Operaciones de la API (workflow v7)

Todas las peticiones: `POST /webhook/web-api` con `{ operation, payload }`.

| Operación | Payload | Descripción |
|---|---|---|
| `ai_search` | `{ prompt, userId? }` | Búsqueda con IA, filtra por userId si se pasa |
| `publish` | `{ title, comuna, price, userId, ... }` | Publica una propiedad |
| `publish_bulk` | `{ properties: [], userId }` | Importación masiva |
| `get_property` | `{ id }` | Obtener propiedad por ID |
| `get_stats` | `{}` | Métricas del dashboard |
| `toggle_status` | `{ id, status, userId? }` | Cambiar status a `published` o `draft` |

**⚠️ Formato respuesta:** n8n v7 envuelve SIEMPRE en `{ success, data, count, timestamp }`.
El cliente `api.ts` desenvuelve con `unwrapN8n()` en cada método.

---

## 4. Base de Datos

### Puerto: `5433` (externo) → `5432` (interno Docker)

### Tabla `properties` (campos principales)
```
id (bigserial), user_id (text), title, price, region, comuna,
bedrooms, bathrooms, sqm, images