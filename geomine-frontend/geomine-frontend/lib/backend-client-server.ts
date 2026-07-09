import { createClient } from "@/lib/supabase/server";

// Used from Server Components and the auth callback route only — reads
// the CURRENT USER's session via the frontend's own cookies (same-origin,
// unaffected by the backend split) and forwards it to the separate
// backend as a Bearer token. The backend verifies that token itself; this
// file never talks to Postgres directly.
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error(
    "NEXT_PUBLIC_BACKEND_URL must be set in production. Please configure the frontend environment variable."
  );
}

export async function backendFetchServer(path: string, init?: RequestInit): Promise<Response> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
}

/** Convenience for the common case: fetch and parse JSON, or return a fallback on failure. */
export async function backendGetJson<T>(path: string, fallback: T): Promise<T> {
  const res = await backendFetchServer(path);
  if (!res.ok) return fallback;
  return res.json();
}
