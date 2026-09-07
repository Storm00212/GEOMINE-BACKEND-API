"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBackendData } from "@/lib/use-backend-data";
import { useFleetRecommendations } from "@/lib/use-fleet-recommendations";
import type { Machine } from "@/types/database";
import type { GeneratorHealthSnapshot } from "@/types/metrics";
import {
  AppShell,
  Card,
  StatCard,
  DividerLabel,
  SectionTitle,
  ListRow,
  FleetRow,
  Skeleton,
  CountUp,
  Chip,
  Spinner,
} from "@/app/components/geomine-theme";
import { statusFromHealth } from "@/app/components/theme-utils";
import {
  RecommendationBanner,
  LoadingGauges,
  BearingTempStrip,
  HealthSparklineStrip,
  FleetFilterChips,
  type FleetFilter,
} from "@/app/components/dashboard-cards";

interface Reading {
  id: string;
  value: string;
  recorded_at: string;
  flagged: boolean;
  machine_id: string;
  machine_name: string;
  parameter_id: string;
  label: string;
  unit: string | null;
}

interface DashboardData {
  machines: Machine[];
  recentReadings: Reading[];
  flaggedReadings: Reading[];
  fleetSnapshot: GeneratorHealthSnapshot[];
}

type Range = 7 | 30 | 60;

