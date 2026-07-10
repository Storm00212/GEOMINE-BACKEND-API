"use client";

import { createClient } from "@/lib/supabase/client";

// Used from Client Components (the browser). This is a genuine
// cross-origin request — the backend's CORS allowlist and Bearer-token
// auth (not cookies) are what make this work, rather than anything special
// on this end beyond attaching the token.
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://geomine-backend-api-backend.onrender.com";

export async function backendFetchClient(path: string, init?: RequestInit): Promise<Response> {
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
  });
}
