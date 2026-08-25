// Repository layer for admin actions. This backend uses hardcore auth
// (app_users + bcrypt + JWT), not Supabase Auth, so "inviting" a user means
// creating the app_users + profiles rows directly here rather than calling
// Supabase's auth.admin.inviteUserByEmail. A secure temporary password is
// generated and returned so the admin can relay it to the new user.

import { randomUUID } from "crypto";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import type { UserRole } from "@/types/database";

export interface InvitedUser {
  email: string;
  temporaryPassword: string;
}

export async function inviteUserByEmail(
  email: string,
  metadata: { full_name: string; role: UserRole }
): Promise<InvitedUser> {
  const existing = await query<{ id: string }>(
    `select id from app_users where email = $1 limit 1`,
    [email]
  );
  if (existing[0]) {
    throw new Error("Email already in use");
  }

  const userId = randomUUID();
  const temporaryPassword = randomBytes(12).toString("hex");
  const password_hash = await bcrypt.hash(temporaryPassword, 10);

  await query(
    `insert into app_users (id, email, password_hash, role, created_at)
     values ($1, $2, $3, $4, now())`,
    [userId, email, password_hash, metadata.role]
  );

  await query(
    `insert into profiles (id, full_name, role, created_at)
     values ($1, $2, $3, now())
     on conflict (id) do update set full_name = excluded.full_name, role = excluded.role`,
    [userId, metadata.full_name, metadata.role]
  );

  return { email, temporaryPassword };
}
