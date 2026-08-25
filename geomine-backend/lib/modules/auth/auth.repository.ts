// Repository layer — raw data access only. No business rules, no auth
// decisions live here, just "get the row(s)". Every other layer in this
// module goes through here rather than calling Supabase directly.

import { query } from "@/lib/db";
import { verifyAccessToken, type JwtClaims } from "@/lib/auth/jwt";
import type { Profile } from "@/types/database";

export type AuthUser = { id: string; role: JwtClaims["role"] };

export function getAuthFromBearerToken(token: string): AuthUser {
  const claims = verifyAccessToken(token);
  return { id: claims.sub, role: claims.role };
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const rows = await query<Profile>(`select * from profiles where id = $1 limit 1`, [id]);
  return rows[0] ?? null;
}

