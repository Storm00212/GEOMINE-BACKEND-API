"use client";

import { useEffect, useState } from "react";
import { backendFetchClient } from "@/lib/backend-client-browser";
import type { MaintenanceRecommendation } from "@/types/metrics";

/**
 * Fetches the maintenance recommendation for each machine id in parallel
 * and returns them as a Map keyed by machine id. Returns `null` per
 * machine on error so a single failure doesn't blank the whole dashboard.
 */
export function useFleetRecommendations(
  machineIds: string[]
): { recommendations: Map<string, MaintenanceRecommendation | null>; loading: boolean } {
  const [recs, setRecs] = useState<Map<string, MaintenanceRecommendation | null>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const initial = new Map<string, MaintenanceRecommendation | null>();
    machineIds.forEach((id) => initial.set(id, null));
    setRecs(initial);

    Promise.all(
      machineIds.map(async (id) => {
        try {
          const res = await backendFetchClient(`/api/machines/${id}/recommendation`);
          if (!res.ok) return [id, null] as const;
          const json = (await res.json()) as { recommendation: MaintenanceRecommendation | null };
          return [id, json.recommendation] as const;
        } catch {
          return [id, null] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      const next = new Map<string, MaintenanceRecommendation | null>();
      entries.forEach(([id, r]) => next.set(id, r));
      setRecs(next);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [machineIds.join("|")]);

  return { recommendations: recs, loading };
}
