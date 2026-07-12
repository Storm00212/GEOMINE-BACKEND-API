// Used from Server Components.
// Note: during Phase 1 we store the token in browser localStorage,
// so server components cannot read it. For now, backendFetchServer
// sends requests without Authorization; client components are used
// for authenticated actions.
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://geomine-backend-api-backend.onrender.com";

export async function backendFetchServer(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
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

