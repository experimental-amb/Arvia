-- ============================================================
-- Arvia — Full Schema for Supabase
-- Run this in: Supabase → SQL Editor → New query → Run
-- Idempotent: safe to re-run (uses IF NOT EXISTS / OR REPLACE)
-- ============================================================

-- ============================================================
-- Migration 001 — InitCore base schema
-- Tablas: messages, hashes, errors, responses, metrics
-- Run: psql $DATABASE_URL -f migrations/001_initial_schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

CREATE INDEX IF NOT EXISTS idx_messages_user_id      ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel      ON messages(channel);
CREATE INDEX IF NOT EXISTS idx_messages_status       ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at   ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_ts           ON messages(ts DESC);
CREATE INDEX IF NOT EXISTS idx_messages_metadata_gin ON messages USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_messages_context_gin  ON messages USING GIN (context);

CREATE TABLE IF NOT EXISTS hashes (
    content_hash    VARCHAR(64) NOT NULL,
    message_id      UUID NOT NULL REFERENCES messages(message_id) ON DELETE CASCADE,
    channel         VARCHAR(32) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (content_hash, created_at)
);

CREATE INDEX IF NOT EXISTS idx_hashes_created_at ON hashes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hashes_channel    ON hashes(channel);

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

CREATE OR REPLACE FUNCTION fn_messages_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_messages_set_updated_at ON messages;
CREATE TRIGGER tr_messages_set_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION fn_messages_set_updated_at();

CREATE OR REPLACE VIEW v_channel_24h AS
SELECT channel,
    COUNT(*)                                                      AS total,
    COUNT(*) FILTER (WHERE status = 'processed')                  AS processed,
    COUNT(*) FILTER (WHERE status = 'failed')                     AS failed,
    COUNT(*) FILTER (WHERE status = 'pending')                    AS pending,
    COUNT(*) FILTER (WHERE status = 'duplicate_24h_skipped')      AS duplicates,
    MIN(created_at) AS first_seen, MAX(created_at) AS last_seen
FROM messages WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY channel;

CREATE OR REPLACE FUNCTION fn_purge_old_hashes()
RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER;
BEGIN
    DELETE FROM hashes WHERE created_at < NOW() - INTERVAL '48 hours';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN RAISE NOTICE 'Migration 001 applied: base schema'; END $$;


-- ============================================================
-- Migration 002 — Patch v1.1: intent, priority, DLQ, idempotencia
-- ============================================================

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS intent        VARCHAR(32),
  ADD COLUMN IF NOT EXISTS priority      SMALLINT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS skip_reason   VARCHAR(64),
  ADD COLUMN IF NOT EXISTS retry_count   SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_status_check;
ALTER TABLE messages ADD CONSTRAINT messages_status_check
  CHECK (status IN ('pending','processing','processed','failed',
                    'duplicate_24h_skipped','skipped_by_intent','dlq'));

CREATE INDEX IF NOT EXISTS idx_messages_intent         ON messages(intent);
CREATE INDEX IF NOT EXISTS idx_messages_next_retry     ON messages(next_retry_at)
  WHERE status = 'failed' AND next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_status_pending ON messages(created_at)
  WHERE status = 'pending';

ALTER TABLE hashes DROP CONSTRAINT IF EXISTS hashes_content_hash_key;
ALTER TABLE hashes ADD CONSTRAINT hashes_content_hash_key UNIQUE (content_hash);

CREATE OR REPLACE VIEW v_pipeline_health AS
SELECT
  NOW() AS as_of,
  (SELECT COUNT(*) FROM messages WHERE status='pending')                                                 AS backlog_pending,
  (SELECT COUNT(*) FROM messages WHERE status='processing' AND updated_at < NOW() - INTERVAL '5 min')   AS stuck_processing,
  (SELECT COUNT(*) FROM messages WHERE status='failed' AND next_retry_at <= NOW())                       AS ready_to_retry,
  (SELECT COUNT(*) FROM messages WHERE status='dlq')                                                     AS dead_letter,
  (SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '1 hour')                           AS ingested_1h,
  (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))),2)
     FROM messages WHERE status='processed' AND created_at > NOW() - INTERVAL '1 hour')                  AS avg_latency_1h_sec;

CREATE OR REPLACE FUNCTION fn_unstick_processing(p_minutes INT DEFAULT 5)
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE messages SET status='failed',
      retry_count = retry_count + 1,
      next_retry_at = NOW() + (INTERVAL '1 minute' * POWER(2, retry_count)),
      updated_at = NOW()
  WHERE status='processing' AND updated_at < NOW() - (INTERVAL '1 minute' * p_minutes);
  GET DIAGNOSTICS v_count = ROW_COUNT; RETURN v_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_move_to_dlq(p_max_retries INT DEFAULT 5)
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE messages SET status='dlq', updated_at=NOW()
   WHERE status='failed' AND retry_count >= p_max_retries;
  GET DIAGNOSTICS v_count = ROW_COUNT; RETURN v_count;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN RAISE NOTICE 'Migration 002 applied: intent + DLQ + idempotencia'; END $$;


