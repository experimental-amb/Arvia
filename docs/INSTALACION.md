# Guía de instalación — InitCore v1.0

Esta guía te lleva desde un Windows 11 limpio hasta tener **InitCore** recibiendo mensajes de WhatsApp y Telegram, normalizándolos y almacenándolos en PostgreSQL.

Tiempo estimado: **45–60 minutos**.

---

## 1. Requisitos previos

Antes de empezar, asegúrate de tener instalado:

- **Docker Desktop** para Windows (con WSL2 habilitado). Descarga: https://www.docker.com/products/docker-desktop/
- **Git** para Windows: https://git-scm.com/download/win
- **Node.js 18+** (opcional, sólo si quieres correr scripts auxiliares): https://nodejs.org/
- **ngrok** (para exponer el webhook local a Twilio/Telegram durante desarrollo): https://ngrok.com/download
- Una cuenta de **Twilio** con número de WhatsApp Sandbox activado.
- Un **bot de Telegram** creado con @BotFather (tendrás un token tipo `123456:ABC-DEF...`).

Verifica la instalación abriendo PowerShell y ejecutando:

```powershell
docker --version
git --version
ngrok --version
```

---

## 2. Configurar PostgreSQL

InitCore usa PostgreSQL 15+ como almacén persistente.

### 2.1 Levantar el contenedor

Crea la carpeta de datos y lanza el contenedor:

```powershell
mkdir D:\InitCore\data
mkdir D:\InitCore\data\postgres

docker run -d `
  --name initcore-postgres `
  -e POSTGRES_USER=initcore `
  -e POSTGRES_PASSWORD=CambiaEstaClave123! `
  -e POSTGRES_DB=initcore `
  -p 5432:5432 `
  -v D:\InitCore\data\postgres:/var/lib/postgresql/data `
  postgres:15-alpine
```

Comprueba que está corriendo:

```powershell
docker ps
docker logs initcore-postgres --tail 20
```

Deberías ver `database system is ready to accept connections`.

### 2.2 Aplicar el esquema

Desde la carpeta del proyecto, ejecuta el script `database_schema.sql`:

```powershell
cd D:\InitCore
docker exec -i initcore-postgres psql -U initcore -d initcore < database_schema.sql
```

Verifica que las tablas existen:

```powershell
docker exec -it initcore-postgres psql -U initcore -d initcore -c "\dt"
```

Deberías ver las tablas `messages`, `errors`, `metrics` y `hashes`.

---

## 3. Levantar n8n

### 3.1 Crear archivo `.env` para n8n

En `D:\InitCore\` crea un archivo llamado `.env.n8n` con:

```ini
# ─── PostgreSQL ──────────────────────────────
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=initcore-postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=initcore
DB_POSTGRESDB_USER=initcore
DB_POSTGRESDB_PASSWORD=CambiaEstaClave123!

# ─── n8n ─────────────────────────────────────
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=CambiaEstaClaveN8n!
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_URL=https://TU-SUBDOMINIO.ngrok.io/
GENERIC_TIMEZONE=Europe/Madrid
TZ=Europe/Madrid
NODE_FUNCTION_ALLOW_BUILTIN=crypto,url,querystring
NODE_FUNCTION_ALLOW_EXTERNAL=*

# ─── InitCore (consumidas desde los workflows) ────
TWILIO_AUTH_TOKEN=<tu_auth_token_twilio>
TWILIO_WEBHOOK_URL=https://TU-SUBDOMINIO.ngrok.io/webhook/initcore/whatsapp
TELEGRAM_BOT_TOKEN=<tu_token_telegram>
TELEGRAM_WEBHOOK_SECRET=UnSecretoLargoYAleatorio
CORE_NORMALIZATION_WORKFLOW_ID=<se_rellena_tras_importar_core>
```

> **Importante**: sustituye todas las claves por valores propios. `TELEGRAM_WEBHOOK_SECRET` puede ser cualquier string aleatorio (mínimo 32 caracteres recomendado).

### 3.2 Lanzar el contenedor de n8n

```powershell
docker run -d `
  --name initcore-n8n `
  --link initcore-postgres:initcore-postgres `
  --env-file D:\InitCore\.env.n8n `
  -p 5678:5678 `
  -v D:\InitCore\data\n8n:/home/node/.n8n `
  n8nio/n8n:latest
```

Abre el navegador en http://localhost:5678 y entra con las credenciales `admin` / la que hayas puesto.

---

## 4. Exponer n8n con ngrok (para desarrollo)

Twilio y Telegram necesitan una URL pública HTTPS para enviar webhooks.

```powershell
ngrok http 5678
```

Copia la URL tipo `https://abcd-1234.ngrok-free.app` y actualiza `WEBHOOK_URL` y `TWILIO_WEBHOOK_URL` en `.env.n8n`, luego reinicia n8n:

```powershell
docker restart initcore-n8n
```

---

## 5. Importar los workflows

En la interfaz de n8n:

1. Haz clic en **Workflows** → botón **Import from File** (icono de tres puntos).
2. Importa en este orden:
   - `core_normalization.json`
   - `01_whatsapp_adapter.json`
   - `02_telegram_adapter.json`
3. Tras importar `core_normalization`, ve al workflow, copia el **ID** que aparece en la URL (`/workflow/<ID>`) y pégalo en el `.env.n8n` como `CORE_NORMALIZATION_WORKFLOW_ID`. Reinicia n8n.

---

## 6. Configurar credenciales en n8n

Ve a **Credentials** → **New**:

