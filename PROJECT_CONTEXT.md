# PROJECT CONTEXT — INITCORE AUTOMATION

> **Fuente de verdad absoluta del sistema.**
> Toda IA o desarrollador debe leer este documento antes de modificar cualquier componente.
> Última actualización: 2026-04-22

---

## 1. Arquitectura General

El sistema sigue una arquitectura desacoplada basada en:

- Adapters (entrada por canal)
- Core (lógica central + idempotencia)
- Persistencia (PostgreSQL)
- LLM (Ollama local / Anthropic en roadmap)
- Frontend (Next.js 14 SaaS UI)

Flujo activo:

1. **Telegram Flow**:
Telegram → Adapter (Extract) → DB Insert → Memory → Context
→ LLM Intent Classifier → IF Intent → Static o AI Response
→ DB Update → Telegram Reply

2. **Web Flow**:
Frontend → API Client → n8n Webhook → DB Query → JSON Response
→ UI Render (Framer Motion)

3. **AI Assistant Flow**:
UI Button → n8n AI Proxy → Ollama → Reply

---

## 2. Capas del Sistema

### 2.1 Adapter Layer (Canales)

Responsabilidad:
- Recibir mensajes desde canales (Telegram, WhatsApp, etc.)
- Normalizar datos al contrato de 5 campos

Canales activos:
- ✅ Telegram (Bot Token configurado)

Canales en roadmap:
- WhatsApp (Twilio)
- Webchat
- Gmail

---

### 2.2 Contrato de entrada al Core (OBLIGATORIO)

El Core SIEMPRE recibe:

```json
{
  "channel": "string",
  "message_id": "string",
  "sender_id": "string",
  "text": "string",
  "hash": "string"
}
```

Reglas:
- Este contrato NO puede cambiar
- Ningún nodo puede agregar campos fuera de este contrato
- Todos los adapters deben cumplir estrictamente este formato

---

### 2.3 Core Layer

Responsabilidad:
- Idempotencia (hash único)
- Validación de input
- Clasificación de mensajes via LLM (Ollama)
- Decisión de flujo (static vs AI)

Estados posibles:
- processing
- completed
- skipped
- error

---

### 2.4 Lógica de decisión (Intent Classification)

El clasificador de intent usa Ollama llama3 para decidir:

| Intent detectado | Acción |
|---|---|
| `saludo` | Respuesta estática de bienvenida |
| `precio` | Respuesta estática de precios |
| `soporte` | Respuesta estática de soporte |
| `consulta_propiedad` | Flujo de búsqueda de propiedades en base de datos |
| `lead_propiedad` | Flujo de captura progresiva de datos (nombre, teléfono) |
| `otro` | Llamada completa a AI Response (Ollama) |

---

## 3. Idempotencia (CRÍTICO)

- `hash` es la clave principal de idempotencia lógica
- Implementado via `ON CONFLICT (hash) DO NOTHING`
- `message_id` es solo para trazabilidad

Reglas:
- Nunca eliminar esta lógica
- Nunca cambiar el uso de hash
- Nunca reemplazarlo por otro identificador

---

## 4. Base de Datos

### 4.1 Tablas Principales

```sql
-- Mensajes y Trazabilidad
CREATE TABLE initcore_messages (
  id SERIAL PRIMARY KEY,
  channel TEXT,
  message_id TEXT,
  sender_id TEXT,
  text TEXT,
  hash TEXT UNIQUE,
  status TEXT,
  intent TEXT,
  response JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Propiedades (Real Estate)
CREATE TABLE properties (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  region TEXT,
  comuna TEXT NOT NULL,
  address TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  sqm NUMERIC,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leads (Captura)
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  nombre TEXT,
  telefono TEXT,
  interes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Estados (Wizard)
CREATE TABLE user_state (
  user_id TEXT PRIMARY KEY,
  step TEXT NOT NULL, -- comuna, dormitorios, banos, done
  comuna TEXT,
  dormitorios TEXT,
  banos TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Regla crítica de response
- `response` SIEMPRE debe tener valor si status = completed o skipped.
- Nunca guardar NULL en response si status != error.

---

## 5. Infraestructura Local

### 5.1 Docker y Puertos
| Servicio | Puerto Externo | Función |
|---|---|---|
| postgres | 5433 | Persistencia |
| n8n | 5678 | Orquestación |
| frontend | 3000 | SaaS UI (Next.js) |
| ollama | 11434 | LLM Local |

### 5.2 Ngrok
- URL: `https://atrium-pony-reburial.ngrok-free.dev/`
- Crucial para Webhooks de Telegram y API externa.

---

## 6. Plan de Acción (Roadmap)

### ✅ COMPLETADO
- [x] Wizard Inmobiliario Determinista (Telegram).
- [x] Frontend Premium en Next.js 14 con navegación completa.
- [x] Capa de Servicios en Frontend (`src/services/api.ts`).
- [x] Infraestructura Docker + ngrok automatizada.
- [x] Fix `init.sql` y montaje automático de DB.

### 📋 PRÓXIMOS PASOS (Salir a Producción)
- [ ] **Configurar API URL**: Apuntar Frontend a la URL real de n8n/ngrok.
- [ ] **Firebase Auth**: Configurar llaves reales para login/registro.
- [ ] **Ollama Prompting**: Refinar la personalidad del asistente.
- [ ] **Error Handling**: Ramas de "Fallback" en n8n para cuando el LLM no responda.
- [ ] **Deploy**: Subir el frontend a Vercel/Netlify y el backend a un VPS con Docker.

---

## 7. Change Log (OBLIGATORIO)

### [2026-04-22] - Frontend Refactor & Navigation
- **Tipo**: refactor / feature
- **Descripción**: Migración de lógica de API a `src/services/api.ts`. Conexión de todas las rutas del mockup (Explore, Detail, Publish, Dashboard). Implementación de Navbar persistente.
- **Impacto**: Frontend.
- **Archivos**: `src/services/api.ts`, `layout.tsx`, `page.tsx`, etc.

### [2026-04-22] - Deterministic Wizard & Infra Fix
- **Tipo**: feature / infra
- **Descripción**: Implementación de `user_state` y Wizard guiado en Telegram. Fix de `init.sql`.

---

## 8. Prompt de Contexto Final para IA

```markdown
Eres un desarrollador Senior Fullstack/Automation en InitCore.
- Frontend: Next.js 14 (D:\InitCore\frontend) -> Puerto 3000
- Backend: n8n (Docker) -> Puerto 5678
- DB: PostgreSQL (Docker) -> Puerto 5433
- LLM: Ollama (llama3) -> Puerto 11434
- Telegram: Wizard determinístico activo.

Tarea: Seguir extendiendo el sistema respetando la arquitectura de capas y el contrato de 5 campos del Core.
Fuente de Verdad: D:\InitCore\PROJECT_CONTEXT.md
```