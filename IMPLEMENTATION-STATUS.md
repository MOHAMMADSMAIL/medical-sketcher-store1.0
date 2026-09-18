# Aurelia Books — Implementation Status

## Newly verified

- `npm install --no-audit --no-fund` succeeds and installs the NestJS, Next.js, Prisma, React, Three.js, and Motion toolchain.
- `DATABASE_URL=postgresql://... npx prisma validate` succeeds.
- `npm run db:generate` succeeds and generates Prisma Client 6.19.3.
- A real Prisma migration SQL file exists at `prisma/migrations/0001_init/migration.sql`.
- `npm run check` succeeds for API, web, and shared types.
- `npm run build` succeeds for NestJS and Next.js when `NODE_ENV` is unset or production.
- NestJS bootstrap, `PrismaService`, `AppModule`, `ProductsController`, and `ProductsService` now exist and compile.
- Development payment and storage provider abstractions now exist.

## Not yet verified or complete

- `npm run db:seed` requires a running PostgreSQL and a valid `DATABASE_URL`; it was attempted and failed because this sandbox has no configured database connection.
- Docker validation cannot run because the Docker CLI is not installed in this sandbox.
- Only catalog controller wiring is currently connected to Prisma. Auth, cart, order/payment transaction, protected downloads, library, CMS mutations, owner APIs, and the full Next route set still require implementation and integration tests.
- The current static storefront assets remain in `apps/web/public` for visual continuity; the Next home page is now real and API-backed, but the complete Next page suite is not yet complete.

## Honest gate

**STATUS: NOT READY FOR END-TO-END DEMO YET.**

The first hard gates now pass (dependency installation, Prisma validation/generation, TypeScript checks, Nest build, and Next build). The next required milestone is a live PostgreSQL-backed auth → catalog → cart → order → development payment → permission → protected download flow.

## Latest correction

The StorageProvider contract mismatch was fixed; the next verification run is required. Docker remains untestable in this environment because neither `docker` nor `docker-compose` is installed.

## Auth milestone

Auth routes are now compiled and connected to Prisma sessions: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, and `POST /api/auth/logout`. Passwords are bcrypt-hashed, session tokens are SHA-256 hashed before storage, expiry is enforced, and the browser token is an HTTP-only cookie. This milestone has passed TypeScript check and Nest/Next production builds; live behavior still requires PostgreSQL.

## Core commerce milestone

The following backend controllers/services now compile and are connected to Prisma: Cart (`/api/cart`), Orders (`/api/orders`), Payments (`/api/payments/create`, `/:id/confirm`, `/webhook`), Library (`/api/library`), and protected Downloads (`/api/downloads/:productId`). Cart ownership and server-side totals are enforced; orders snapshot database prices; payment confirmation updates the order and upserts permissions; downloads verify active permission and create a download log. The Next `/cart` and `/library` pages call the API with credentials.

This is source/build verified only. The full journey remains **not runtime-verified** until PostgreSQL is available; Docker is still unavailable in this environment.
