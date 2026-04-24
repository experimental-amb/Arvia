# Arquitectura de InitCore v1.0

Este documento describe las decisiones de diseño, los flujos de datos y los contratos entre componentes. Es la referencia técnica para añadir nuevos canales o modificar comportamiento del core sin romper nada.

## Principios de diseño

Separación estricta de responsabilidades: cada adapter conoce sólo su protocolo y su autenticación. El core no sabe nada de Twilio ni de Telegram. La persistencia vive únicamente en el core. Esto permite añadir canales nuevos sin tocar código existente.

Formato unificado como contrato. Todos los adapters producen la misma estructura. El resto del sistema (LLM handler, dashboards, alertas) trabaja contra ese formato. Cambiar el formato es un cambio de versión mayor.

Idempotencia mediante hash de contenido. Un mismo mensaje recibido dos veces en 24 h se ignora. Esto protege contra reintentos de Twilio/Telegram (ambos reenvían si no reciben 200 OK rápido) y contra bucles de spam.

Fallar rápido y registrar. Los adapters devuelven 200 al proveedor cuanto antes para evitar reintentos externos; los fallos aguas adentro se apuntan en la tabla `errors` y se reprocesan por un job interno.

## Vista general

```
┌─────────────────────────────────────────────────────────────────┐
│                        PROVEEDORES                               │
│  ┌────────┐  ┌────────┐  ┌───────┐  ┌────────┐  ┌──────────┐     │
│  │ Twilio │  │Telegram│  │ Gmail │  │ Web    │  │ 3rd party│     │
│  │ WA     │  │ Bot API│  │ Push  │  │ form   │  │ API      │     │
│  └────┬───┘  └────┬───┘  └───┬───┘  └────┬───┘  └────┬─────┘     │
└───────┼──────────┼─────────┼──────────┼───────────┼─────────────┘
        │ HTTPS    │ HTTPS   │ HTTPS    │ HTTPS     │ HTTPS
        │ POST     │ POST    │ POST     │ POST      │ POST
        ▼          ▼         ▼          ▼           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    n8n — ADAPTERS (capa 1)                       │
│  Webhook nodes → validación de firma/token → extracción de       │
│  campos propios de cada proveedor → payload parcial en formato   │
│  InitCore → Execute Workflow hacia el core (retry 3x backoff).   │
│                                                                  │
│  Cada adapter responde 200/403/500 al proveedor INMEDIATAMENTE,  │
│  antes de que el core termine, para no disparar reintentos.      │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Execute Workflow
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           n8n — CORE NORMALIZATION (capa 2)                      │
│                                                                  │
│  1. UUID v4 → message_id                                         │
│  2. sha256(channel:identificador) → user_id                      │
│  3. HTML sanitize + truncar a 5000 chars                         │
│  4. Detección de idioma (si no viene)                            │
│  5. sha256(channel:user_id:text) → content_hash                  │
│  6. SELECT en tabla hashes con ventana de 24h                    │
│     - Si existe → status "duplicate_24h_skipped", no inserta     │
│     - Si no → INSERT en messages + INSERT en hashes              │
│  7. Retorna {message_id, user_id, channel, status}               │
└─────────────────────────────┬───────────────────────────────────┘
                              │ INSERT
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL                                  │
│  ┌──────────┐  ┌────────┐  ┌────────┐  ┌─────────┐               │
│  │ messages │  │ hashes │  │ errors │  │ metrics │               │
│  └──────────┘  └────────┘  └────────┘  └─────────┘               │
│         └──── v_channel_24h ──── fn_purge_old_hashes()           │
└─────────────────────────────┬───────────────────────────────────┘
                              │ (futuro)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  LLM HANDLER (roadmap)                           │
│  Polling de messages con status='pending' → llamada al modelo →  │
│  actualiza status='processed' + guarda respuesta en otra tabla.  │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo detallado: WhatsApp entrante

```
Usuario móvil ─ mensaje ─▶ Twilio
                              │
                              ▼
           POST /webhook/initcore/whatsapp
           Headers: X-Twilio-Signature: abc...
           Body: From=whatsapp:+34666..., Body=..., NumMedia=0
                              │
                              ▼
                    [Webhook node]
                              │
                              ▼
          [Function — validar firma HMAC-SHA1]
                   ╲                     ╱
              firma ok                firma ko
                   ▼                     ▼
      [Function — extraer]          [respond 403]
                   │
                   ▼
       {channel: whatsapp, message:{text, media},
        context:{phone, name}, metadata:{sid,...},
        _user_identifier: "+34666..."}
                   │
                   ▼
       [Execute Workflow — core, retry 3x]
                   │
              ┌────┴────┐
           ok │         │ error tras 3 intentos
              ▼         ▼
       [respond 200]  [Function — formatear error]
                              │
                              ▼
                    [Postgres — INSERT errors]
                              │
                              ▼
                        [respond 500]
```

## Flujo detallado: core_normalization

```
entrada desde adapter
         │
         ▼
[Function — normalize]
  genera message_id UUID v4
  genera user_id sha256(channel + _user_identifier)
  strip HTML del text
  trunca a 5000 chars
  detecta idioma (heurística es/en) si no viene
  calcula content_hash sha256(channel + user_id + text)
         │
         ▼
