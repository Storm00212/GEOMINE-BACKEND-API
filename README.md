# Geomine

Predictive maintenance system for mining generators. Three parts, run
separately.

## Parts

- geomine-backend-express: the main backend, using
  Express and Prisma instead. Also runs on port 4000. Only run one backend
  at a time, since they share a port.
- geomine-frontend: the web UI. Runs on port 3000. Talks to whichever
  backend is running on port 4000.
- database: SQL files for setting up Postgres.

## Requirements

- Node.js 22 or later
- A Postgres database (local or hosted). The same database is used by
  either backend.

## Database setup

Run these against your Postgres database, in order:

```
psql "$DATABASE_URL" -f database/full-neon-mvp.sql
psql "$DATABASE_URL" -f database/0002_reconstructed_metrics_and_events.sql
```

Optional demo data:

```
cd geomine-backend
node scripts/seed-demo-data.mjs
```

## Running the main backend

```
cd geomine-backend
cp .env.local.example .env.local
npm install
npm run dev
```

Set DATABASE_URL, JWT_SECRET, and ALLOWED_ORIGINS in .env.local.

## Running the alternative backend

```
cd geomine-backend-express
cp .env.example .env
npm install
npm run dev
```

Set DATABASE_URL and JWT_SECRET to the same values as the main backend if
you want tokens to work across both.

## Running the frontend

```
cd geomine-frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Set NEXT_PUBLIC_BACKEND_URL to http://localhost:4000.

## First login

There is no default user. Create one by calling the backend directly:

```
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword","role":"admin"}'
```

Then log in at http://localhost:3000/login. From there, use
/admin/users/new to invite other users.

## Notes

- geomine-backend-express fixes three bugs present in geomine-backend:
  GET /api/machines requiring no auth, an inverted unresolved-only filter
  on fault events, and admin-invite returning a generic error on a
  duplicate email instead of a clear one.
- More detail on each part is in that part's own README.
