# Aurelia Books — Purchase Journey (Sequence)

> The full happy path: register → login → cart → checkout → payment → webhook → order PAID → library access → protected download.

```mermaid
sequenceDiagram
    autonumber
    actor C as Customer (Browser)
    participant W as Web (Next.js :3001)
    participant A as API (NestJS :3000)
    participant R as Upstash Redis
    participant DB as PostgreSQL (Prisma)
    participant P as Payment Provider<br/>(HyperPay / development)
    participant S as Storage (Supabase/Local)
    participant E as Email (Resend/Console)

    C->>W: Open any page
    W->>A: GET /api/products
    A->>A: rateLimit (INCR via R) → csrf (seed cookie)
    A-->>W: 200 catalog + Set-Cookie aurelia_csrf

    C->>W: POST /auth/register (form)
    W->>A: POST /api/auth/register + X-CSRF-Token
    A->>A: rateLimit (3/min) → CSRF check → hash password (bcrypt)
    A->>DB: INSERT User
    A-->>W: 201 user (no passwordHash echoed)

    C->>W: POST /auth/login
    W->>A: POST /api/auth/login + CSRF
    A->>DB: verify password → INSERT Session(tokenHash)
    A-->>W: 201 + httpOnly aurelia_session

    C->>W: Add to cart, set quantity
    W->>A: POST /api/cart/items · PATCH /api/cart/items/:id
    A->>DB: upsert CartItem
    A-->>W: cart totals

    C->>W: Checkout (pay)
    W->>A: POST /api/orders → 201 PENDING
    W->>A: POST /api/payments/create
    A->>P: createCheckout(order, amount, email)
    P-->>A: checkoutId
    A->>DB: INSERT Payment(CREATED, idempotencyKey=order:id)
    A-->>W: payment {checkoutId}

    P-)A: POST /api/payments/webhook (CSRF-exempt, rate-limited 10/min)
    A->>P: verifyCheckout(checkoutId) — server-side re-verification
    P-->>A: SUCCEEDED + transactionId
    A->>DB: TX: Payment=SUCCEEDED · Order=PAID<br/>DownloadPermission upsert<br/>(expiresAt=+365d, maxDownloads=5)
    A->>E: payment-confirmation + download-ready emails

    C->>W: Open Library
    W->>A: GET /api/library (session)
    A->>DB: permissions where revokedAt IS NULL AND not expired
    A-->>W: purchased books

    C->>W: Download
    W->>A: GET /api/downloads/:productId (DRM path)
    A->>A: checks: revoked? expired? downloadCount < max?
    A->>S: getStream(storageKey)
    A->>A: append watermark (email + orderId + timestamp)
    A->>DB: DownloadLog(ip, userAgent) + downloadCount++
    A-->>C: 200 watermarked file
```

## Failure paths covered by code (and where verified)

| Path | Behaviour |
|---|---|
| Rate limit exceeded | `429 Too many requests` (per-path policies, Upstash counters) |
| Missing/wrong CSRF | `403 Invalid CSRF token` |
| Payment verify fails | Payment=FAILED, Order back to PENDING |
| Permission revoked / expired / over limit | `403` with specific message |
| Storage object missing | `404 Book file is unavailable` (no raw 500) |
| Server error | MonitoringExceptionFilter → redacted error event (Sentry/console) |
