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
