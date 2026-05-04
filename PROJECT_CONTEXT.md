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
bedrooms, bathrooms, sqm, images (jsonb),
status ('draft' | 'published' | 'archived'),
property_type ('departamento'|'casa'|'terreno'|'comercial'|'otro'),
transaction_type ('venta' | 'arriendo'),
source ('manual'|'bulk_import'|'scraper'|'api'|'web_dashboard'),
source_url (unique — para deduplicación), created_at, updated_at
```

**Multi-tenancy:** cada propiedad lleva `user_id` (Firebase UID). El dashboard filtra por `user_id` del usuario autenticado.

### Otras tablas
`messages`, `hashes`, `errors`, `responses`, `metrics` — pipeline de mensajería multicanal
`leads`, `user_state` — captura de interesados y estado del bot Telegram
`import_jobs` — seguimiento de importaciones masivas

---

## 5. Variables de Entorno (Vercel)

| Variable | Valor | Nota |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://atrium-pony-reburial.ngrok.io/webhook/web-api` | URL completa con path |
| `NEXT_PUBLIC_API_KEY` | `arvia-dev-key-changeme` | Cambiar en producción real |
| `NEXT_PUBLIC_USE_MOCK_DATA` | `false` | `true` solo para demos sin backend |
| `NEXT_PUBLIC_FIREBASE_*` | Ver Firebase Console | Auth |
| `N8N_WEBHOOK_URL` | Igual a `NEXT_PUBLIC_API_BASE_URL` | Preferido (server-only) |
| `N8N_API_KEY` | Igual a `NEXT_PUBLIC_API_KEY` | Preferido (server-only) |

---

## 6. Funcionalidades Implementadas

### Frontend ✅
- Login Google + Email/Password (Firebase)
- Dashboard con métricas reales (properties, leads, messages)
- Tabla de propiedades con **toggle publicar/ocultar** por fila (actualización optimista)
- Carga masiva CSV/XLSX con validación, reset automático del modal
- Publicación individual de propiedades con formulario
- Búsqueda en lenguaje natural con IA
- Vista detalle de propiedad

### Backend (n8n) ✅
- Router por operación en un único webhook
- Validación API key en cada petición
- Bulk insert con `user_id` (multi-tenancy)
- IA híbrida Claude → Hermes fallback automático
- Toggle status (`published` / `draft`)
- Logging de errores a tabla `errors`

### Infraestructura ✅
- Proxy Next.js `/api/n8n` (CORS eliminado)
- ngrok dominio fijo
- Docker Compose (n8n + PostgreSQL)
- Deploy automático Vercel ← GitHub `main`
- GitHub CodeQL (análisis de seguridad)

---

## 7. Diagnóstico de Errores Comunes

| Error | Causa | Solución |
|---|---|---|
| `404 n8n` | Workflow no activo | Activar toggle en n8n UI |
| `Failed to fetch` | CORS / ngrok caído | Verificar ngrok, usar proxy `/api/n8n` |
| Stats `undefined` | Envelope n8n no desenvuelto | `unwrapN8n()` en api.ts (ya implementado) |
| Propiedades vacías en dashboard | `user_id = NULL` o respuesta no desenvuelta | `UPDATE properties SET user_id='uid' WHERE user_id IS NULL` |
| `AUTH_FAILED` | API key incorrecta | Verificar `NEXT_PUBLIC_API_KEY` en Vercel |
| `BULK_EMPTY` | CSV vacío o sin columnas válidas | Usar plantilla `plantilla_arvia.csv` |

---

## 8. Inicio Rápido Local

```
1. ARVIA_START_PRO.bat              → levanta Docker + ngrok
2. n8n (localhost:5678)             → importar v7.json + activar toggle
3. cd frontend && npm run dev       → http://localhost:3000
```

**Test del webhook:**
```powershell
Invoke-RestMethod -Uri "https://atrium-pony-reburial.ngrok.io/webhook/web-api" `
  -Method POST -ContentType "application/json" `
  -Headers @{"ngrok-skip-browser-warning"="true"} `
  -Body '{"operation":"get_stats","payload":{}}'
```

---

## 9. Pendiente (Próximas Sesiones)

- [ ] Selector Región/Comuna en cascada (RM → lista de comunas)
- [ ] Editar / Eliminar propiedad desde dashboard
- [ ] Paginación en tabla del dashboard
- [ ] Activar API key Claude en n8n Credentials
- [ ] Subida de imágenes para propiedades
- [ ] Barber-OS (nuevo módulo SaaS independiente)

---

## 10. Change Log

| Versión | Fecha | Cambios |
|---|---|---|
| v1.0 | 2026-04-24 | Launch inicial — auth, dashboard, publicación |
| v1.1 | 2026-04-28 | Carga masiva, fix CORS/ngrok, workflows separados |
| v1.2 | 2026-04-29 | Web API workflow v4, dashboard stats reales, scraper ML |
| v1.3 | 2026-04-30 | Proxy /api/n8n (CORS fix), fix user_id NULL, workflow v6 IA híbrida |
| v1.4 | 2026-04-30 | Fix envelope n8n (undefined stats+props), toggle publicar/ocultar, workflow v7 |
| v1.5 | 2026-04-30 | **API key validation** re-añadida en workflow v7 (faltaba desde v6), **UNNEST batch insert** bulk (O(1) round-trip), auditoría seguridad |
