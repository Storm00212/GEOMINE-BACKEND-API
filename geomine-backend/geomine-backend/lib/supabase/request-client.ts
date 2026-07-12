import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

// Replaces the old cookie-based server client. Since this backend is a
// separate deployable from the frontend, it can't read the frontend's
// session cookie (cookies are scoped to the domain that set them) — so
// auth here is a Bearer token instead, read straight off the incoming
// request. `headers()` works here the same way `cookies()` did in the
// single-app version: Next.js ties it to the current request via async
// local storage, so it's safe to call from deep inside module functions,
// not just directly in the route handler.
//
// The returned client is scoped to whichever user's token was sent, so
// every Supabase call made through it is subject to that user's RLS
// policies — same security model as before, just carried differently.
export function createClient() {
  // Neon migration: this legacy Supabase request client should not hard-crash
  // the server if Supabase env vars are missing. Fail only when the legacy
  // code path is invoked.
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing (SUPABASE_URL / SUPABASE_ANON_KEY). " +
        "Legacy Supabase data access is not available in Neon-only mode."
    );
  }

  const authHeader = headers().get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  return createSupabaseClient(url, anonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

