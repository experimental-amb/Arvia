# InitCore — Frontend

Frontend premium para **InitCore**, el agente inmobiliario con IA: búsqueda por
lenguaje natural, publicación guiada, dashboard de corredor y un asistente
flotante estilo ChatGPT conectado al workflow de n8n.

Construido con:

- **Next.js 14** (App Router, React Server + Client Components)
- **Tailwind CSS** + **shadcn/ui** (primitivas inlineadas en `src/components/ui`)
- **Framer Motion** para transiciones y micro-interacciones
- **Firebase Auth** (email/password + Google) con fallback a modo demo
- Diseño dark por defecto · glassmorphism · bordes `rounded-2xl` · soft shadows

## Estructura

```
src/
├── app/                        App Router
│   ├── layout.tsx              Navbar + AIAssistantButton + AuthProvider
│   ├── page.tsx                /           Home + HeroSearch
│   ├── search/page.tsx         /search     Grid + filtros + resumen IA
│   ├── property/[id]/page.tsx  /property/:id  Detalle + carrusel + CTAs
│   ├── publish/page.tsx        /publish    Formulario 3 pasos
│   ├── dashboard/page.tsx      /dashboard  Métricas + tabla
│   └── login/page.tsx          /login      Email + Google + modo demo
├── components/
│   ├── Navbar.tsx
│   ├── HeroSearch.tsx          typewriter + chips + framer layoutId
│   ├── PropertyCard.tsx
│   ├── PropertyGrid.tsx        loading skeletons + empty states
│   ├── PropertyDetail.tsx      sticky sidebar + WhatsApp + simulador
│   ├── PublishForm.tsx         drag-and-drop + preview en vivo
│   ├── DashboardTable.tsx      desktop table + mobile cards
│   ├── FilterSidebar.tsx       comuna, dormitorios, baños, precio, m²
│   ├── ImageCarousel.tsx       framer AnimatePresence + thumbs
│   ├── AIAssistantButton.tsx   chat flotante con estado y typing dots
│   └── ui/                     Primitivas shadcn (button, input, dialog…)
├── lib/
│   ├── firebase.ts             Init lazy + detección de config
│   ├── auth-context.tsx        Provider + modo demo
│   ├── api.ts                  Capa fetch · toggle mock vs backend
│   ├── mock-data.ts            Seed alineada a init.sql de InitCore
│   └── utils.ts                cn() + formatPrice + formatSqm
└── types/property.ts           Contract Property + SearchFilters
```

## Setup

```bash
pnpm install        # o npm / yarn
cp .env.local.example .env.local
pnpm dev
```

Abrir <http://localhost:3000>.

### Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Credenciales Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | |
| `NEXT_PUBLIC_API_BASE_URL` | URL del backend n8n (p.ej. `https://atrium-pony-reburial.ngrok-free.dev`) |
| `NEXT_PUBLIC_USE_MOCK_DATA` | `true` para ignorar el backend y usar mocks |

Si Firebase no está configurado, el login muestra un aviso y habilita el **modo demo**
(usuario simulado persistido en `localStorage`).

## Integración con el backend InitCore (n8n + PostgreSQL)

La capa `src/lib/api.ts` asume estos endpoints (todos opcionales mientras
`USE_MOCK_DATA=true`):

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/properties?q&comuna&bedrooms&…` | Lista + filtros (mapea a `ILIKE` en `properties`) |
| `GET` | `/api/properties/:id` | Ficha individual |
| `POST` | `/api/properties` | Insert en `properties` (usar `ON CONFLICT` si aplica) |
| `GET` | `/api/dashboard/properties` | Listings del usuario autenticado |
| `POST` | `/api/ai/search` | Llama al clasificador + Wizard determinístico del workflow |
| `POST` | `/api/ai/assistant` | Puente al nodo `Classify Intent` / `AI Response` (Ollama llama3) |

Cada endpoint debe respetar el **contrato InitCore** documentado en
`PROJECT_CONTEXT.md` (sección 2.2). Los adapters del frontend NO agregan campos
fuera de los 5 canónicos cuando envían mensajes al core.

### Reglas no negociables heredadas del backend

- El contrato de `Property` mapea 1:1 con la tabla `properties`. No se agregan
  campos que el schema no tenga.
- `images` viaja como `string[]` (JSONB en el back).
- `price` siempre en CLP por defecto (sobreescribible con `currency`).

## Componentes clave

### HeroSearch
Input con **placeholder typewriter** (cicla 5 prompts), chips clickeables y
glow animado con `motion`. Al enviar, navega a `/search?q=…`.

### PropertyCard
Card glassmorphism con hover lift, badge de estado, resumen IA opcional.
Las imágenes usan `<img>` directo para evitar ruido de `next/image` con
Unsplash; cambiar a `next/image` si se usa un CDN propio.

### AIAssistantButton
Botón flotante en la esquina inferior derecha (`fixed bottom-6 right-6`).
Abre un panel chat estilo Linear/Intercom. Habla con `POST /api/ai/assistant`
o responde con heurísticas en mock mode. Pensado para conectarse al mismo
Ollama llama3 del bot de Telegram.

### FilterSidebar
Filtros: comuna, dormitorios mín., baños mín., precio máx. (slider), m² min/max.
Sticky en desktop; colapsable en mobile vía grid.

### DashboardTable
Tabla desktop + lista de cards mobile. Badges de estado mapeados a
`PropertyStatus = "active" | "draft" | "reserved" | "sold"`.

## Animaciones (Framer Motion)

- Navbar: `layoutId="nav-pill"` para el indicador activo animado entre tabs.
- Cards: entrada escalonada (`delay: index * 0.05`).
- HeroSearch: glow pulsante + typewriter.
- PropertyDetail: slide-in del carrusel con `AnimatePresence custom`.
- AIAssistant: bounce pulsante en el botón, spring-in del panel, typing dots.

## Producción

```bash
pnpm build && pnpm start
```

Este paquete es **solo frontend**: no hay rutas `/api` propias, no hay
`server actions` que escriban DB. Toda persistencia se delega a los endpoints
expuestos por el workflow de n8n (o a otros servicios vía `NEXT_PUBLIC_API_BASE_URL`).

## Roadmap corto

- Conectar `aiChat` al endpoint real expuesto por el nodo `AI Response` de
  `workflow.json`.
- Firebase App Check para proteger las credenciales públicas.
- Reemplazar `<img>` por `next/image` + CDN propio.
- Toast system (ya instalado `@radix-ui/react-toast`) para el feedback de
  `publishProperty` y errores de auth.