### 6.1 PostgreSQL

- **Tipo**: Postgres
- **Name**: `InitCore PostgreSQL`
- **Host**: `initcore-postgres`
- **Port**: `5432`
- **Database**: `initcore`
- **User**: `initcore`
- **Password**: la que pusiste en el paso 2.1

Haz clic en **Test** — debe marcar OK verde.

> El adapter WhatsApp y Telegram referencian esta credencial por nombre (`InitCore PostgreSQL`). Si la renombras, ajusta los nodos `Log error → PostgreSQL`.

### 6.2 (Opcional) Twilio

Si luego quieres responder mensajes desde n8n, crea una credencial **Twilio** con tu Account SID y Auth Token. Para esta versión de ingesta no es necesaria.

---

## 7. Conectar Twilio WhatsApp

1. Entra en la consola de Twilio → **Messaging** → **Try it out** → **Send a WhatsApp message**.
2. Activa el **Sandbox** (sigue las instrucciones para unir tu número enviando el código de activación).
3. En **Sandbox settings**, pega en "When a message comes in":
   ```
   https://TU-SUBDOMINIO.ngrok.io/webhook/initcore/whatsapp
   ```
   Método: **HTTP POST**.
4. Guarda.

Activa el workflow `01 - WhatsApp Adapter (Twilio)` en n8n (toggle arriba a la derecha).

---

## 8. Conectar Telegram

Usa `curl` (incluido en Windows 10/11) o PowerShell:

```powershell
$bot = "<tu_token_telegram>"
$url = "https://TU-SUBDOMINIO.ngrok.io/webhook/initcore/telegram"
$secret = "UnSecretoLargoYAleatorio"

curl "https://api.telegram.org/bot$bot/setWebhook?url=$url&secret_token=$secret"
```

Respuesta esperada: `{"ok":true,"result":true,"description":"Webhook was set"}`.

Activa el workflow `02 - Telegram Adapter (Bot API)`.

---

## 9. Primer test end-to-end

### 9.1 WhatsApp

Desde tu móvil, envía un mensaje al número del Sandbox de Twilio.

En n8n abre el workflow `01 - WhatsApp Adapter (Twilio)` → pestaña **Executions** — debe aparecer una ejecución verde.

Verifica en PostgreSQL:

```powershell
docker exec -it initcore-postgres psql -U initcore -d initcore -c "SELECT message_id, channel, created_at FROM messages ORDER BY created_at DESC LIMIT 5;"
```

### 9.2 Telegram

Manda un mensaje a tu bot. Comprueba igual en el workflow de Telegram y en la tabla `messages`.

### 9.3 Con payloads de prueba (sin canales reales)

Si quieres probar sin conectar Twilio/Telegram, usa los payloads en `tests/test_payloads.json`:

```powershell
curl -X POST https://TU-SUBDOMINIO.ngrok.io/webhook/initcore/telegram `
  -H "Content-Type: application/json" `
  -H "X-Telegram-Bot-Api-Secret-Token: UnSecretoLargoYAleatorio" `
  -d "@tests/test_payloads.json"
```

---

## 10. Checklist de verificación

- [ ] `docker ps` muestra `initcore-postgres` e `initcore-n8n` ambos `Up`.
- [ ] `\dt` en psql muestra las 4 tablas.
- [ ] n8n abre en http://localhost:5678 con login.
- [ ] Los 3 workflows están importados y **activos**.
- [ ] La credencial `InitCore PostgreSQL` pasa el test.
- [ ] ngrok está corriendo y la URL coincide con la del `.env.n8n`.
- [ ] Twilio Sandbox tiene configurado el webhook.
- [ ] Telegram `getWebhookInfo` devuelve la URL correcta.
- [ ] Un mensaje real de WhatsApp aparece en `messages`.
- [ ] Un mensaje real de Telegram aparece en `messages`.

---

## 11. Solución de problemas frecuentes

**403 en el webhook de WhatsApp**
Causa habitual: `TWILIO_WEBHOOK_URL` en `.env.n8n` no coincide exactamente con la URL pública (incluido el path). La firma HMAC depende de esa URL. Corrige y reinicia n8n.

**403 en el webhook de Telegram**
El header `X-Telegram-Bot-Api-Secret-Token` no coincide con `TELEGRAM_WEBHOOK_SECRET`. Vuelve a llamar a `setWebhook` con el mismo secreto.

**`ECONNREFUSED initcore-postgres:5432`**
El contenedor de n8n no ve al de Postgres. Verifica que lanzaste n8n con `--link initcore-postgres:initcore-postgres`, o mejor, usa una red Docker dedicada:

```powershell
docker network create initcore-net
docker network connect initcore-net initcore-postgres
docker network connect initcore-net initcore-n8n
```

**El workflow core_normalization no se ejecuta**
El `CORE_NORMALIZATION_WORKFLOW_ID` está vacío o es incorrecto. Copia el ID de la URL del workflow en n8n y reinicia.

**ngrok se desconecta**
La cuenta gratuita cambia la URL cada vez. Para producción usa un dominio reservado o despliega n8n tras un dominio propio con HTTPS (Caddy / Traefik / Cloudflare Tunnel).

---

## 12. Siguientes pasos

Con la instalación base terminada, InitCore está al **40 %**. Los próximos hitos son los adapters de Gmail (IMAP push o Gmail API watch), webform (webhook genérico con CORS y captcha) y API (HTTP endpoint con autenticación Bearer), además del handler de salida hacia LLM.
