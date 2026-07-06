# Geomine Backend

Standalone API for Geomine's predictive maintenance system. Deployed and run
independently from the frontend — this is the only thing that talks to
Postgres/Supabase directly.

## Stack
Next.js 14 (App Router, **API routes only — no pages/UI**) + TypeScript + Supabase (Postgres, Auth, RLS)

## Why Next.js for an API-only backend?
It reuses the exact route-handler mechanism (file-based routing, built-in
dev server, TS support) with almost no framework overhead beyond that — a
Next.js "app" with zero `page.tsx` files is just a set of HTTP handlers. If
you'd rather run this as an Express/Fastify service instead, the actual
business logic (everything in `lib/modules/`) has no Next.js-specific
dependencies except `next/headers` in `lib/supabase/request-client.ts` —
swapping that one file for reading a header off an Express `req` object
would be the only real change needed.

## Architecture: layered modules
Each domain in `lib/modules/` is split into four files:

```
lib/modules/<domain>/
  <domain>.repository.ts   — raw Supabase queries only. No auth checks, no
                              validation. If it's not a DB call, it doesn't
                              belong here.
  <domain>.service.ts      — business logic: validation, auth/role checks
                              (via the auth module), calls the repository.
  <domain>.controller.ts   — HTTP layer: parses the NextRequest, calls the
                              service, shapes the NextResponse. No business
                              logic beyond that.
  index.ts                 — barrel file re-exporting the service's public
                              functions, so other modules import
                              "@/lib/modules/<domain>" without needing to
                              know about the internal file split.
```

`app/api/**/route.ts` files are thin wiring — they import a controller
function and export it as the HTTP method:
```ts
import { listMachinesController } from "@/lib/modules/machines/machines.controller";
export const GET = listMachinesController;
```

**Composite endpoints** (`/api/dashboard`, `/api/machines/[id]/detail`,
`/api/entry/bootstrap`) don't have their own repository — they're
controllers that call multiple modules' *service* functions (via each
module's barrel) and bundle the results into one response, cutting down
round-trips for the frontend. This is normal in a layered architecture: not
every service needs its own dedicated controller, and a composite
controller depending on several services is expected.

Modules: `auth`, `machines`, `parameters`, `readings`, `metrics`, `refuel`,
`faults`, `reports`, `admin`.

## Auth model: Bearer tokens, not cookies
This is the one deliberate change from the single-app version. A cookie is
scoped to the domain that set it — once the frontend and backend are
genuinely separate origins, the backend can't read a session cookie the
frontend's domain set. So auth here is a **Bearer token** (the same
Supabase JWT the frontend already gets on login) instead:

- `lib/supabase/request-client.ts` reads the `Authorization` header off the
  incoming request (via `next/headers`, which works the same way `cookies()`
  did in the combined app — tied to the request via async local storage, so
  it's safe to call from deep inside module functions, not just the route
  handler directly) and builds a Supabase client scoped to that token.
- Every Supabase call made through that client is subject to that user's
  RLS policies — same security model as before, carried differently.
- No `Access-Control-Allow-Credentials`, no cookie complexity in CORS —
  just an origin allowlist and the `Authorization` header allowed through.

## CORS
`middleware.ts` handles this — allowlists origins from the `ALLOWED_ORIGINS`
env var (comma-separated), handles OPTIONS preflight requests, and sets
`Access-Control-Allow-Origin` to the *matched* origin (never `*`) on every
response. Add both your local frontend URL and your deployed frontend URL:
```
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
```

## Setup

### 1. Supabase project
Same project this backend and the frontend both point at — this split
doesn't split the database.
- New projects default to Postgres 15+, which this schema requires
  (`security_invoker` on views).
- Run the three migrations **in order** in the SQL editor:
  1. `supabase/migrations/0001_init.sql` — core schema, auth, RLS, basic stats
  2. `supabase/migrations/0002_generator_metrics.sql` — derived-metrics layer
     (loading, power, frequency, thermal stress, health index, maintenance
     priority, overload duration, power factor trend, RUL stub)
  3. `supabase/migrations/0003_engine_metrics_and_events.sql` — engine
     parameters, refuel/fault event logs, GPS metadata, specific fuel
     consumption, idle duration, maintenance recommendation engine

### 2. Environment variables
Copy `.env.local.example` to `.env.local`:
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — Project Settings > API
- `SUPABASE_SERVICE_ROLE_KEY` — same page, service_role key. **Only this
  backend ever sees this key** — the frontend never does.
- `ALLOWED_ORIGINS` — see CORS section above.

### 3. Bootstrap your first admin
Since invites can only be sent by an existing admin:
1. Supabase Dashboard > Authentication > Users > "Add user" — create yourself.
2. SQL editor: `update profiles set role = 'admin' where id = '<your-user-id>';`
3. From here, use `POST /api/admin/invite` (or the frontend's `/admin/users/new`
   page) to invite everyone else — role is set server-side at invite time,
   never self-assignable.

