# Aurelia Books — Deployment Guide (Vercel + Fly.io)

> Owner-facing checklist. Do this **after** creating Supabase/HyperPay/Resend/Upstash/Sentry accounts (see `.env.example` for where each value comes from).
>
> 📌 **The exact secret names are in [`FLY-SECRETS.md`](FLY-SECRETS.md)** — grep-verified against the code. Copy them **exactly**; two common wrong names fail silently in production:
> - `UPSTASH_REDIS_URL` ✗ → **`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`** (wrong name ⇒ rate limiter unconfigured ⇒ **503 on every request** with a green boot)
> - `HYPERPAY_WEBHOOK_SECRET` ✗ → **`PAYMENT_WEBHOOK_SECRET`** (wrong name ⇒ webhook signature check silently skipped)
>
> `AUTH_SECRET`, `JWT_SECRET`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET` are **not read by the code** — adding them is harmless but misleading. `NODE_ENV`/`API_PORT` come from `apps/api/fly.toml` `[env]`, not secrets.

## 0. Prerequisites

- GitHub repo access (deploys trigger from `main`)
- A production PostgreSQL URL (Supabase: Settings → Database → Connection string → URI)
- Node 22 locally for the CLI tools

## 1. Database migrations (run once per release)

> **Supabase connection modes — verified against the official docs (2026-09):**
> - **Migrations** (one-off, from your machine): copy the string from **Connect → Session pooler** (port **5432**, host `aws-[INDEX]-[REGION].pooler.supabase.com`). The shared pooler is **IPv4-only on every plan** — your home network can reach it. The **direct** host `db.<ref>.supabase.co:5432` is **IPv6-only on Free plans**, so it usually fails from residential networks without the IPv4 add-on.
> - **App runtime** (Fly secret `DATABASE_URL`): **Connect → Transaction pooler** (port **6543**, same pooler host, `pgbouncer=true&connection_limit=5`). Transaction mode does **not** support prepared statements — harmless for Prisma here, but set `connection_limit=5`.
> - ⚠️ **The pooler host cannot be composed from your region** — it carries a cluster index (`aws-0`, `aws-1`, …). Copy it verbatim from the Connect dialog; both pooled modes use username `postgres.<PROJECT-REF>` while direct uses `postgres`.
> - Project ref = the token in the host (`db.<ref>.supabase.co` or `aws-<idx>-<region>.pooler.supabase.com`).

```bash
# from repo root — applies prisma/migrations in order (0001 → latest)
DATABASE_URL="<production-supabase-url>" npx prisma migrate deploy --schema prisma/schema.prisma

# Optional demo data (skip for a clean store):
DATABASE_URL="<production-supabase-url>" npm run db:seed
```

Verify: run `npx prisma migrate diff --from-url "<url>" --to-schema-datamodel prisma/schema.prisma --script` — output must say *empty migration*.

## 2. Backend → Fly.io

```bash
# one-time
fly auth login
fly launch --no-deploy --name aurelia-api --region fra   # pick your nearest region
fly postgres attach <your-fly-postgres>                   # OR skip if using Supabase directly

# environment (the exact required set is in FLY-SECRETS.md)
fly secrets set NODE_ENV=production API_PORT=8080 \
  DATABASE_URL="<supabase-transaction-pooler-url>" \
  WEB_URL="https://<your-vercel-app>.vercel.app" \
  STORAGE_PROVIDER=supabase SUPABASE_URL="<...>" SUPABASE_SERVICE_ROLE_KEY="<...>" SUPABASE_STORAGE_BUCKET=books-private \
  PAYMENT_PROVIDER=hyperpay HYPERPAY_BASE_URL=https://test.oppwa.com \
  HYPERPAY_ENTITY_ID="<...>" HYPERPAY_ACCESS_TOKEN="<...>" HYPERPAY_PAYMENT_TYPE=DB \
  PAYMENT_WEBHOOK_SECRET="$(openssl rand -hex 32)" \
  GOOGLE_CLIENT_ID="<...>" GOOGLE_CLIENT_SECRET="<...>" \
  PHONE_SIGNUP_ENABLED=false SMS_PROVIDER="" \
  OWNER_USERNAME="<your-login>" OWNER_EMAIL="<your-real-email>" OWNER_PASSWORD="<initial-strong-password>" \
  EMAIL_PROVIDER=resend RESEND_API_KEY="<...>" EMAIL_FROM="Aurelia Books <noreply@yourdomain>" \
  UPSTASH_REDIS_REST_URL="<...>" UPSTASH_REDIS_REST_TOKEN="<...>" \
  SENTRY_DSN="<...>" \
  DOWNLOAD_MAX_COUNT=5 DOWNLOAD_ACCESS_DAYS=365

