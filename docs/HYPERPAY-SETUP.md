# HyperPay Setup Guide (for the store owner)

> ⚠️ **Honesty note first:** I do **not** have current, confirmed knowledge of HyperPay's live registration flow or the exact labels in their merchant portal today. Everything below about the portal is based on general knowledge of how OPPWA/HyperPay gateways typically work and **must be verified directly on their official site/dashboard** once you register. The code side, however, is fully ready and exact.

## 1. What the code needs (already implemented — nothing hardcoded)

The API reads **only** these environment variables (see `apps/api/src/payment.provider.ts`):

| Variable | Meaning | Safe default |
|---|---|---|
| `PAYMENT_PROVIDER` | `development` (sandbox, no real money) / `hyperpay` (real gateway) | `development` |
| `HYPERPAY_BASE_URL` | Gateway endpoint | **`https://test.oppwa.com` (TEST on purpose)** |
| `HYPERPAY_ENTITY_ID` | Your channel/terminal ID | — (throws if missing when hyperpay selected) |
| `HYPERPAY_ACCESS_TOKEN` | API user password | — (throws if missing when hyperpay selected) |
| `HYPERPAY_PAYMENT_TYPE` | `DB` = one-step debit | `DB` |

**Test vs LIVE separation:** the only difference is the base URL —
- TEST: `https://test.oppwa.com`
- LIVE: `https://eu-prod.oppwa.com` *(verify the exact live host in your onboarding pack — gateways differ by region)*

The default stays **TEST** so production credentials can never be hit by accident. Move to LIVE by changing `HYPERPAY_BASE_URL` + production `HYPERPAY_ENTITY_ID`/`HYPERPAY_ACCESS_TOKEN` together, deliberately.

## 2. Steps ONLY YOU can do at HyperPay (verify each on their official site)

1. **Register a merchant account** — expect KYC: national ID / company registration, bank account (IBAN), sometimes a trade license. As an individual seller expect the "sole trader"/individual route if offered in Jordan.
2. **Wait for account approval**, then log into the merchant portal.
3. **Create/locate your Entity ID** (usually under *Administration → Entity IDs* or shown on the dashboard as *Channel*). Copy it → `HYPERPAY_ENTITY_ID`.
4. **Create an API user** (usually *Administration → Users*; not your login user). Copy its password → `HYPERPAY_ACCESS_TOKEN`.
5. **Confirm the TEST credentials work** before asking for LIVE: the portal usually shows both a TEST and a LIVE entity with separate tokens.
6. **Request LIVE activation** (usually a button/ticket: "go live"). They may ask for a live domain and completed KYC.
7. **Set the webhook** (if their portal offers notification configuration): point it to `https://<your-api-domain>/api/payments/webhook`. Our endpoint is CSRF-exempt and re-verifies every payment server-side with HyperPay before granting downloads, so even unsolicited hits can't grant access.

## 3. Where to put the values

Fly.io (production):

```bash
fly secrets set PAYMENT_PROVIDER=hyperpay \
  HYPERPAY_BASE_URL=https://test.oppwa.com \
  HYPERPAY_ENTITY_ID=<from-portal> \
  HYPERPAY_ACCESS_TOKEN=<from-portal>
```

Locally: copy `.env.example` values into `.env` (never commit `.env`).

## 4. How to verify the integration safely (ordered)

1. Keep `PAYMENT_PROVIDER=development` → run the full purchase journey in the browser (already verified working).
2. Switch `PAYMENT_PROVIDER=hyperpay` with **TEST** credentials → buy with HyperPay's documented test card → confirm order becomes `PAID` and library access appears.
3. Only after 2 works repeatedly: swap to LIVE values + real cards, **do one real purchase yourself and refund it** to validate the money path end-to-end.
