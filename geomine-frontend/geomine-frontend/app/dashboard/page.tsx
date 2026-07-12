import { backendGetJson } from "@/lib/backend-client-server";
import type { Machine } from "@/types/database";
import type { GeneratorHealthSnapshot } from "@/types/metrics";
import Link from "next/link";
import {
  AppShell,
  Card,
  StatCard,
  DividerLabel,
  SectionTitle,
  ListRow,
  FleetRow,
} from "@/app/components/geomine-theme";
import { statusFromHealth } from "@/app/components/theme-utils";

interface DashboardData {
  machines: Machine[];
  recentReadings: any[];
  flaggedReadings: any[];
  fleetSnapshot: GeneratorHealthSnapshot[];
}

function relTime(iso: string | null) {
  if (!iso) return "No readings yet";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 60) return `last reading ${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `last reading ${hr}h ago`;
  return `last reading ${Math.round(hr / 24)}d ago`;
}

export default async function DashboardPage() {
  const { machines, recentReadings, flaggedReadings, fleetSnapshot } =
    await backendGetJson<DashboardData>("/api/dashboard", {
      machines: [],
      recentReadings: [],
      flaggedReadings: [],
      fleetSnapshot: [],
    });

  const sites = new Set(machines.map((m) => m.location).filter(Boolean)).size;
  const sortedFleet = [...fleetSnapshot].sort(
    (a, b) => (b.maintenance_priority_score ?? 0) - (a.maintenance_priority_score ?? 0)
  );
  const avgHealth =
    fleetSnapshot.length > 0
      ? Math.round(
          fleetSnapshot.reduce((s, m) => s + (m.health_index ?? 0), 0) / fleetSnapshot.length
        )
      : null;

  return (
    <AppShell active="dashboard">
      <div className="flex items-baseline justify-between">
        <h1 className="text-[19px] font-semibold">Fleet overview</h1>
        <Link href="/reports" className="text-[12.5px] text-cyan hover:underline">
          Export data →
        </Link>
      </div>
      <p className="mb-6 mt-1 text-[13px] text-ink-dim">
        {machines.length} generators
        {sites > 0 ? ` across ${sites} site${sites > 1 ? "s" : ""}` : ""}
        {avgHealth !== null ? ` · avg health ${avgHealth}` : ""}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Generators" value={machines.length} />
        <StatCard label="Readings (recent)" value={recentReadings.length} />
        <StatCard
          label="Flagged (out of range)"
          value={flaggedReadings.length}
          tone={flaggedReadings.length > 0 ? "amber" : "neutral"}
        />
      </div>

      <DividerLabel>Generator health · sorted by maintenance priority</DividerLabel>
      <Card>
        {sortedFleet.map((s) => {
          const status = statusFromHealth(s.health_index);
          const loc = machines.find((m) => m.id === s.machine_id)?.location;
          return (
            <FleetRow
              key={s.machine_id}
              href={`/machines/${s.machine_id}`}
              name={s.name}
              sub={`${loc ?? "Site"} — ${relTime(s.last_reading_at)}`}
              status={status}
              metrics={[
                { label: "LOADING", value: fmtPct(s.loading_pct) },
                {
                  label: "HEALTH",
                  value: s.health_index ?? "—",
                  tone: status,
                },
                { label: "PRIORITY", value: s.maintenance_priority_score ?? "—" },
              ]}
            />
          );
        })}
        {sortedFleet.length === 0 && (
          <p className="px-2 py-6 text-[13px] text-ink-faint">No generators added yet.</p>
        )}
      </Card>

      {flaggedReadings.length > 0 && (
        <SectionTitle hint={`${flaggedReadings.length} flagged`}>Out-of-range readings</SectionTitle>
      )}
      {flaggedReadings.length > 0 && (
        <Card tint="red">
          {flaggedReadings.map((r: any) => (
            <ListRow key={r.id} tint="red">
              <span className="min-w-0">
                <span className="font-medium text-ink">{r.machines?.name}</span> —{" "}
                {r.parameter_definitions?.label}:{" "}
                <span className="font-mono">{r.value} {r.parameter_definitions?.unit}</span>
              </span>
              <span className="ml-3 shrink-0 font-mono text-[11px] text-ink-faint">
                {new Date(r.recorded_at).toLocaleDateString()}
              </span>
            </ListRow>
          ))}
        </Card>
      )}

      <SectionTitle hint={`${recentReadings.length} recent`}>Recent readings</SectionTitle>
      <Card>
        {recentReadings.map((r: any) => (
          <ListRow key={r.id}>
            <span className="min-w-0">
              <span className="font-medium text-ink">{r.machines?.name}</span> —{" "}
              {r.parameter_definitions?.label}:{" "}
              <span className="font-mono">{r.value} {r.parameter_definitions?.unit}</span>
            </span>
            <span className="ml-3 shrink-0 font-mono text-[11px] text-ink-faint">
              {new Date(r.recorded_at).toLocaleDateString()}
            </span>
          </ListRow>
        ))}
        {recentReadings.length === 0 && (
          <p className="px-2 py-4 text-[13px] text-ink-faint">No readings logged yet.</p>
        )}
      </Card>
    </AppShell>
  );
}

function fmtPct(v: number | null) {
  return v === null || v === undefined ? "—" : `${v}%`;
}
