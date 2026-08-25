import type { JwtClaims } from "./jwt";

export type AppAuthContext = {
  userId: string;
  role: JwtClaims["role"];
};

export function getBearerTokenFromAuthHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

