# Arvia — Production Migration Checklist
## Supabase + Railway + Vercel

**Estimated time: ~45 minutes**  
**Result: n8n with stable URL, persistent DB, zero local dependencies**

---

## PHASE 1 — Supabase (10 min)

### 1.1 Create project
1. Go to https://supabase.com → New project
2. Name: `arvia-production`
3. Database password: generate strong (save it — you'll need it for Railway)
4. Region: South America (São Paulo) or US East

### 1.2 Get connection details
1. Supabase Dashboard → Settings → Database
2. Copy **Direct connection** URI (port 5432, NOT 6543 pooler):
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
   ```
3. Note `[PROJECT_REF]` and `[PASSWORD]` for Railway env vars

### 1.3 Apply schema
1. Supabase Dashboard → SQL Editor → New query
2. Paste entire contents of `deploy/supabase/schema.sql`
3. Click **Run**
4. Verify no errors — all 4 migrations applied

---

## PHASE 2 — Railway (15 min)

### 2.1 Create project
1. Go to https://railway.app → New Project
2. Choose: **Deploy from GitHub repo** → select `Arvia` repo
3. Service name: `arvia-n8n`
4. Railway auto-detects `deploy/railway/Dockerfile`

### 2.2 Set environment variables
1. Railway → arvia-n8n → **Variables** tab
2. Click "RAW Editor" and paste the entire content of `deploy/RAILWAY_ENV_VARS.env`
3. Fill in the `[FILL_THIS]` placeholders:
   - `DB_POSTGRESDB_HOST` → your Supabase host
   - `DB_POSTGRESDB_PASSWORD` → your Supabase DB password
   - `N8N_ENCRYPTION_KEY` → run `openssl rand -hex 32` in terminal
   - `N8N_BASIC_AUTH_PASSWORD` → choose a strong password
   - `WEB_API_KEY` → same key you use locally (check your current n8n setup)
4. Leave `WEBHOOK_URL` and `N8N_EDITOR_BASE_URL` with `[YOUR_RAILWAY_DOMAIN]` for now

### 2.3 Deploy + get domain
1. Click **Deploy** → wait for build (~3 min)
2. Once running: Settings → Networking → **Generate Domain**
3. Domain example: `arvia-n8n-production.up.railway.app`
4. Go back to Variables → update `WEBHOOK_URL` and `N8N_EDITOR_BASE_URL` with real domain
5. Redeploy (Railway redeploys automatically on var change)

### 2.4 Validate n8n is running
```bash
curl https://[YOUR_RAILWAY_DOMAIN]/healthz
# Expected: {"status":"ok"}
```

---

## PHASE 3 — Migrate workflows (10 min)

### 3.1 Access n8n
1. Open `https://[YOUR_RAILWAY_DOMAIN]`
2. Login: `admin` / [password you set in N8N_BASIC_AUTH_PASSWORD]

### 3.2 Create Supabase credential
1. n8n → Settings → Credentials → New credential → **Postgres**
2. Name: `Arvia Supabase`
3. Fill:
   - Host: `db.[PROJECT_REF].supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: `[SUPABASE_DB_PASSWORD]`
   - SSL: ✅ enabled
4. Click **Test** → should show "Connection tested successfully"
5. Save

### 3.3 Import workflow
1. n8n → Workflows → Import from file
2. Select: `workflows/arvia/workflow_properties.json`
3. After import: click each **DB_*** node → change credential to "Arvia Supabase"
   - DB List Properties
   - DB Get Property
   - DB Publish Property
   - DB Bulk Insert
   - DB Toggle Status
   - DB Delete Property
   - DB Update Property
   - DB Get Stats
4. Toggle workflow to **Active** (top right switch)

### 3.4 Test webhook
```bash
curl -X POST https://[YOUR_RAILWAY_DOMAIN]/webhook/arvia-properties \
  -H "Content-Type: application/json" \
  -H "x-api-key: [YOUR_WEB_API_KEY]" \
  -d '{"operation":"list_properties","payload":{}}'
# Expected: {"success":true,"data":[...]}
```

---

## PHASE 4 — Update Vercel (5 min)

### 4.1 Set production env vars
1. Vercel Dashboard → arvia project → Settings → **Environment Variables**
2. Add/update these variables (from `deploy/VERCEL_ENV_VARS.env`):
   - `N8N_WEBHOOK_URL` = `https://[YOUR_RAILWAY_DOMAIN]/webhook/arvia-properties`
   - `N8N_API_KEY` = `[SAME WEB_API_KEY]`
   - `NEXT_PUBLIC_USE_MOCK` = `false`
3. Delete old vars: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_USE_MOCK_DATA`

### 4.2 Redeploy Vercel
1. Vercel → arvia → Deployments → Redeploy latest
2. Wait ~1 min for build

### 4.3 End-to-end test
1. Open `https://arvia-nu.vercel.app`
2. Login → Dashboard → Publish a test property
3. Verify it appears in the list
4. Check Supabase Table Editor → properties table → should show the new row

---

## PHASE 5 — Twilio (if using WhatsApp)

If Twilio is configured:
1. Twilio Console → Messaging → WhatsApp Sandbox (or number)
2. Webhook URL → change to: `https://[YOUR_RAILWAY_DOMAIN]/webhook/[whatsapp-workflow-path]`
3. Test by sending a WhatsApp message

---

## PHASE 6 — Cleanup (5 min)

Once production is validated:
1. Stop local n8n: `docker compose down` in your local folder
2. Stop ngrok tunnel
3. Update `frontend/.env.local` to point to Railway URL (for local dev)

---

## Quick reference — final URLs

| Service | URL |
|---------|-----|
| n8n dashboard | `https://[RAILWAY_DOMAIN]` |
| Webhook endpoint | `https://[RAILWAY_DOMAIN]/webhook/arvia-properties` |
| Frontend | `https://arvia-nu.vercel.app` |
| Database | Supabase dashboard |

---

## Rollback plan

If anything fails after updating Vercel:
1. Vercel → arvia → Deployments → previous deployment → Redeploy
2. This instantly reverts to the old deployment pointing to ngrok
3. Fix the issue, then re-update

Local n8n keeps running until you manually stop it — zero downtime window.
