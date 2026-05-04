# Guia de Deploy en Produccion — Arvia

## Prerequisitos

1. VPS con Docker y Docker Compose instalados (Ubuntu 22.04 recomendado)
2. Dominio apuntando al VPS (para HTTPS sin ngrok)
3. Certificado SSL (Caddy lo gestiona automaticamente)

## Paso 1 — Clonar y configurar

```bash
git clone https://github.com/tu-usuario/initcore.git
cd initcore
cp .env.example .env
nano .env  # Completar TODOS los valores
```

Valores criticos a cambiar en .env:
- POSTGRES_PASSWORD (minimo 20 caracteres, random)
- N8N_ENCRYPTION_KEY (32 chars hex: openssl rand -hex 16)
- N8N_BASIC_AUTH_PASSWORD (minimo 16 caracteres)
- WEB_API_KEY (debe coincidir con N8N_API_KEY en Vercel)
- WEBHOOK_URL=https://n8n.tudominio.com/
- CORS_ALLOWED_ORIGINS=https://arvia-nu.vercel.app

## Paso 2 — Iniciar servicios

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f  # Verificar inicio
```

## Paso 3 — Aplicar migraciones (primera vez)

```bash
# Las migraciones se aplican automaticamente via docker-entrypoint-initdb.d
# Para aplicar manualmente en DB existente:
docker exec -i arvia_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < migrations/001_initial_schema.sql
docker exec -i arvia_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < migrations/002_patch_v1.1.sql
docker exec -i arvia_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < migrations/003_properties_leads.sql
docker exec -i arvia_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < migrations/004_performance_indexes.sql
```

## Paso 4 — Importar workflows en n8n

1. Abrir https://n8n.tudominio.com (o IP:5678)
2. Login con N8N_BASIC_AUTH_USER y PASSWORD
3. Ir a Workflows > Import
4. Importar: workflows/arvia/workflow_properties.json
5. Importar: workflows/arvia/workflow_ai_search.json
6. En cada workflow: configurar credencial Postgres
7. Activar ambos workflows

## Paso 5 — Configurar Vercel

En Vercel > Settings > Environment Variables agregar:
- N8N_WEBHOOK_URL = https://n8n.tudominio.com/webhook/arvia-properties
- N8N_API_KEY = (mismo valor que WEB_API_KEY en .env)
- NEXT_PUBLIC_FIREBASE_* = (valores de Firebase Console)

## Monitoreo

```bash
# Ver estado de contenedores
docker compose -f docker-compose.prod.yml ps

# Logs de n8n
docker logs arvia_n8n --tail 100 -f

# Logs de postgres
docker logs arvia_postgres --tail 50

# Health check
curl https://n8n.tudominio.com/healthz
```

## Backup de datos

```bash
# Backup de la base de datos
docker exec arvia_postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d).sql

# Backup del volumen n8n (workflows, credenciales)
docker run --rm -v arvia_n8n_data:/data -v $(pwd):/backup alpine tar czf /backup/n8n_backup_$(date +%Y%m%d).tar.gz /data
```
