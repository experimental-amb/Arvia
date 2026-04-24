import os
import shutil

# 1. Remove init.sql directory if it exists
init_path = 'init.sql'
if os.path.exists(init_path):
    if os.path.isdir(init_path):
        shutil.rmtree(init_path)
    else:
        os.remove(init_path)

# 2. Create init.sql file
schema = """
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
"""

with open('init.sql', 'w', encoding='utf-8') as f:
    f.write(schema)

# 3. Update docker-compose.yml
with open('docker-compose.yml', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
in_postgres_volumes = False
volume_found = False

for line in lines:
    new_lines.append(line)
    if 'postgres:' in line:
        in_postgres_volumes = True
    if in_postgres_volumes and 'volumes:' in line:
        # Check if we already have the init.sql volume
        pass
    if in_postgres_volumes and '- ./init.sql:/docker-entrypoint-initdb.d/init.sql' in line:
        volume_found = True

if not volume_found:
    # Find where to insert the volume. 
    # Usually under the postgres service volumes.
    final_lines = []
    inserted = False
    for i, line in enumerate(new_lines):
        final_lines.append(line)
        if 'postgres_data:/var/lib/postgresql/data' in line and not inserted:
            final_lines.append('      - ./init.sql:/docker-entrypoint-initdb.d/init.sql\n')
            inserted = True
    new_lines = final_lines

with open('docker-compose.yml', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