[Postgres — SELECT 1 FROM hashes
           WHERE content_hash=$1
           AND created_at > NOW() - INTERVAL '24 hours']
         │
         ▼
[Function — merge result]
  añade _is_duplicate al payload
         │
         ▼
    [IF duplicado?]
     ╱           ╲
   sí             no
    ▼             ▼
 respuesta      [Postgres — INSERT messages]
 duplicate          │
                    ▼
              [Postgres — INSERT hashes]
                    │
                    ▼
                 respuesta OK
                 {message_id, user_id, channel, status:persisted}
```

## Contrato entre adapter y core

Entrada esperada por el core (campos que el adapter DEBE rellenar):

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `channel` | string | sí | uno de: whatsapp, telegram, gmail, webform, api |
| `message.text` | string | sí | puede ser "" si hay media |
| `message.media` | array | sí | array vacío si no hay media |
| `timestamp` | ISO 8601 | sí | hora de recepción del mensaje original |
| `context.name` | string | no | cadena vacía si no se conoce |
| `context.email` | string | no | idem |
| `context.phone` | string | no | idem |
| `context.language` | string | no | si está vacío, el core lo detecta |
| `metadata.source` | string | sí | nombre del adapter, ej. "whatsapp_adapter" |
| `metadata.adapter_version` | string | sí | semver |
| `metadata.*` | libre | no | campos extra específicos del canal |
| `status` | string | no | por defecto "pending" |
| `_user_identifier` | string | sí | identificador estable del usuario en el canal; se hashea para generar user_id |

Salida del core al adapter:

```json
{
  "message_id": "uuid-v4",
  "user_id": "sha256...",
  "channel": "whatsapp",
  "status": "persisted | duplicate_24h_skipped"
}
```

## Decisiones de diseño explicadas

**¿Por qué UUID v4 y no un ID secuencial?** UUID permite que varios nodos de ingesta distribuidos generen IDs sin coordinación. Evita contención en secuencias en escenarios de picos.

**¿Por qué user_id es un hash y no el teléfono/email en claro?** Minimiza el riesgo de leak de PII. Si la tabla messages acaba expuesta (logs, backups), el identificador queda pseudonimizado. El adapter sigue guardando el teléfono/email en `context` para funcionalidad, pero el user_id de agrupación es anónimo.

**¿Por qué sha256 y no un HMAC con clave?** sha256 simple basta porque sólo se usa para agrupar mensajes del mismo usuario a nivel interno, no como token de autenticación. Añadir HMAC complicaría la rotación de claves sin beneficio práctico.

**¿Por qué dedupe en 24h y no siempre?** Reintentos legítimos de los proveedores ocurren en minutos. A 24h ya no son reintentos sino mensajes nuevos aunque el contenido coincida (el usuario re-preguntó lo mismo al día siguiente, es un caso distinto). La ventana se puede ajustar en `env.json`.

**¿Por qué PostgreSQL y no MongoDB?** Las consultas de operación (filtrar por canal, contar por status, rangos temporales) son naturalmente relacionales. JSONB da flexibilidad en `context`/`metadata`/`media` sin renunciar al SQL. Y un solo motor simplifica operaciones.

**¿Por qué Execute Workflow entre adapter y core en lugar de código compartido?** En n8n, Execute Workflow permite versionar y monitorizar cada pieza por separado. Si el core falla o se reinicia, los adapters siguen aceptando webhooks; los mensajes fallidos van a la tabla errors y se reintentan. Código compartido (Code node externo) rompería el modelo de observabilidad de n8n.

**¿Por qué los adapters responden 200 antes de que termine el core?** Twilio y Telegram consideran fallo cualquier respuesta no recibida en ~15s y reintentan. Procesar siempre dentro de ese presupuesto es frágil; con Execute Workflow síncrono el tiempo típico es <500ms y el workflow puede configurarse con `waitForExecution: false` para desacoplar aún más si hace falta.

## Rendimiento y límites

- Latencia típica adapter→core→DB: 100–500 ms por mensaje.
- Con PostgreSQL local: sostiene fácilmente 100 msg/s en hardware medio.
- Cuello de botella previsible: detección de idioma si se cambia a un modelo ML — la heurística actual es O(1).
- Índices GIN sobre `metadata` y `context` permiten búsquedas rápidas aunque el volumen crezca.

## Seguridad

- Firma Twilio (HMAC-SHA1 de URL+params ordenados).
- Secret token Telegram (header fijo generado al llamar a setWebhook).
- Webhook allowlist por IP opcional (rangos conocidos de Twilio y Telegram).
- PII pseudonimizada en `user_id`.
- Datos en tránsito: HTTPS obligatorio (ngrok en desarrollo, Caddy/Cloudflare en producción).
- Rotación de credenciales documentada en `INSTALACION.md` sección 11.

## Evolución a v1.1 (siguientes hitos)

- 03_gmail_adapter.json (Pub/Sub push con decodificación base64 de messageId y `messages.get`).
- 04_webform_adapter.json (webhook + CORS + reCAPTCHA).
- 05_api_adapter.json (Bearer token por cliente, rate limiting por token).
- 90_llm_handler.json (polling de `pending`, llamada a LLM, escritura en `responses`).
- 99_metrics_aggregator.json (cron cada minuto → tabla metrics).
