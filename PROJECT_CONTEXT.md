# PROJECT CONTEXT — ARVIA AI AUTOMATION

> **Fuente de verdad absoluta del sistema.**
> Toda IA o desarrollador debe leer este documento antes de modificar cualquier componente.
> Última actualización: 2026-04-24 (v1.0 Production Ready)

---

## 1. Arquitectura General (Arvia v1.0)

El sistema ha evolucionado a una arquitectura híbrida producción-local:

- **Frontend**: Next.js 14 alojado en **Vercel** (arvia-nu.vercel.app).
- **Identidad**: **Firebase Authentication** (Google + Email/Password).
- **Cerebro (n8n)**: Orquestación alojada localmente via Docker + Túnel fijo **ngrok**.
- **Persistencia**: PostgreSQL local (Docker).
- **LLM**: Ollama (llama3) para clasificación y generación de respuestas.

---

## 2. Capas del Sistema

### 2.1 Identidad (Firebase)
- **Proveedor**: Firebase Auth.
- **Dominios Autorizados**: `localhost`, `arvia-nu.vercel.app`.
- **Almacenamiento**: Las identidades de los usuarios NO están en la base de datos local, están en la nube de Firebase.

### 2.2 Frontend (Arvia UI)
- **Framework**: Next.js 14 (App Router).
- **Styling**: Tailwind CSS + Framer Motion.
- **API Client**: `src/services/api.ts` centraliza todas las peticiones al n8n Webhook.
- **Modo Demo**: Permite explorar la UI sin backend si `NEXT_PUBLIC_USE_MOCK_DATA=true`.

---

## 3. Base de Datos (PostgreSQL)

### 3.1 Tablas Principales
- `properties`: Catálogo inmobiliario (Sincronizado con UI y Telegram).
- `initcore_messages`: Historial de conversaciones (Omnicanal).
- `leads`: Captura de interesados.
- `user_state`: Máquina de estados para el Wizard de Telegram.

### 3.2 Acceso Local (DBeaver)
- **Puerto Externo**: `5433`
- **Credenciales**: Definidas en el archivo `.env` raíz (no subido a Git).

---

## 4. Infraestructura y Despliegue

### 4.1 Variables de Entorno
- **Frontend (`.env.local`)**: Contiene las API Keys de Firebase y la URL del Webhook de n8n.
- **Backend (`.env`)**: Contiene contraseñas de DB, llaves de encriptación de n8n y el dominio de ngrok.

### 4.2 Túnel Fijo (ngrok)
- **Dominio**: `atrium-pony-reburial.ngrok-free.dev`
- **Uso**: Permite que Vercel y Telegram lleguen a tu PC local de forma segura.

---

## 5. Plan de Acción (Roadmap)

### ✅ COMPLETADO
- [x] **Branding Arvia**: Renombrado completo de InitCore a Arvia.
- [x] **Firebase Auth**: Integración de login real en producción.
- [x] **Producción en Vercel**: Web desplegada y funcional.
- [x] **Dominio Fijo**: Configuración de ngrok para evitar desconexiones.
- [x] **Limpieza de Seguridad**: Historial de Git limpio de secretos (Twilio, etc).

### 📋 PRÓXIMOS PASOS
- [ ] **Migración a VPS**: Mover n8n y Postgres a la nube (Railway/Render) para evitar depender de la PC encendida.
- [ ] **WhatsApp Business**: Activar el canal oficial una vez aprobada la cuenta.
- [ ] **Dashboard de Métricas**: Visualización de leads y conversiones en tiempo real.

---

## 6. Change Log

### [2026-04-24] - Arvia v1.0 Release
- **Tipo**: Major Release / Production
- **Descripción**: Despliegue exitoso a Vercel. Integración de Firebase Auth. Configuración de dominio estático ngrok. Limpieza profunda de secretos en Git. 
- **Impacto**: El sistema ahora es accesible por cualquier usuario en internet.

---

## 7. Instrucciones para la IA

```markdown
Eres el asistente de Arvia.
- Frontend: D:\InitCore\frontend -> Desplegado en Vercel.
- Backend: n8n local puerto 5678.
- DB: PostgreSQL puerto 5433.
- Identidad: Firebase Auth.

Siempre verifica que las URLs apunten al dominio fijo de ngrok.
```