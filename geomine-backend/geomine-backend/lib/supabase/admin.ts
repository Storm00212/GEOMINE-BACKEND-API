import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY, service-role key.
// If SUPABASE env vars are not configured (Neon migration), fail lazily
// when/if this code path is called rather than crashing at startup.
export function createAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase env vars missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). " +
        "Admin invite endpoint is not available in Neon-only mode."
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

