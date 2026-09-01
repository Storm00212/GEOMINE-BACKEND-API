// Service layer — business logic. Every other module's service calls
// requireRole/requireAuth from here rather than checking roles itself,
// so "who's allowed to do this" stays in one place.

import { getProfileById } from "./auth.repository";
import { getBearerTokenFromAuthHeader } from "@/lib/auth/secure-session";
import { verifyAccessToken } from "@/lib/auth/jwt";
import type { UserRole } from "@/types/database";

export interface AuthContext {
  userId: string;
  profile: import("@/types/database").Profile;
  role: UserRole;
}

export class UnauthorizedError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Not permitted") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Returns the current authenticated user + profile, or null if not signed in. */
export async function getCurrentAuthFromRequest(request: Request): Promise<AuthContext | null> {
  const authHeader = request.headers.get("authorization");

  const token = getBearerTokenFromAuthHeader(authHeader);

  if (!token) return null;

  const claims = verifyAccessToken(token);
  const profile = await getProfileById(claims.sub);
  if (!profile) return null;

  return { userId: claims.sub, profile, role: claims.role };
}


/**
 * Throws UnauthorizedError if nobody is signed in, or ForbiddenError if
 * they're signed in but not one of `allowedRoles`. Returns the auth
 * context on success.
 */
export async function requireRole(request: Request, allowedRoles: UserRole[]): Promise<AuthContext> {
  const auth = await getCurrentAuthFromRequest(request);
  if (!auth) throw new UnauthorizedError();
  if (!allowedRoles.includes(auth.profile.role)) throw new ForbiddenError();
  return auth;
}

/** Convenience: any authenticated user, regardless of role. */
export async function requireAuth(request: Request): Promise<AuthContext> {
  const auth = await getCurrentAuthFromRequest(request);
  if (!auth) throw new UnauthorizedError();
  return auth;
}


