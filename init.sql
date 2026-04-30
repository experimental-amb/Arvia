-- ============================================================
-- Arvia / InitCore — Esquema unificado de producción
-- Combina: database_schema.sql (mensajería multicanal) +
--          esquema inmobiliario (properties, leads, user_state)
-- Requiere PostgreSQL 13+
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- MÓDULO 1: MENSAJERÍA MULTICANAL (InitCore Core)
-- ============================================================

-- Almacén principal de mensajes normalizados
CREATE TABLE IF NOT EXISTS messages (
    message_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         VARCHAR(64) NOT NULL,
    channel         VARCHAR(32) NOT NULL CHECK (channel IN ('whatsapp','telegram','gmail','webform','api')),
    text            TEXT NOT NULL DEFAULT '',
    media           JSONB NOT NULL DEFAULT '[]'::jsonb,
    ts              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    context         JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    status          VARCHAR(32) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','processed','failed',
                                      'duplicate_24h_skipped','skipped_by_intent','dlq')),
    intent          VARCHAR(32),
    priority        SMALLINT NOT NULL DEFAULT 5,
    skip_reason     VARCHAR(64),
    retry_count     SMALLINT NOT NULL DEFAULT 0,
    next_retry_at   TIMESTAMPTZ,
    content_hash    VARCHAR(64) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_user_id      ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel      ON messages(channel);
CREATE INDEX IF NOT EXISTS idx_messages_status       ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at   ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_ts           ON messages(ts DESC);
CREATE INDEX IF NOT EXISTS idx_messages_intent       ON messages(intent);
CREATE INDEX IF NOT EXISTS idx_messages_next_retry   ON messages(next_retry_at)
    WHERE status = 'failed' AND next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_status_pend  ON messages(created_at)
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_messages_metadata_gin ON messages USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_messages_context_gin  ON messages USING GIN (context);

-- Deduplicación: ventana 24h + unicidad real
CREATE TABLE IF NOT EXISTS hashes (
    content_hash    VARCHAR(64) NOT NULL UNIQUE,
    message_id      UUID NOT NULL REFERENCES messages(message_id) ON DELETE CASCADE,
    channel         VARCHAR(32) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (content_hash)
);

CREATE INDEX IF NOT EXISTS idx_hashes_created_at ON hashes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hashes_channel    ON hashes(channel);

-- Registro de errores de adaptadores y core
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

-- Respuestas del LLM handler
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

