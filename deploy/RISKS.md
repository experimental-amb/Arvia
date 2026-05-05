# Known Risks & Mitigations

## 🔴 Critical

### R1 — N8N_ENCRYPTION_KEY loss
**Risk**: If you lose the encryption key, all credentials stored in n8n (Postgres, Twilio, etc.)
become unreadable. You'd need to re-enter every credential.  
**Mitigation**: 
- Save `N8N_ENCRYPTION_KEY` in a password manager immediately
- Never change it once n8n has saved credentials
- Railway Variables are persistent — it won't disappear

### R2 — Supabase connection from Railway (SSL)
**Risk**: n8n may fail to connect to Supabase if SSL is misconfigured.  
**Mitigation**: 
- Set `DB_POSTGRESDB_SSL=true` and `DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false`
- Use port **5432** (direct), NOT 6543 (pooler) — n8n doesn't work with PgBouncer
- Test the credential inside n8n before activating workflows

---

## 🟡 Medium

### R3 — Railway cold starts
**Risk**: Railway free/hobby tier may sleep the service after inactivity.  
**Mitigation**: 
- Use **Railway Starter** plan ($5/month) — no sleep
- Or add an uptime monitor (UptimeRobot free tier) that pings `/healthz` every 5 minutes

### R4 — Webhook path mismatch
**Risk**: The workflow uses path `arvia-properties`, but any typo in Vercel's `N8N_WEBHOOK_URL`
will cause 404 on every API call.  
**Mitigation**:
- Vercel var must be exactly: `https://[domain]/webhook/arvia-properties`
- After updating, test with a `curl` before marking as done

### R5 — Firebase auth still works in production
**Risk**: Firebase Firebase project `arvia-5c048` is already in use — no changes needed.
But if Firebase rules are restrictive, authenticated requests may fail.  
**Mitigation**: Check Firebase Console → Authentication → verify email/password provider is enabled

### R6 — Workflows re-import loses credential links
**Risk**: After importing workflow JSON, each Postgres node will show "Credential missing" —
this is expected. Must be manually reassigned.  
**Mitigation**: The checklist covers this. Budget 5 minutes to click through 8 nodes.

---

## 🟢 Low / Informational

### R7 — Railway build time
First deploy takes ~3–5 minutes. Subsequent deploys (on git push) take ~1–2 min.
Normal behavior, not an issue.

### R8 — Supabase free tier limits
Supabase free tier: 500MB DB, 2GB bandwidth, pauses after 1 week of inactivity.  
**Recommendation**: Upgrade to Supabase Pro ($25/month) before going to real users,
or keep the project active with periodic queries.

### R9 — NEXT_PUBLIC_* vars are baked at build time
Variables starting with `NEXT_PUBLIC_` are embedded at Vercel build time, not runtime.
If you change `N8N_WEBHOOK_URL` (server-only var), you don't need to rebuild.
If you change `NEXT_PUBLIC_USE_MOCK`, you do need to redeploy.

### R10 — No queue / retry for n8n executions
Current setup is synchronous — if n8n is restarting when a request comes in, it fails.
Railway restarts typically take <10 seconds. The frontend has retry logic (2 retries, 800ms delay).
This is acceptable for MVP; add a queue (BullMQ, etc.) for v2 if needed.
