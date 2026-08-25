# Geomine Backend (Express + Prisma)

An alternative implementation of `geomine-backend/`'s API — same routes,
same request/response shapes, same auth mechanism, same CORS behavior — on
Node.js + Express + TypeScript + Prisma instead of Next.js + raw `pg`. Built
to run against the exact same database the old backend uses, so the
frontend (`geomine-frontend/`) works against either backend unchanged.

**The old backend (`geomine-backend/`) is untouched and still there as a
fallback.** Don't run both at once — they use the same port (4000).

## Structure

Deliberately consolidated into one file per layer, rather than the old
backend's one-folder-per-domain layout:

```
prisma/schema.prisma   introspected from the live DB (8 tables, user_role enum)
src/
  config.ts            env loading, CORS allowlist, Prisma client singleton
  types.ts             shared types + error classes (UnauthorizedError, etc.)
  middleware.ts         CORS, requireAuth/requireRole, JWT sign/verify, error handler
  repositories.ts       all data access — Prisma typed client for CRUD,
                         $queryRaw for the metrics views/functions and any
                         join that needs a flat (non-nested) result shape
  services.ts            all business logic + validation
  controllers.ts         all Express request handlers
  routes.ts               route wiring (method + path + middleware + controller)
  server.ts               entry point
```

## Differences from the old backend (intentional)

Three known bugs in the old backend were fixed here rather than replicated
(confirmed with the team — none of these break the frontend either way):

- `GET /api/machines` now requires authentication (old backend has no auth
  check on this route at all).
- The `unresolved_only` fault filter now actually returns unresolved
  faults (old backend's filter is inverted).
- `POST /api/admin/invite` with a duplicate email now returns `409` with a
  clear message (old backend falls through to a generic `500`).

Auth checks moved from imperative calls inside service functions (the old
backend's pattern) to Express middleware applied per-route in `routes.ts` —
same resulting 401/403 behavior, just enforced earlier in the request
lifecycle and out of `services.ts`.

## Setup

```bash
cp .env.example .env   # point DATABASE_URL at the same DB geomine-backend uses
npm install
npm run dev             # nodemon, :4000
```

`postinstall` runs `prisma generate` automatically. If the DB schema
changes, re-run `npm run prisma:pull` to re-introspect.