-- Métricas operativas
CREATE TABLE IF NOT EXISTS metrics (
    id              BIGSERIAL PRIMARY KEY,
    channel         VARCHAR(32),
    metric_name     VARCHAR(64) NOT NULL,
    metric_value    NUMERIC NOT NULL,
    dimensions      JSONB NOT NULL DEFAULT '{}'::jsonb,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_name_time ON metrics(metric_name, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_channel   ON metrics(channel);

-- Trigger updated_at en messages
CREATE OR REPLACE FUNCTION fn_messages_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_messages_set_updated_at ON messages;
CREATE TRIGGER tr_messages_set_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION fn_messages_set_updated_at();

-- Vista de salud del pipeline
CREATE OR REPLACE VIEW v_pipeline_health AS
SELECT
    NOW() AS as_of,
    (SELECT COUNT(*) FROM messages WHERE status='pending')             AS backlog_pending,
    (SELECT COUNT(*) FROM messages WHERE status='processing'
       AND updated_at < NOW() - INTERVAL '5 minutes')                  AS stuck_processing,
    (SELECT COUNT(*) FROM messages WHERE status='failed'
       AND next_retry_at <= NOW())                                      AS ready_to_retry,
    (SELECT COUNT(*) FROM messages WHERE status='dlq')                  AS dead_letter,
    (SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '1 hour') AS ingested_1h;

-- Vista resumen por canal últimas 24h
CREATE OR REPLACE VIEW v_channel_24h AS
SELECT
    channel,
    COUNT(*)                                                AS total,
    COUNT(*) FILTER (WHERE status='processed')              AS processed,
    COUNT(*) FILTER (WHERE status='failed')                 AS failed,
    COUNT(*) FILTER (WHERE status='pending')                AS pending,
    COUNT(*) FILTER (WHERE status='duplicate_24h_skipped')  AS duplicates,
    MIN(created_at)                                         AS first_seen,
    MAX(created_at)                                         AS last_seen
FROM messages
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY channel;

-- Función: purgar hashes > 48h
CREATE OR REPLACE FUNCTION fn_purge_old_hashes()
RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER;
BEGIN
    DELETE FROM hashes WHERE created_at < NOW() - INTERVAL '48 hours';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función: liberar procesos atascados
CREATE OR REPLACE FUNCTION fn_unstick_processing(p_minutes INT DEFAULT 5)
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
    UPDATE messages
    SET status='failed',
        retry_count = retry_count + 1,
        next_retry_at = NOW() + (INTERVAL '1 minute' * POWER(2, retry_count)),
        updated_at = NOW()
    WHERE status='processing' AND updated_at < NOW() - (INTERVAL '1 minute' * p_minutes);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Función: mover a DLQ tras max reintentos
CREATE OR REPLACE FUNCTION fn_move_to_dlq(p_max_retries INT DEFAULT 5)
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
    UPDATE messages SET status='dlq', updated_at=NOW()
    WHERE status='failed' AND retry_count >= p_max_retries;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- MÓDULO 2: PLATAFORMA INMOBILIARIA (Arvia)
-- ============================================================

CREATE TABLE IF NOT EXISTS properties (
    id               BIGSERIAL PRIMARY KEY,
    user_id          TEXT,
    title            TEXT NOT NULL CHECK (length(title) BETWEEN 3 AND 255),
    description      TEXT NOT NULL DEFAULT '',
    price            NUMERIC NOT NULL CHECK (price > 0),
    region           TEXT NOT NULL DEFAULT '',
    comuna           TEXT NOT NULL,
    address          TEXT NOT NULL DEFAULT '',
    bedrooms         SMALLINT NOT NULL DEFAULT 0 CHECK (bedrooms >= 0),
    bathrooms        SMALLINT NOT NULL DEFAULT 0 CHECK (bathrooms >= 0),
    sqm              NUMERIC NOT NULL DEFAULT 0 CHECK (sqm >= 0),
    images           JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Campos de origen e ingesta
    source           TEXT NOT NULL DEFAULT 'manual'
                     CHECK (source IN ('manual','bulk_import','scraper','api','web_dashboard')),
    source_url       TEXT UNIQUE,           -- clave de dedup para listados scrapeados/importados
    external_id      TEXT,                  -- ID del proveedor externo (ej. MercadoLibre)
    -- Clasificación
    property_type    TEXT NOT NULL DEFAULT 'otro'
                     CHECK (property_type IN ('departamento','casa','terreno','comercial','otro')),
    transaction_type TEXT NOT NULL DEFAULT 'venta'
                     CHECK (transaction_type IN ('venta','arriendo')),
    -- Estado del listado
    status           TEXT NOT NULL DEFAULT 'published'
                     CHECK (status IN ('draft','published','archived')),
    -- Auditoría
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de rendimiento para búsquedas inmobiliarias
CREATE INDEX IF NOT EXISTS idx_properties_comuna    ON properties(comuna);
CREATE INDEX IF NOT EXISTS idx_properties_price     ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms  ON properties(bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_bathrooms ON properties(bathrooms);
CREATE INDEX IF NOT EXISTS idx_properties_source    ON properties(source);
CREATE INDEX IF NOT EXISTS idx_properties_status    ON properties(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_properties_type      ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_txtype    ON properties(transaction_type);
CREATE INDEX IF NOT EXISTS idx_properties_created   ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_user      ON properties(user_id) WHERE user_id IS NOT NULL;

-- Índice de búsqueda de texto completo en español
CREATE INDEX IF NOT EXISTS idx_properties_fts ON properties USING GIN (
    to_tsvector('spanish', title || ' ' || COALESCE(description,'') || ' ' || comuna)
);

-- Trigger updated_at en properties
CREATE OR REPLACE FUNCTION fn_properties_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_properties_set_updated_at ON properties;
CREATE TRIGGER tr_properties_set_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION fn_properties_set_updated_at();

-- Leads capturados por el bot
CREATE TABLE IF NOT EXISTS leads (
    id          BIGSERIAL PRIMARY KEY,
    user_id     TEXT,
    channel     TEXT NOT NULL DEFAULT 'telegram',
    nombre      TEXT,
    telefono    TEXT,
    email       TEXT,
    interes     TEXT,
    comuna_buscada TEXT,
    dormitorios INTEGER,
    presupuesto NUMERIC,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_channel    ON leads(channel);

-- Estado del Wizard de Telegram (máquina de estados)
CREATE TABLE IF NOT EXISTS user_state (
    user_id     TEXT PRIMARY KEY,
    channel     TEXT NOT NULL DEFAULT 'telegram',
    step        TEXT NOT NULL,
    comuna      TEXT,
    dormitorios TEXT,
    banos       TEXT,
    presupuesto TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jobs de ingesta masiva (para seguimiento de importaciones)
CREATE TABLE IF NOT EXISTS import_jobs (
    id               BIGSERIAL PRIMARY KEY,
    source           TEXT NOT NULL,          -- 'bulk_import', 'scraper', 'api'
    filename         TEXT,
    total_rows       INTEGER NOT NULL DEFAULT 0,
    processed_rows   INTEGER NOT NULL DEFAULT 0,
    failed_rows      INTEGER NOT NULL DEFAULT 0,
    status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','processing','done','failed')),
    error_log        JSONB NOT NULL DEFAULT '[]'::jsonb,
    started_at       TIMESTAMPTZ,
    completed_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_status  ON import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created ON import_jobs(created_at DESC);


-- ============================================================
-- DATOS SEMILLA (solo para desarrollo / demo)
-- ============================================================
INSERT INTO properties (title, description, price, region, comuna, bedrooms, bathrooms, sqm, source, property_type, transaction_type)
VALUES
  ('Depto Vista Mar', 'Hermoso departamento con vista al mar en Viña del Mar.', 120000000, 'Valparaíso', 'Viña del Mar', 2, 2, 75, 'manual', 'departamento', 'venta'),
  ('Casa Jardines', 'Amplia casa con jardín en exclusivo sector de Providencia.', 250000000, 'Metropolitana', 'Providencia', 4, 3, 150, 'manual', 'casa', 'venta'),
  ('Estudio Centro', 'Estudio moderno en el corazón de Santiago, ideal para inversión.', 65000000, 'Metropolitana', 'Santiago', 1, 1, 35, 'manual', 'departamento', 'venta')
ON CONFLICT DO NOTHING;

DO $$ BEGIN
    RAISE NOTICE '✅ Arvia + InitCore — Esquema unificado de producción aplicado correctamente.';
    RAISE NOTICE 'Módulo Mensajería: messages, hashes, errors, responses, metrics';
    RAISE NOTICE 'Módulo Inmobiliario: properties, leads, user_state, import_jobs';
    RAISE NOTICE 'Vistas: v_pipeline_health, v_channel_24h';
END $$;
