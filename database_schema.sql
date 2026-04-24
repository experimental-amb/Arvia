-- ============================================================
-- InitCore v1.0 — Esquema PostgreSQL
-- Base de datos de ingesta multicanal: WhatsApp, Telegram, Gmail,
-- webform y API. El core_normalization inserta en estas tablas.
-- Requiere PostgreSQL 13+.
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Tabla: messages
-- Almacén principal de mensajes normalizados.
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    message_id      UUID PRIMARY KEY,
    user_id         VARCHAR(64) NOT NULL,
    channel         VARCHAR(32) NOT NULL CHECK (channel IN ('whatsapp','telegram','gmail','webform','api')),
    text            TEXT NOT NULL DEFAULT '',
    media           JSONB NOT NULL DEFAULT '[]'::jsonb,
    ts              TIMESTAMPTZ NOT NULL,
    context         JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    status          VARCHAR(32) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','processed','failed','duplicate_24h_skipped')),
    content_hash    VARCHAR(64) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de consulta frecuente
CREATE INDEX IF NOT EXISTS idx_messages_user_id     ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel     ON messages(channel);
CREATE INDEX IF NOT EXISTS idx_messages_status      ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at  ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_ts          ON messages(ts DESC);
CREATE INDEX IF NOT EXISTS idx_messages_metadata_gin ON messages USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_messages_context_gin  ON messages USING GIN (context);

-- ============================================================
-- Tabla: hashes
-- Deduplicación. Se consulta con ventana de 24h antes de insertar.
-- ============================================================
CREATE TABLE IF NOT EXISTS hashes (
    content_hash    VARCHAR(64) NOT NULL,
    message_id      UUID NOT NULL REFERENCES messages(message_id) ON DELETE CASCADE,
    channel         VARCHAR(32) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (content_hash, created_at)
);

CREATE INDEX IF NOT EXISTS idx_hashes_created_at ON hashes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hashes_channel    ON hashes(channel);

-- ============================================================
-- Tabla: errors
-- Registro de fallos de adapters y core (para alertas y análisis).
-- ============================================================
CREATE TABLE IF NOT EXISTS errors (
    id              BIGSERIAL PRIMARY KEY,
    channel         VARCHAR(32),
    error_message   TEXT NOT NULL,
    error_stack     TEXT,
    payload         JSONB,
    retry_count     INTEGER NOT NULL DEFAULT 0,
    resolved        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_errors_channel     ON errors(channel);
CREATE INDEX IF NOT EXISTS idx_errors_resolved    ON errors(resolved) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_errors_created_at  ON errors(created_at DESC);

-- ============================================================
-- Tabla: responses
-- Respuestas generadas por el LLM handler (uno-a-uno con messages).
-- ============================================================
CREATE TABLE IF NOT EXISTS responses (
    id              BIGSERIAL PRIMARY KEY,
    message_id      UUID NOT NULL REFERENCES messages(message_id) ON DELETE CASCADE,
    llm_response    TEXT NOT NULL,
    input_tokens    INTEGER NOT NULL DEFAULT 0,
    output_tokens   INTEGER NOT NULL DEFAULT 0,
    llm_model       VARCHAR(64) NOT NULL,
    stop_reason     VARCHAR(32),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_message_id ON responses(message_id);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at DESC);

-- ============================================================
-- Tabla: metrics
-- Métricas operativas (mensajes/minuto, latencia, tasa de error).
-- ============================================================
CREATE TABLE IF NOT EXISTS metrics (
    id              BIGSERIAL PRIMARY KEY,
    channel         VARCHAR(32),
    metric_name     VARCHAR(64) NOT NULL,
    metric_value    NUMERIC NOT NULL,
    dimensions      JSONB NOT NULL DEFAULT '{}'::jsonb,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_name_time   ON metrics(metric_name, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_channel     ON metrics(channel);

-- ============================================================
-- Trigger: mantener updated_at al modificar un mensaje
-- ============================================================
CREATE OR REPLACE FUNCTION fn_messages_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_messages_set_updated_at ON messages;
CREATE TRIGGER tr_messages_set_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION fn_messages_set_updated_at();

-- ============================================================
-- Vista: resumen por canal las últimas 24h
-- ============================================================
CREATE OR REPLACE VIEW v_channel_24h AS
SELECT
    channel,
    COUNT(*)                                              AS total,
    COUNT(*) FILTER (WHERE status = 'processed')          AS processed,
    COUNT(*) FILTER (WHERE status = 'failed')             AS failed,
    COUNT(*) FILTER (WHERE status = 'pending')            AS pending,
    COUNT(*) FILTER (WHERE status = 'duplicate_24h_skipped') AS duplicates,
    MIN(created_at)                                       AS first_seen,
    MAX(created_at)                                       AS last_seen
FROM messages
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY channel;

-- ============================================================
-- Función utilitaria: purgar hashes > 48h (opcional en cron)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_purge_old_hashes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM hashes WHERE created_at < NOW() - INTERVAL '48 hours';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Semilla de verificación: comprobar integridad del esquema
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE 'InitCore v1.0 schema aplicado correctamente.';
    RAISE NOTICE 'Tablas: messages, hashes, errors, metrics';
    RAISE NOTICE 'Vista: v_channel_24h';
    RAISE NOTICE 'Función: fn_purge_old_hashes()';
END $$;
