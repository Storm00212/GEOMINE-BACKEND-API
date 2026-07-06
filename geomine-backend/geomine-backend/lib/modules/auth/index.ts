// Barrel file — every other module imports from "@/lib/modules/auth"
// exactly as before. Internally this now lives across three layers:
// auth.repository.ts (raw queries), auth.service.ts (business logic,
// exported here), auth.controller.ts (HTTP handlers, wired directly into
// app/api/auth/me/route.ts rather than re-exported here).

export {
  getCurrentAuth,
  requireRole,
  requireAuth,
  UnauthorizedError,
  ForbiddenError,
  type AuthContext,
} from "./auth.service";
