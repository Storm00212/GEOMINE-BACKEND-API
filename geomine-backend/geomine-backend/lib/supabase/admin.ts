import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY, service-role key. Used for privileged actions like
// admin.inviteUserByEmail() that need to bypass RLS.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