fly deploy
```

**Owner account:** on first login the API auto-creates a single OWNER from `OWNER_USERNAME`/`OWNER_EMAIL`/`OWNER_PASSWORD` and **never overwrites** it afterwards — change the password from the dashboard (Settings) immediately; later `OWNER_PASSWORD` secret changes have no effect on the existing account.

**HyperPay webhook:** after deploy, set the webhook URL in the HyperPay portal to `https://<your-fly-app>.fly.dev/api/payments/webhook` and configure it to send header `x-webhook-secret` = your `PAYMENT_WEBHOOK_SECRET`. Requests without it are rejected 403.

**Health check:** the API exposes `GET /api/health` → `200 {"status":"ok","database":"up"}` or `503` if the DB is unreachable. `apps/api/fly.toml` already wires this check (path `/api/health`, port 8080).

Build/start used by Fly (already in `apps/api/package.json`): `npm run build` → `npm start` (`node dist/main.js`). Fly sets `PORT`; the API reads `API_PORT` — set `API_PORT=8080` in secrets (also in `fly.toml` `[env]`).

> ⚠️ **DATABASE_URL runtime pooler choice (verified against official docs):** `fly.toml`'s health check only pings the DB once at boot, but the runtime serves many concurrent requests — use the **Transaction pooler (6543)** URL with `pgbouncer=true&connection_limit=5` as the Fly `DATABASE_URL` secret (see §1 for the why). The **Session pooler (5432)** URL is for one-off migrations from your machine (§1) and works there too.

## 3. Frontend → Vercel

1. Vercel → *Add New Project* → import the GitHub repo.
2. **Root Directory:** `apps/web` · Framework: Next.js (auto). `apps/web` is self-contained (no workspace imports), so Vercel's default `next build` works with no extra steps. `apps/api/fly.toml` is committed; no `vercel.json` is needed.
3. Environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<your-fly-app>.fly.dev` (no trailing slash) |
| `API_URL` | same as above (used by server components, e.g. legal pages) |

4. Deploy. Build command is the default (`next build`), no custom steps needed.

## 4. Wire the two halves together (critical)

- In Fly secrets, set `WEB_URL` to the **final Vercel URL** — comma-separated list is supported if you also keep a preview origin, e.g. `https://store.example.com,https://my-app.vercel.app` (exact scheme+host, no trailing slash). CORS **and** the CSRF Origin check both read it → `fly deploy` again.
- The Google OAuth *Authorized redirect URI* must point at the public API base: `https://<your-fly-app>.fly.dev/api/auth/google/callback`.
- Verify from the browser: register → login → add to cart → dev payment → library download.

## 5. Post-deploy smoke checklist

```bash
curl -s https://<fly-app>.fly.dev/api/health
# {"status":"ok","database":"up"}

curl -s -o /dev/null -w '%{http_code}\n' https://<vercel-app>.vercel.app/
# 200
```

- [ ] Register/login works from the Vercel origin
- [ ] Cart → checkout completes (start with `PAYMENT_PROVIDER=development`)
- [ ] Download from Library returns a watermarked file
- [ ] Owner Studio login works (change the seeded owner password first!)
- [ ] Sentry receives a test error · Resend delivers a confirmation email
- [ ] 429 appears when hammering `/api/auth/login` 6× in a minute (Upstash wired)

## 6. Known production gates

- Rate limiting **fails closed (503)** in production without Upstash credentials — intentional.
- Set `PAYMENT_PROVIDER=hyperpay` **only** when HyperPay TEST credentials are in place; `development` is the safe default until then.
- Backups: schedule Supabase daily backups (paid) or `scripts/backup-postgres.ps1` via cron — see `BACKUP-RESTORE.md`.
