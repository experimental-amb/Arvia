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
