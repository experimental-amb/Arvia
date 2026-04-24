
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  text TEXT,
  response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  region TEXT,
  comuna TEXT NOT NULL,
  address TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  sqm NUMERIC,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  nombre TEXT,
  telefono TEXT,
  interes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_state (
  user_id TEXT PRIMARY KEY,
  step TEXT NOT NULL,
  comuna TEXT,
  dormitorios TEXT,
  banos TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for properties
INSERT INTO properties (title, price, region, comuna, bedrooms, bathrooms, sqm) VALUES
('Depto Vista Mar', 120000000, 'Valparaíso', 'Viña del Mar', 2, 2, 75),
('Casa Jardines', 250000000, 'Metropolitana', 'Providencia', 4, 3, 150),
('Estudio Centro', 65000000, 'Metropolitana', 'Santiago', 1, 1, 35)
ON CONFLICT DO NOTHING;
