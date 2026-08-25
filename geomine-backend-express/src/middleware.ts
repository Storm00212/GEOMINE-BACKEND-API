import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getAllowedOrigins, getJwtSecret, prisma } from "./config";
import {
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  type JwtClaims,
  type UserRole,
  type AuthContext,
} from "./types";

// Signs a 7-day access token carrying the user's id and role.
export function signAccessToken(claims: JwtClaims): string {
  return jwt.sign(claims, getJwtSecret(), { expiresIn: "7d" });
}

// Verifies and decodes an access token, throwing if it's invalid/expired.
export function verifyAccessToken(token: string): JwtClaims {
  return jwt.verify(token, getJwtSecret()) as JwtClaims;
}

// Pulls the token out of an "Authorization: Bearer <token>" header.
function getBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

// Sets CORS headers for cross-origin requests from the frontend, using an origin allowlist.
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  const allowed = getAllowedOrigins();

  if (origin && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
}

// Resolves the current user from the Authorization header, using profiles as the source of truth for role.
async function resolveAuth(req: Request): Promise<AuthContext> {
  const token = getBearerToken(req.headers.authorization);
  if (!token) throw new UnauthorizedError();

  let claims: JwtClaims;
  try {
    claims = verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError();
  }

  const profile = await prisma.profiles.findUnique({ where: { id: claims.sub } });
  if (!profile) throw new UnauthorizedError();

  return { userId: claims.sub, profile, role: claims.role };
}

// Requires a valid, authenticated request of any role.
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    req.auth = await resolveAuth(req);
    next();
  } catch (error) {
    next(error);
  }
}

// Returns a middleware requiring the profile role to be one of allowedRoles.
export function requireRole(allowedRoles: UserRole[]) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auth = await resolveAuth(req);
      if (!allowedRoles.includes(auth.profile.role as UserRole)) {
        throw new ForbiddenError();
      }
      req.auth = auth;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Catches errors from middleware that runs before any controller, since requireAuth and requireRole never reach a controller's own try/catch.
export function errorHandlerMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  handleApiError(error, res);
}

// Maps a thrown error to the right status code and body.
export function handleApiError(error: unknown, res: Response): void {
  if (error instanceof UnauthorizedError) {
    res.status(401).json({ error: error.message });
    return;
  }
  if (error instanceof ForbiddenError) {
    res.status(403).json({ error: error.message });
    return;
  }
  if (error instanceof ValidationError) {
    res.status(400).json({ error: error.message });
    return;
  }
  if (error instanceof ConflictError) {
    res.status(409).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}
