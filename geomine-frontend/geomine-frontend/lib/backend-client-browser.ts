"use client";

import { getAccessToken } from "@/lib/auth/token-storage";

// Used from Client Components (the browser). This is a genuine
// cross-origin request — the backend's CORS allowlist and Bearer-token
// auth are what make this work.
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://geomine-backend-api-backend.onrender.com";

export async function backendFetchClient(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  headers.set("Content-Type", "application/json");

  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
  });
}