### 4. Add generators
No admin UI for this yet — use `POST /api/machines` (admin token) or the
Supabase Table Editor directly:
```sql
insert into machines (name, location, phase_type) values ('Generator 1', 'Site A', 'three_phase');
```

### 5. Run it
```bash
npm install
npm run dev    # runs on :4000
```

## Full endpoint list

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/api/auth/me` | any | who am I, what's my role |
| GET | `/api/machines` | any | `?active_only=true` |
| POST | `/api/machines` | admin | create a machine |
| GET | `/api/parameters` | any | `?machine_type=generator&active_only=true` |
| POST | `/api/readings` | miner/it/admin | batch-log readings for one machine+timestamp |
| GET | `/api/readings/mine` | any | caller's own readings (RLS-scoped) |
| PATCH | `/api/readings/[id]` | it/admin | correct a mis-entered value |
| DELETE | `/api/readings/[id]` | admin | remove a reading |
| POST | `/api/refuel-events` | miner/it/admin | |
| GET | `/api/refuel-events?machine_id=` | it/admin | |
| POST | `/api/fault-events` | miner/it/admin | |
| GET | `/api/fault-events?machine_id=` | it/admin | `&unresolved_only=true` |
| POST | `/api/fault-events/[id]/resolve` | it/admin | |
| GET | `/api/dashboard` | it/admin | consolidated: machines + recent + flagged + fleet snapshot |
| GET | `/api/metrics/fleet-snapshot` | it/admin | just the snapshot rows |
| GET | `/api/metrics/machine/[id]` | it/admin | just one machine's snapshot |
| GET | `/api/machines/[id]/detail` | it/admin | consolidated: everything the machine page needs |
| GET | `/api/machines/[id]/recommendation` | it/admin | `?sample_size=10`, rule-based, see below |
| GET | `/api/reports/machines` | it/admin | for a dropdown |
| GET | `/api/reports/csv` | it/admin | `?machine_id=&from=&to=` |
| POST | `/api/admin/invite` | admin | |

## Metrics — what's real physics vs. what's a heuristic
Kept visible in the code (and in the frontend UI, which groups them under
these headings) because it changes how much to trust each number.

**Standard physics:** `get_generator_loading`, `get_apparent_power_kva` /
`get_real_power_kw`, `get_frequency_hz`.

**Explicitly-defined heuristics, not validated against real failure
history yet:** `get_thermal_stress_index`, `get_health_index`,
`get_maintenance_priority_score`, `get_power_factor_trend` (a documented
stand-in for "efficiency trend" — true efficiency isn't computable without
fuel/mechanical-input data), `get_overload_duration_minutes` /
`get_idle_duration_minutes` (under-count gaps between manual readings by
nature of periodic logging).

**Real efficiency metric:** `get_specific_fuel_consumption` (L/kWh) —
refuel-aware, handles the case where fuel level rose more than logged
refuels explain by returning a note instead of a wrong number.

**Deliberately not implemented:** `get_estimated_rul` always returns
`insufficient_data`. Remaining useful life needs a degradation curve
calibrated against real historical failure data, which doesn't exist yet —
a fabricated number here could drive an actual maintenance decision on
physical equipment. Wired and ready; not faked.

## Maintenance recommendation engine
`GET /api/machines/[id]/recommendation` — **rule-based and fully
explainable, not a statistical or ML prediction.** Looks at the last N
*distinct logging visits* (not raw rows — one visit logs several parameters
at once) and checks flagged-reading counts against `health_index`/
`thermal_stress_index` thresholds. Returns `status` (healthy/watch/
needs_maintenance/insufficient_data), `confidence` (reflects sample count
AND recency), and a `reasons` array — the specific conditions that fired,
so it can be checked, not just trusted. Thresholds are a reasonable
starting point; expect to tune them once Geomine's engineers have seen it
run against real machines. Full logic and exact thresholds are commented
in `supabase/migrations/0003_engine_metrics_and_events.sql`.

## Testing with Postman
```bash
npm run dev
node scripts/dev-login.mjs someone@geomine.com
```
That prints a real access token straight to the terminal — no email wait,
no URL-clicking (an improvement over the old cookie-based flow: Bearer auth
just needs a token pasted into a variable once). **Local dev only** — the
script uses the service role key directly and is a plain CLI script, never
an HTTP route.

Import `postman/geomine-backend.postman_collection.json`, paste the token
into the `access_token` collection variable (Collection → Variables tab —
auth is applied at the collection level, so every request picks it up
automatically), fill in a `machine_id` and parameter IDs from Supabase
Table Editor, and everything should just work.

**Test the role boundaries, not just the happy path:** get a token for a
miner account and confirm `/api/admin/invite`, `/api/dashboard`, and
`/api/machines/[id]/recommendation` all 403. Get an admin token and confirm
they succeed.

## What's deliberately not built yet
- Admin UI for managing machines/parameters (the service functions exist —
  `createMachine`, `setMachineSpec` — just no frontend page calling them)
- Bulk/grid entry for IT catch-up logging
- Offline support on the entry form (frontend concern, not blocked by
  anything here)
