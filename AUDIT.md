# Aurelia Books — Current Audit

## Verified now

The monorepo syntax checks pass for the three workspaces. The API currently serves the storefront, catalog, registration/login, orders, demo checkout, library, wishlist, reviews, public CMS pages, and owner analytics routes. The smoke runner now starts the API itself and verifies catalog plus checkout.

## Build blockers

| Area | Current state | Blocking consequence | Required fix |
|---|---|---|---|
| Persistence | `prisma/schema.prisma` exists, but no Prisma dependency/client or repository layer is wired | Data resets when the process stops | Add Prisma dependencies, migration, client, repositories, seed command, and integration tests |
| API framework | Current server is a native Node reference implementation, not NestJS | No modules, DTO validation, Swagger, guards, or production error architecture | Migrate routes into NestJS modules without changing the canonical contracts |
| Web framework | Current UI is static HTML/CSS/JS, not Next.js | No route-level rendering, metadata, server actions, or authenticated pages | Create Next.js app and port the design system and contracts |
| Payments | Checkout is explicitly demo-only | No real payment lifecycle or paid order fulfillment | Add provider abstraction, signed webhook verification, idempotency, and state transitions |
| Digital files | No storage adapter or protected download controller | No secure PDF/EPUB delivery | Add local/S3 storage, permission checks, expiring tokens, limits, and audit events |
| Admin/CMS | Only read-only public page and analytics reference routes exist | No management UI or mutations | Add owner guard, CRUD APIs, versioning, restore, media manager, and dashboard pages |
| Security | Basic headers only | No rate limits, password reset, CSRF/session strategy, or audit persistence | Add security middleware and security tests |
| Tests | Smoke coverage only | No unit, integration, E2E, or security regression suite | Add layered tests after persistence and auth are wired |
| Operations | PostgreSQL compose file only | No API/web images or health/readiness endpoints | Add Dockerfiles, production compose, health checks, migrations, and CI |

## Implementation order

1. **Canonical contracts and persistence:** finalize Prisma relations/enums, add Prisma client/repositories, migrations, seed, and transaction boundaries.
2. **Authentication and authorization:** sessions, password hashing, reset flow, owner guard, validation, rate limiting, and audit logging.
3. **Commerce core:** catalog queries, cart persistence, checkout order creation, payment provider interface, webhook verification, idempotency, and paid/free fulfillment.
4. **Digital delivery:** storage abstraction, upload validation, private keys, expiring download tokens, limits, library, and download history.
5. **Customer features:** wishlist, reviews/moderation, orders, account, email/newsletter abstractions.
6. **Owner/CMS:** product/author/category management, media manager, pages, versioning/restore, analytics APIs.
7. **Next.js storefront:** homepage, book detail, cart, checkout, auth, account, library, wishlist, reviews, responsive mobile UI, SEO/i18n/accessibility.
8. **Luxury visual layer:** React Three Fiber book scenes, cinematic scrolling, reduced-motion fallback, and performance budgets.
9. **Verification and operations:** unit/integration/E2E/security tests, Dockerfiles, health checks, production configuration, CI, and final build audit.

The project is therefore **not yet Production 1.0**. This file records the exact gap instead of treating the foundation as complete.