function relTime(iso: string | null) {
  if (!iso) return "No readings yet";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 60) return `last reading ${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `last reading ${hr}h ago`;
  return `last reading ${Math.round(hr / 24)}d ago`;
}

function fmtPct(v: number | null) {
  return v === null || v === undefined ? "—" : `${v}%`;
}

export default function DashboardPage() {
  const [range, setRange] = useState<Range>(60);
  const [filter, setFilter] = useState<FleetFilter>("all");
  const { data, loading, refetch } = useBackendData<DashboardData>("/api/dashboard", {
    machines: [],
    recentReadings: [],
    flaggedReadings: [],
    fleetSnapshot: [],
  });
  const { machines, recentReadings, flaggedReadings, fleetSnapshot } = data;
  const machineIds = useMemo(() => machines.map((m) => m.id), [machines]);
  const { recommendations, loading: recsLoading } = useFleetRecommendations(machineIds);

  // Apply time-range to the recent/flagged readings (the snapshot metrics
  // already use the full history on the backend).
  const cutoff = useMemo(() => {
    if (range === 60) return 0;
    return Date.now() - range * 24 * 60 * 60 * 1000;
  }, [range]);

  const recentInRange = useMemo(
    () => recentReadings.filter((r) => new Date(r.recorded_at).getTime() >= cutoff),
    [recentReadings, cutoff]
  );
  const flaggedInRange = useMemo(
    () => flaggedReadings.filter((r) => new Date(r.recorded_at).getTime() >= cutoff),
    [flaggedReadings, cutoff]
  );

  // Group flagged readings by machine for D.
  const flaggedByMachine = useMemo(() => {
    const m = new Map<string, { machine: Machine | undefined; readings: Reading[] }>();
    flaggedInRange.forEach((r) => {
      if (!m.has(r.machine_id)) {
        m.set(r.machine_id, { machine: machines.find((x) => x.id === r.machine_id), readings: [] });
      }
      m.get(r.machine_id)!.readings.push(r);
    });
    return [...m.entries()].sort((a, b) => b[1].readings.length - a[1].readings.length);
  }, [flaggedInRange, machines]);

  // Filter chips counts.
  const filterCounts = useMemo(() => {
    const out: Record<FleetFilter, number> = { all: fleetSnapshot.length, needs_maintenance: 0, watch: 0, healthy: 0 };
    for (const s of fleetSnapshot) {
      const r = recommendations.get(s.machine_id);
      if (!r) {
        out.watch += 1;
        continue;
      }
      if (r.status === "needs_maintenance") out.needs_maintenance += 1;
      else if (r.status === "watch") out.watch += 1;
      else if (r.status === "healthy") out.healthy += 1;
      else out.watch += 1; // insufficient_data falls into watch bucket
    }
    return out;
  }, [fleetSnapshot, recommendations]);

  const filteredFleet = useMemo(() => {
    if (filter === "all") return fleetSnapshot;
    return fleetSnapshot.filter((s) => {
      const r = recommendations.get(s.machine_id);
      const status = r?.status ?? "insufficient_data";
      if (filter === "needs_maintenance") return status === "needs_maintenance";
      if (filter === "watch") return status === "watch" || status === "insufficient_data";
      if (filter === "healthy") return status === "healthy";
      return true;
    });
  }, [filter, fleetSnapshot, recommendations]);

  const sites = new Set(machines.map((m) => m.location).filter(Boolean)).size;
  const avgHealth =
    fleetSnapshot.length > 0
      ? Math.round(
          fleetSnapshot.reduce((s, m) => s + (m.health_index ?? 0), 0) / fleetSnapshot.length
        )
      : null;

  return (
    <AppShell active="dashboard">
      {/* Header row: title + range + refresh */}
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[19px] font-semibold">Fleet overview</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-line bg-panel p-0.5">
            {([7, 30, 60] as Range[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRange(d)}
                className={
                  "rounded-[5px] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.5px] transition " +
                  (range === d
                    ? "bg-cyan text-[#0D2B30]"
                    : "text-ink-dim hover:text-ink")
                }
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.5px] text-ink-dim transition hover:border-line-soft hover:text-ink disabled:opacity-50"
            aria-label="Refresh"
          >
            {loading ? <Spinner size={12} /> : (
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 6a4 4 0 0 1 7.5-2M10 6a4 4 0 0 1-7.5 2" />
                <path d="M9.5 1.5v3h-3M2.5 10.5v-3h3" />
              </svg>
            )}
            refresh
          </button>
          <Link href="/reports" className="text-[12.5px] text-cyan hover:underline">
            Export →
          </Link>
        </div>
      </div>
      <p className="mb-5 mt-1 text-[13px] text-ink-dim">
        {loading ? (
          <Skeleton className="inline-block h-3 w-64 align-middle" />
        ) : (
          <>
            <CountUp value={machines.length} className="text-ink" /> generators
            {sites > 0 ? ` across ${sites} site${sites > 1 ? "s" : ""}` : ""}
            {avgHealth !== null ? <> · avg health <span className="text-ink">{avgHealth}</span></> : ""}
            {loading ? "" : <> · last {range} days</>}
          </>
        )}
      </p>

      {/* C1: Recommendation banner */}
      <RecommendationBanner
        machines={machines}
        recommendations={recommendations}
        loading={loading || recsLoading}
      />

      {/* C2: Fleet loading gauge cluster */}
      <LoadingGauges fleet={fleetSnapshot} loading={loading} />

      {/* C3: Bearing-temp heat strip */}
      <BearingTempStrip fleet={fleetSnapshot} loading={loading} />

      {/* C4: Health sparkline strip (placeholder for trend; will improve later) */}
      <HealthSparklineStrip fleet={fleetSnapshot} loading={loading} />

      {/* Stat row (with count-up) */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Generators"
          value={loading ? "—" : <CountUp value={machines.length} />}
        />
        <StatCard
          label={`Readings (${range}d)`}
          value={loading ? "—" : <CountUp value={recentInRange.length} />}
        />
        <StatCard
          label={`Flagged (${range}d)`}
          value={loading ? "—" : <CountUp value={flaggedInRange.length} />}
          tone={flaggedInRange.length > 0 ? "amber" : "neutral"}
        />
      </div>

      {/* D1: Filter chips + fleet list */}
      <DividerLabel>Generator health · sorted by maintenance priority</DividerLabel>
      <FleetFilterChips value={filter} onChange={setFilter} counts={filterCounts} />
      <Card>
        {loading && fleetSnapshot.length === 0 ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : filteredFleet.length === 0 ? (
          <p className="px-2 py-6 text-[13px] text-ink-faint">
            No generators in this filter.
          </p>
        ) : (
          [...filteredFleet]
            .sort((a, b) => (b.maintenance_priority_score ?? 0) - (a.maintenance_priority_score ?? 0))
            .map((s) => {
              const status = statusFromHealth(s.health_index);
              const loc = machines.find((m) => m.id === s.machine_id)?.location;
              const r = recommendations.get(s.machine_id);
              return (
                <FleetRow
                  key={s.machine_id}
                  href={`/machines/${s.machine_id}`}
                  name={s.name}
                  sub={`${loc ?? "Site"} — ${relTime(s.last_reading_at)}${r && r.status !== "healthy" ? ` · ${r.status.replace("_", " ")}` : ""}`}
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
            })
        )}
      </Card>

      {/* D2: Grouped flagged readings (click-through) */}
      {flaggedByMachine.length > 0 && (
        <>
          <SectionTitle hint={`${flaggedInRange.length} flagged in last ${range}d`}>
            Out-of-range readings
          </SectionTitle>
          <div className="space-y-3">
            {flaggedByMachine.map(([machineId, group]) => (
              <Card key={machineId} tint="red" className="!p-0">
                <Link
                  href={`/machines/${machineId}`}
                  className="flex items-center justify-between border-b border-line-soft px-4 py-2.5 text-[12.5px] hover:bg-red/5"
                >
                  <span className="font-medium text-ink">
                    {group.machine?.name ?? "Unknown"}
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-[1px] text-ink-faint">
                      {group.machine?.location ?? ""}
                    </span>
                  </span>
                  <span className="font-mono text-[10.5px] text-red">
                    {group.readings.length} flagged →
                  </span>
                </Link>
                {group.readings.map((r) => (
                  <ListRow key={r.id} tint="red">
                    <span className="min-w-0">
                      {r.label}:{" "}
                      <span className="font-mono">{r.value} {r.unit ?? ""}</span>
                    </span>
                    <span className="ml-3 shrink-0 font-mono text-[11px] text-ink-faint">
                      {new Date(r.recorded_at).toLocaleDateString()}
                    </span>
                  </ListRow>
                ))}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Recent readings list */}
      <SectionTitle hint={`${recentInRange.length} recent`}>Recent readings</SectionTitle>
      <Card>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-7" />
            ))}
          </div>
        ) : recentInRange.length === 0 ? (
          <p className="px-2 py-4 text-[13px] text-ink-faint">No readings in this range.</p>
        ) : (
          recentInRange.slice(0, 15).map((r) => (
            <ListRow key={r.id}>
              <span className="min-w-0">
                <span className="font-medium text-ink">{r.machine_name}</span> —{" "}
                {r.label}:{" "}
                <span className="font-mono">{r.value} {r.unit ?? ""}</span>
              </span>
              <span className="ml-3 shrink-0 font-mono text-[11px] text-ink-faint">
                {new Date(r.recorded_at).toLocaleDateString()}
              </span>
            </ListRow>
          ))
        )}
      </Card>
    </AppShell>
  );
}
