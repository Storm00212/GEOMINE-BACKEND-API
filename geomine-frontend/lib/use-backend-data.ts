"use client";

import { useCallback, useEffect, useState } from "react";
import { backendFetchClient } from "@/lib/backend-client-browser";

/**
 * Fetches from the backend with the Bearer token attached (Client Component
 * only — see backend-client-browser.ts). Server Components can't read the
 * token from localStorage, so any page rendering authenticated data has to
 * fetch it this way instead of at request time on the server.
 */
export function useBackendData<T>(
  path: string,
  fallback: T
): { data: T; loading: boolean; refetch: () => void } {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    backendFetchClient(path)
      .then((res) => (res.ok ? res.json() : fallback))
      .catch(() => fallback)
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, refetch };
}
