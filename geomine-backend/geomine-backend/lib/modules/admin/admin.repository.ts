// Repository layer for admin actions. This is the only repository in the
// app that uses the service-role client (bypasses RLS entirely) rather
// than the request-scoped one — kept isolated here so it's obvious where
// the elevated-privilege boundary is.

import { createAdminClient } from "@/lib/supabase/admin";

export async function inviteUserByEmail(
  email: string,
  metadata: { full_name: string; role: string }
): Promise<{ error: { message: string } | null }> {
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, { data: metadata });
  return { error };
}
