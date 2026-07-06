# Geomine Frontend

The UI for Geomine's predictive maintenance system — deployed and run
separately from the backend. This project owns nothing but presentation and
its own login session; every piece of actual data or business logic comes
from the backend over HTTP.

## Stack
Next.js 14 (App Router) + TypeScript + Tailwind + Supabase Auth (for its
own session only — see below)

## What this project does and doesn't own

**Owns:**
- Its own login flow (`/login`, magic link, `/auth/callback`) — a normal
  same-origin Supabase Auth setup, using `@supabase/ssr` and cookies exactly
  like a single-app Next.js project would.
- Role-based page routing (`middleware.ts`) — reads the current user's own
  profile directly via Supabase (RLS already allows a user to read their
  own row), purely to decide which page to redirect to. This is a
  deliberate exception to "everything goes through the backend" — see the
  comment in `middleware.ts` for why.
- All presentation: pages, charts, forms, the metrics panel styling.

**Does NOT own:**
- Any business logic or direct Postgres access beyond the profile self-read
  above. No `lib/modules/`, no service-role key, nothing that could bypass
  RLS. Every reading, machine, metric, or recommendation is fetched from
  the backend.

## How auth carries over to the backend
The frontend logs a user in via its own cookie session (same-origin, works
exactly like before). When a page or component needs backend data, it reads
that session's `access_token` and sends it as a Bearer header:

- **Server Components** (`app/*/page.tsx`) → `lib/backend-client-server.ts`
  (`backendFetchServer` / `backendGetJson`) — reads the session via
  `lib/supabase/server.ts` (cookies, same-origin) and forwards the token
  server-to-server. Not subject to browser CORS at all.
- **Client Components** (forms, buttons) → `lib/backend-client-browser.ts`
  (`backendFetchClient`) — reads the session via the browser Supabase client
  and calls the backend directly from the browser. This IS a genuine
  cross-origin request, which is why the backend's CORS allowlist matters.

Every page was rewritten to use one of these two helpers instead of
importing business logic directly — this is the actual seam of the
frontend/backend split.

## One UX consequence worth knowing: CSV export
The old single-app version used a plain `<a href="/api/reports/csv?...">`
link. That doesn't work anymore — a normal browser navigation to a
cross-origin URL carries no `Authorization` header, so the backend would
just 401 it. `report-builder.tsx` now fetches the CSV with the token
attached, turns the response into a Blob, and triggers the download via a
temporary object URL instead of a plain link. Slightly more code; it's what
an authenticated cross-origin file download actually requires.

## Setup

### 1. Environment variables
Copy `.env.local.example` to `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **same
  Supabase project the backend uses.** Only the anon key — this project
  never sees the service role key.
- `NEXT_PUBLIC_BACKEND_URL` — where the backend is running
  (`http://localhost:4000` for local dev).

In Supabase Dashboard > Authentication > URL Configuration, add this
frontend's own callback URL (e.g. `http://localhost:3000/auth/callback`).

### 2. Make sure the backend's CORS allows this origin
In the **backend's** `.env.local`, `ALLOWED_ORIGINS` needs to include
wherever this frontend runs — `http://localhost:3000` for local dev, plus
your deployed frontend URL once you ship it. If you get CORS errors in the
browser console, this is almost always where to look first.

### 3. Run it
```bash
npm install
npm run dev    # runs on :3000, separate from the backend's :4000
```

Start the backend first (or at least before you try logging in) — every
page after `/login` calls it immediately.

## Pages

| Route | Role | Notes |
|---|---|---|
| `/login` | public | magic link |
| `/entry` | miner/it/admin | quick-entry form, backdatable timestamp |
| `/entry/history` | miner/it/admin | caller's own submitted readings |
| `/dashboard` | it/admin | fleet overview, sorted by maintenance priority |
| `/machines/[id]` | it/admin | chart, full metrics panel, recommendation card |
| `/reports` | it/admin | CSV export builder |
| `/admin/users/new` | admin | invite a user with a role |

## What's deliberately not built yet
- GPS auto-capture on the entry form — the backend already accepts
  `latitude`/`longitude`/`locationAccuracyM` on a reading, this project just
  doesn't call `navigator.geolocation` yet.
- Refuel/fault logging forms — the backend routes exist
  (`POST /api/refuel-events`, `POST /api/fault-events`), no UI calls them yet.
- Admin UI for managing machines/parameters — use the backend's
  `POST /api/machines` directly or the Supabase Table Editor for now.
- Offline support (PWA + local sync).

## A note on shared types
`types/database.ts` and `types/metrics.ts` are duplicated from the
backend's equivalents, not imported across the deployable boundary (there
is no boundary a TypeScript import can cross once these are two separate
projects). If the backend's response shapes change, these need a matching
manual update — there's no compiler link to catch drift automatically. For
a bigger team this is usually solved with a shared types package in a
monorepo; not worth the setup cost for this project's current size, but
worth knowing about if the two ever start disagreeing on a shape.
