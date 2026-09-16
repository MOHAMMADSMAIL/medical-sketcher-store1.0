# Medical Sketcher Store — Owner Studio Completion Checklist

## Repository and delivery

- [x] Repository is public and reachable on GitHub.
- [x] `main` contains the merged Owner dashboard commit `6a3060a`.
- [x] Working tree is clean before implementation changes.
- [ ] Push implementation commit and verify GitHub Actions after final validation.

## Owner navigation and access

- [x] `/owner/login` exists.
- [x] Owner layout has responsive sidebar, mobile toggle, logout and public-site link.
- [x] Role guard is applied server-side to `/owner` API routes.
- [x] Dashboard, Books, Authors, Categories, Orders, Users, Reviews, Analytics and Audit Logs routes exist.
- [x] Library, Lessons, Assessments, CMS, Media and Settings routes are now present.
- [ ] Verify session expiry and browser redirect against a running PostgreSQL instance.

## Owner API coverage

- [x] Dashboard statistics use Prisma queries.
- [x] Books list, detail, create, update, publish, unpublish, archive and restore routes exist.
- [x] Authors and Categories CRUD routes exist.
- [x] Orders list and detail routes exist with status/payment filters.
- [x] Users list, detail and role update routes exist.
- [x] Library list, grant, revoke and expiry extension routes exist.
- [x] Reviews list, approve, reject and archive routes exist.
- [x] Lessons CRUD and publish routes exist.
- [x] Assessments CRUD and publish routes exist.
- [x] CMS read, update and publish routes exist.
- [x] Media list, upload and delete routes exist.
- [x] Analytics, audit log and settings routes exist.
- [ ] Add audit-event writes to every sensitive mutation before production release.

## Data and security

- [x] Lessons and Assessments are persisted in Prisma models.
- [x] Uploads are MIME-filtered and size-limited at the controller boundary.
- [x] Owner routes use AuthGuard and RolesGuard.
- [x] Private download files are not exposed as public UI URLs.
- [ ] Replace in-process rate limiting with a shared production store.
- [ ] Add signed production webhook verification.
- [ ] Add DTO validation instead of `any` for all mutation payloads.

## UI and Figma alignment

- [x] Owner Studio uses responsive sidebar/dashboard composition.
- [x] New screens use beige/olive luxury glass styling, serif display headings, rounded cards and soft shadows.
- [x] Loading, empty and error states are present on new data screens.
- [x] Search and status filter controls are present on new data screens.
- [ ] Figma file requires authentication in the current browser session, so pixel-level comparison is pending.

## Verification commands

- [ ] `npm run db:generate`
- [ ] `npm run check`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] `npm run test:e2e` with PostgreSQL configured
- [ ] Browser smoke test for every Owner route using an Owner seed account

## Release gate

The project is **implementation-complete for the requested Owner route surface only after all verification commands above pass**. Production readiness additionally requires the security and infrastructure items marked pending.
