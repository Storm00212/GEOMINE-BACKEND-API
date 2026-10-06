"use client";

import { useBackendData } from "@/lib/use-backend-data";
import type { Machine } from "@/types/database";
import type { GeneratorHealthSnapshot } from "@/types/metrics";
import Link from "next/link";
import {
  AppShell,
  Card,
  DividerLabel,
  SectionTitle,
  FleetRow,
} from "@/app/components/geomine-theme";
import { statusFromHealth } from "@/app/components/theme-utils";

interface MachinesData {
  machines: Machine[];
  fleetSnapshot: GeneratorHealthSnapshot[];
}

interface CurrentUserData {
  profile: { role: string } | null;
}

export default function MachinesPage() {
  const { data, loading } = useBackendData<MachinesData>("/api/dashboard", {
    machines: [],
    fleetSnapshot: [],
  });
  const { data: currentUser } = useBackendData<CurrentUserData>("/api/auth/me", {
    profile: null,
  });
  const { machines, fleetSnapshot } = data;

  if (loading) {
    return (
      <AppShell active="machines">
        <p className="px-2 py-6 text-[13px] text-ink-faint">Loading…</p>
      </AppShell>
    );
  }

  const snapById = new Map(fleetSnapshot.map((s) => [s.machine_id, s]));

  const sorted = [...machines].sort((a, b) => {
    const pa = snapById.get(a.id)?.maintenance_priority_score ?? 0;
    const pb = snapById.get(b.id)?.maintenance_priority_score ?? 0;
    return pb - pa;
  });

  return (
    <AppShell active="machines">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[19px] font-semibold">Generators</h1>
          <p className="mt-1 text-[13px] text-ink-dim">
            {machines.length} unit{machines.length === 1 ? "" : "s"} in the fleet Â· sorted by
            maintenance priority.
          </p>
        </div>
        {currentUser.profile?.role === "admin" && (
          <Link
            href="/machines/new"
            className="inline-flex items-center gap-2 rounded-md bg-cyan px-3.5 py-2 text-[12.5px] font-semibold text-button-ink transition hover:opacity-90"
          >
            <span aria-hidden="true" className="text-base leading-none">+</span>
            Add generator
          </Link>
        )}
      </div>

      <DividerLabel>Fleet</DividerLabel>
      <Card>
        {sorted.map((m) => {
          const snap = snapById.get(m.id);
          const status = statusFromHealth(snap?.health_index);
          return (
            <FleetRow
              key={m.id}
              href={`/machines/${m.id}`}
              name={m.name}
              sub={`${m.location ?? "Site"} Â· ${m.status}`}
              status={status}
              metrics={[
                { label: "LOADING", value: snap?.loading_pct != null ? `${snap.loading_pct}%` : "â€”" },
                {
                  label: "HEALTH",
                  value: snap?.health_index ?? "â€”",
                  tone: status,
                },
                { label: "PRIORITY", value: snap?.maintenance_priority_score ?? "â€”" },
              ]}
            />
          );
        })}
        {sorted.length === 0 && (
          <p className="px-2 py-6 text-[13px] text-ink-faint">No generators added yet.</p>
        )}
      </Card>

      <SectionTitle hint="quick links">Actions</SectionTitle>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/entry"
          className="rounded-md border border-line bg-panel-alt px-4 py-2 text-[13px] font-medium text-ink-dim transition hover:text-ink"
        >
          + Log a reading
        </Link>
        <Link
          href="/reports"
          className="rounded-md border border-line bg-panel-alt px-4 py-2 text-[13px] font-medium text-ink-dim transition hover:text-ink"
        >
          Export data â†’
        </Link>
      </div>
    </AppShell>
  );
}

