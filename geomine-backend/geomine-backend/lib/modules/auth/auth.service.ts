// Service layer — business logic. Every other module's service calls
// requireRole/requireAuth from here rather than checking roles itself,
// so "who's allowed to do this" stays in one place.

import { getAuthUser, getProfileById } from "./auth.repository";
import type { UserRole } from "@/types/database";

export interface AuthContext {
  userId: string;
  profile: import("@/types/database").Profile;
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
export async function getCurrentAuth(): Promise<AuthContext | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const profile = await getProfileById(user.id);
  if (!profile) return null;

  return { userId: user.id, profile };
}

/**
 * Throws UnauthorizedError if nobody is signed in, or ForbiddenError if
 * they're signed in but not one of `allowedRoles`. Returns the auth
 * context on success.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthContext> {
  const auth = await getCurrentAuth();
  if (!auth) throw new UnauthorizedError();
  if (!allowedRoles.includes(auth.profile.role)) throw new ForbiddenError();
  return auth;
}

/** Convenience: any authenticated user, regardless of role. */
export async function requireAuth(): Promise<AuthContext> {
  const auth = await getCurrentAuth();
  if (!auth) throw new UnauthorizedError();
  return auth;
}
