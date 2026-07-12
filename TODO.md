# TODO - Supabase removal + Neon JWT auth transition

## Phase 1 — Frontend Supabase removal (token-based)
- [x] Create `lib/auth/token-storage.ts`
- [x] Create `lib/auth/api.ts`
- [x] Update `lib/backend-client-browser.ts` to attach `Authorization: Bearer <jwt>` from localStorage
- [x] Update `lib/backend-client-server.ts` to stop using Supabase session
- [x] Update `app/components/auth-nav.tsx` to log out by clearing token
- [x] Replace `app/login/page.tsx` to use backend `/api/auth/login` and `/api/auth/signup`
- [x] Disable `app/reset-password/page.tsx` (temporary placeholder)
- [x] Disable `app/auth/callback/route.ts` (redirect to login)
- [x] Remove `@supabase/*` from `geomine-frontend/package.json`
- [x] Stub `geomine-frontend/lib/supabase/*` to throw (no longer used)
- [ ] Delete `geomine-frontend/lib/supabase/*` entirely and remove any remaining imports (if any)

## Phase 2 — Backend custom auth (JWT) + auth endpoints
- [ ] Implement `POST /api/auth/signup`
- [ ] Implement `POST /api/auth/login`
- [ ] Implement `GET /api/auth/me` using JWT claims + Neon `profiles`
- [ ] Update backend `lib/modules/auth/auth.repository.ts` to stop using Supabase

## Phase 3 — Backend DB layer migration (Supabase → Neon SQL)
- [ ] Replace all `lib/supabase/*` repository usage with SQL (`lib/db.ts`)

## Phase 4 — Admin invite replacement
- [ ] Replace `POST /api/admin/invite` (Supabase admin invite) with custom logic

## Verification
- [ ] Frontend build passes after deleting remaining supabase files
- [ ] Backend build passes after auth endpoint implementation

