const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://geomine-backend-api-backend.onrender.com";

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const maybe = await res.json().catch(() => ({}));
    throw new Error(maybe?.error || `Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
}