-- ============================================================
-- Migration 003 — Arvia: tabla properties y leads
-- Esta tabla ES el core del producto inmobiliario.
-- ============================================================

CREATE TABLE IF NOT EXISTS properties (
    id          BIGSERIAL PRIMARY KEY,
    user_id     VARCHAR(128),                         -- Firebase UID del agente
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price       NUMERIC(14,2) NOT NULL DEFAULT 0,
    currency    VARCHAR(8)  NOT NULL DEFAULT 'CLP'
                CHECK (currency IN ('CLP','UF','USD')),
    region      TEXT NOT NULL DEFAULT '',
    comuna      TEXT NOT NULL DEFAULT '',
    address     TEXT NOT NULL DEFAULT '',
    bedrooms    INTEGER NOT NULL DEFAULT 0,
    bathrooms   INTEGER NOT NULL DEFAULT 0,
    sqm         NUMERIC(10,2) NOT NULL DEFAULT 0,
    property_type VARCHAR(32) NOT NULL DEFAULT 'departamento'
                CHECK (property_type IN ('departamento','casa','oficina','local','terreno','bodega','otro')),
    operation   VARCHAR(16) NOT NULL DEFAULT 'venta'
                CHECK (operation IN ('venta','arriendo','arriendo_temp')),
    status      VARCHAR(32) NOT NULL DEFAULT 'draft'
                CHECK (status IN ('published','draft','archived','sold','reserved','active')),
    images      JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array de URLs
    tags        JSONB NOT NULL DEFAULT '[]'::jsonb,  -- etiquetas libres
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,  -- datos extra del canal origen
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices de busqueda frecuente
CREATE INDEX IF NOT EXISTS idx_properties_user_id      ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status       ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_comuna       ON properties(comuna);
CREATE INDEX IF NOT EXISTS idx_properties_region       ON properties(region);
CREATE INDEX IF NOT EXISTS idx_properties_price        ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_created_at   ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_operation    ON properties(operation);
CREATE INDEX IF NOT EXISTS idx_properties_type         ON properties(property_type);
-- Busqueda de texto en titulo y descripcion
CREATE INDEX IF NOT EXISTS idx_properties_title_fts    ON properties USING GIN (to_tsvector('spanish', title));
CREATE INDEX IF NOT EXISTS idx_properties_tags_gin     ON properties USING GIN (tags);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION fn_properties_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_properties_updated_at ON properties;
CREATE TRIGGER tr_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION fn_properties_set_updated_at();

-- ============================================================
-- Tabla: leads
-- Contactos de compradores/arrendatarios capturados por el bot
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
    id              BIGSERIAL PRIMARY KEY,
    property_id     BIGINT REFERENCES properties(id) ON DELETE SET NULL,
    user_id         VARCHAR(128),                 -- agente dueno de la propiedad
    channel         VARCHAR(32) NOT NULL DEFAULT 'web'
                    CHECK (channel IN ('whatsapp','instagram','telegram','web','api')),
    contact_name    TEXT,
    contact_phone   VARCHAR(32),
    contact_email   TEXT,
    message         TEXT,
    status          VARCHAR(32) NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','contacted','qualified','discarded')),
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_property_id  ON leads(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id      ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_channel      ON leads(channel);
CREATE INDEX IF NOT EXISTS idx_leads_status       ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at   ON leads(created_at DESC);

CREATE OR REPLACE FUNCTION fn_leads_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_leads_updated_at ON leads;
CREATE TRIGGER tr_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION fn_leads_set_updated_at();

-- ============================================================
-- Vista: stats por usuario (usada por get_stats en n8n)
-- ============================================================
CREATE OR REPLACE VIEW v_user_stats AS
SELECT
    p.user_id,
    COUNT(*)                                              AS total_properties,
    COUNT(*) FILTER (WHERE p.status IN ('published','active')) AS published_properties,
    COUNT(DISTINCT l.id)                                  AS total_leads,
    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'new')  AS pending_messages
FROM properties p
LEFT JOIN leads l ON l.user_id = p.user_id
GROUP BY p.user_id;

DO $$ BEGIN RAISE NOTICE 'Migration 003 applied: properties + leads + v_user_stats'; END $$;


-- ============================================================
-- Migration 004 — Performance: indices compuestos y full-text
-- ============================================================

-- Busqueda compuesta mas comun: region + status + precio
CREATE INDEX IF NOT EXISTS idx_properties_search
  ON properties(status, region, price)
  WHERE status IN ('published', 'active');

-- Busqueda por comuna + operacion (venta vs arriendo)
CREATE INDEX IF NOT EXISTS idx_properties_comuna_op
  ON properties(comuna, operation)
  WHERE status IN ('published', 'active');

-- Full-text search combinado titulo + descripcion
CREATE INDEX IF NOT EXISTS idx_properties_fulltext
  ON properties USING GIN (
    to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(description,''))
  );

-- Leads recientes sin contactar (vista de bandeja)
CREATE INDEX IF NOT EXISTS idx_leads_inbox
  ON leads(user_id, created_at DESC)
  WHERE status = 'new';

DO $$ BEGIN RAISE NOTICE 'Migration 004 applied: performance indexes'; END $$;


