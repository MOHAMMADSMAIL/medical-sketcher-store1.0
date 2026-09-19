# Aurelia Books — System Architecture (Components)

```mermaid
flowchart LR
    subgraph Clients
        B["Customer Browser"]
        O["Owner Browser"]
    end

    subgraph Vercel["apps/web (Next.js) — Vercel"]
        W["Storefront + Owner Studio<br/>(SSR pages + client SPA)"]
    end

    subgraph Fly["apps/api (NestJS) — Fly.io"]
        MW["Middleware chain:<br/>CORS → helmet → cookieParser<br/>→ rateLimit → csrfProtection"]
        API["REST controllers<br/>(auth, catalog, cart, orders,<br/>payments, library/downloads,<br/>owner, cms, observability)"]
        F["MonitoringExceptionFilter<br/>(redaction + Sentry/console)"]
        DS["DownloadService (DRM)<br/>watermark · limits · IP/UA log"]
    end

    subgraph Data
        DB[("PostgreSQL<br/>Supabase / Fly Postgres")]
        SB[("Supabase Storage<br/>private bucket<br/>signed URLs")]
        FS[("Local disk<br/>(dev storage/)")]
    end

    subgraph External
        HP["HyperPay<br/>checkout + verify"]
        RS["Resend<br/>transactional email"]
        UP["Upstash Redis<br/>rate counters"]
        SE["Sentry<br/>error events"]
    end

    B -->|HTTPS + cookies| W
    O -->|HTTPS + session| W
    W -->|/api/* fetch| MW
    B -->|direct /api fetch| MW
    MW --> API
    API --> F
    API --> DS
    API --> DB
    DS --> SB
    DS -. dev .-> FS
    API --> HP
    HP -. webhook .-> API
    API --> RS
    MW --> UP
    F --> SE
```

## Request path rules

1. **CORS first** — rejected requests (403/429) still carry `Access-Control-Allow-Origin` so the browser shows the real message.
2. **Rate limiting before CSRF** — even attacks against the protections themselves are throttled. Policies: `auth/register` 3/min, `auth/login` 5/min, `payments/*` 10/min, `owner/*` 60/min, everything else 180/min.
3. **CSRF double-submit** — `aurelia_csrf` cookie + `X-CSRF-Token` header must match; `Origin`/`Referer` must equal `WEB_URL`. Only `POST /api/payments/webhook` is exempt (server-verified by HyperPay signature flow instead).
4. **Single DRM download path** — `GET /api/downloads/:productId` → DownloadService (revocation, expiry, count, watermark, IP/UA log). No bypass route exists.
5. **Server-only secrets** — `SUPABASE_SERVICE_ROLE_KEY`, `HYPERPAY_ACCESS_TOKEN`, `RESEND_API_KEY`, `AUTH_SECRET` never reach the browser; storage is private-bucket + signed URLs.

## Environment topology

| Concern | Development | Production (target) |
|---|---|---|
| Web | `next dev` :3001 | Vercel |
| API | `node dist/main.js` :3000 | Fly.io (+health check `/api/health`) |
| DB | Docker Postgres | Supabase Postgres (DATABASE_URL) |
| Storage | local `./storage` | Supabase private bucket |
| Payments | development provider | HyperPay TEST then LIVE |
| Email | console | Resend |
| Rate limiting | Upstash or no-op | Upstash (required, 503 without it) |
| Monitoring | console events | Sentry DSN |
