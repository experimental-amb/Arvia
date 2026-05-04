# Migrations — Arvia / InitCore

Migraciones SQL versionadas. Aplicar en orden estricto.

## Aplicar en produccion

```bash
# Una por una (recomendado primera vez)
psql $DATABASE_URL -f migrations/001_initial_schema.sql
psql $DATABASE_URL -f migrations/002_patch_v1.1.sql
psql $DATABASE_URL -f migrations/003_properties_leads.sql
psql $DATABASE_URL -f migrations/004_performance_indexes.sql

# O todas de una vez
for f in migrations/*.sql; do psql $DATABASE_URL -f $f; done
```

## Aplicar en local (Docker)

```bash
docker exec -i initcore_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < migrations/003_properties_leads.sql
```

## Convenciones

- Cada migration es **idempotente** (usa IF NOT EXISTS, IF EXISTS)
- Numerar con 3 digitos: 001, 002, 003...
- Nunca modificar migrations ya aplicadas — crear una nueva
- Al final de cada archivo: `DO $$ BEGIN RAISE NOTICE 'Migration XXX applied'; END $$;`
