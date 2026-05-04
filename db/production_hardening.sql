-- Script de Hardening para Producción - Arvia
-- Ejecutar en PostgreSQL

-- 1. Asegurar columna de imágenes
ALTER TABLE properties ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- 2. Asegurar columna de análisis de inversión persistente (para evitar re-procesos costosos)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS investment JSONB DEFAULT '{}';

-- 3. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_properties_comuna ON properties(comuna);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);

-- 4. Índice GIN para búsqueda rápida en el JSON de inversión
CREATE INDEX IF NOT EXISTS idx_properties_investment ON properties USING GIN (investment);

-- 5. Tabla de Leads (Contactos de clientes interesados)
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    message TEXT,
    status TEXT DEFAULT 'new', -- new, contacted, closed
    created_at TIMESTAMP DEFAULT NOW()
);
