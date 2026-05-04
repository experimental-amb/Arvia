-- Tabla para gestionar la facturación del corredor en Arvia
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    user_id TEXT, -- ID del corredor en Firebase
    invoice_number TEXT UNIQUE,
    invoice_date DATE,
    issuer_name TEXT, -- Quién emite (ej: Google, Adobe, Cliente)
    receiver_name TEXT, -- El corredor
    concept TEXT,
    base_imponible NUMERIC(15,2),
    iva_cantidad NUMERIC(15,2),
    total NUMERIC(15,2),
    currency TEXT DEFAULT 'CLP',
    type TEXT CHECK (type IN ('ingreso', 'gasto')),
    file_path TEXT, -- Ruta local del PDF
    status TEXT DEFAULT 'processed',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);
