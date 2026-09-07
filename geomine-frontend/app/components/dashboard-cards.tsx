"use client";

import React, { useEffect, useState } from "react";
import { HealthGauge, Skeleton, Card, Chip } from "@/app/components/geomine-theme";
import type { GeneratorHealthSnapshot, MaintenanceRecommendation } from "@/types/metrics";
import type { Machine } from "@/types/database";

function numericOrNull(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

/* ------------------------------------------------------------------ */
/* Recommendation banner                                               */
/* ------------------------------------------------------------------ */

export function RecommendationBanner({
  machines,
  recommendations,
  loading,
}: {
  machines: Machine[];
  recommendations: Map<string, MaintenanceRecommendation | null>;
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="mb-5 h-[72px]" />;
  }

  const flagged: { machine: Machine; rec: MaintenanceRecommendation }[] = [];
  for (const m of machines) {
    const r = recommendations.get(m.id);
    if (r && (r.status === "needs_maintenance" || r.status === "watch")) {
      flagged.push({ machine: m, rec: r });
    }
  }
  if (flagged.length === 0) return null;

  const top = flagged.sort((a, b) => {
    const score = (r: MaintenanceRecommendation) =>
      r.status === "needs_maintenance" ? 2 : r.status === "watch" ? 1 : 0;
    return score(b.rec) - score(a.rec);
  })[0];
  const { machine, rec } = top;
  const isCritical = rec.status === "needs_maintenance";

  return (
    <div
      className={
        "mb-5 flex items-start gap-3 rounded-lg border p-3.5 " +
        (isCritical
          ? "border-red/60 bg-red-dim/60"
          : "border-amber/60 bg-amber-dim/40")
      }
    >
      <div
        className={
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-bold " +
          (isCritical ? "bg-red text-[#0D2B30]" : "bg-amber text-[#0D2B30]")
        }
        aria-hidden
      >
        !
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[13.5px] font-semibold text-ink">
            {machine.name}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[1px] text-ink-faint">
            {machine.location ?? "—"}
          </span>
          <span
            className={
              "rounded-full border px-1.5 py-[1px] font-mono text-[9.5px] uppercase tracking-[0.6px] " +
              (isCritical
                ? "border-red/70 text-red"
                : "border-amber/70 text-amber")
            }
          >
            {isCritical ? "needs maintenance" : "watch"}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[1px] text-ink-faint">
            confidence: {rec.confidence}
          </span>
        </div>
        <p className="mt-1 text-[12.5px] text-ink-dim">
          {rec.reasons[0] ?? "Anomaly detected in recent readings."}
          {flagged.length > 1 && (
            <>
              {" "}
              <span className="text-ink-faint">
                + {flagged.length - 1} more{" "}
                {flagged.length - 1 === 1 ? "machine" : "machines"} need attention.
              </span>
            </>
          )}
        </p>
      </div>
      <a
        href={`/machines/${machine.id}`}
        className={
          "shrink-0 rounded-md border px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.6px] transition " +
          (isCritical
            ? "border-red/60 text-red hover:bg-red/10"
            : "border-amber/60 text-amber hover:bg-amber/10")
        }
      >
        view details →
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fleet loading gauge cluster                                        */
/* ------------------------------------------------------------------ */

export function LoadingGauges({
  fleet,
  loading,
}: {
  fleet: GeneratorHealthSnapshot[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[120px]" />
        ))}
      </div>
    );
  }
  if (fleet.length === 0) return null;

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {fleet.map((s) => {
        const loadingPct = s.loading_pct;
        const tone = loadingPct === null
          ? "neutral"
          : loadingPct > 90
            ? "red"
            : loadingPct > 75
              ? "amber"
              : "green";
        const toneText =
          tone === "red"
            ? "text-red"
            : tone === "amber"
              ? "text-amber"
              : tone === "green"
                ? "text-green"
                : "text-ink-dim";
        return (
          <Card key={s.machine_id} className="!p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-medium text-ink">
                  {s.name}
                </div>
                <div className="font-mono text-[9.5px] uppercase tracking-[1px] text-ink-faint">
                  loading
                </div>
              </div>
              <HealthGauge value={loadingPct} size={56} />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className={"font-mono text-[20px] font-semibold " + toneText}>
                {loadingPct === null || loadingPct === undefined ? "—" : `${loadingPct}%`}
              </span>
              <span className="font-mono text-[10px] text-ink-faint">
                {s.latest_current ?? "—"} A
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bearing temperature heat strip                                     */
/* ------------------------------------------------------------------ */

/**
 * Each machine gets a thin horizontal bar whose fill color is interpolated
 * from a temperature reading. Normal: 45-65 °C, watch: 65-80, critical: 80+.
 * The label on the right shows the current value. Makes a problematic
 * generator jump out visually even before you read the numbers.
 */
export function BearingTempStrip({
  fleet,
  loading,
}: {
  fleet: GeneratorHealthSnapshot[];
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="mb-5 h-[88px]" />;
  }
  if (fleet.length === 0) return null;

  function tempTone(t: number | null): { bar: string; text: string; tone: "green" | "amber" | "red" | "neutral" } {
    if (t === null || t === undefined) return { bar: "bg-line", text: "text-ink-faint", tone: "neutral" };
    if (t < 65) return { bar: "bg-green", text: "text-green", tone: "green" };
    if (t < 80) return { bar: "bg-amber", text: "text-amber", tone: "amber" };
    return { bar: "bg-red", text: "text-red", tone: "red" };
  }

  // Map temp 45-100°C to 0-100% bar fill.
  function tempPct(t: number | null): number {
    if (t === null || t === undefined) return 0;
    const clamped = Math.max(45, Math.min(100, t));
    return ((clamped - 45) / (100 - 45)) * 100;
  }

  return (
    <Card className="mb-5 !p-3.5">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="font-mono text-[10.5px] uppercase tracking-[1px] text-ink-faint">
          bearing / stator temperature
        </div>
        <div className="font-mono text-[9.5px] text-ink-faint">
          <span className="mr-3"><span className="inline-block h-1.5 w-3 align-middle bg-green" /> &lt;65°C</span>
          <span className="mr-3"><span className="inline-block h-1.5 w-3 align-middle bg-amber" /> 65–80</span>
          <span><span className="inline-block h-1.5 w-3 align-middle bg-red" /> &gt;80</span>
        </div>
      </div>
      <div className="space-y-2">
        {fleet.map((s) => {
          const t = numericOrNull(s.latest_bearing_temp);
          const { bar, text, tone } = tempTone(t);
          const pct = tempPct(t);
          return (
            <div key={s.machine_id} className="flex items-center gap-3">
              <div className="w-[120px] shrink-0 truncate text-[12px] text-ink-dim">
                {s.name}
              </div>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-panel-alt">
                <div
                  className={"absolute inset-y-0 left-0 rounded-full transition-all " + bar}
                  style={{ width: pct + "%" }}
                />
              </div>
              <div className={"w-[58px] shrink-0 text-right font-mono text-[12px] " + text}>
                {t === null || t === undefined ? "—" : `${t.toFixed(1)}°C`}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Filter chips                                                       */
/* ------------------------------------------------------------------ */

export type FleetFilter = "all" | "needs_maintenance" | "watch" | "healthy";

export function FleetFilterChips({
  value,
  onChange,
  counts,
}: {
  value: FleetFilter;
  onChange: (v: FleetFilter) => void;
  counts: Record<FleetFilter, number>;
}) {
  const items: { key: FleetFilter; label: string; tone: "neutral" | "red" | "amber" | "green" }[] = [
    { key: "all", label: `All (${counts.all})`, tone: "neutral" },
    { key: "needs_maintenance", label: `Needs maintenance (${counts.needs_maintenance})`, tone: "red" },
    { key: "watch", label: `Watch (${counts.watch})`, tone: "amber" },
    { key: "healthy", label: `Healthy (${counts.healthy})`, tone: "green" },
  ];
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="mr-1 font-mono text-[10.5px] uppercase tracking-[1px] text-ink-faint">
        filter
      </div>
      {items.map((i) => (
        <Chip
          key={i.key}
          active={value === i.key}
          onClick={() => onChange(i.key)}
          tone={i.tone}
        >
          {i.label}
        </Chip>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fleet health trend sparkline (derived from current snapshot only)  */
/*                                                                     */
/* We don't have a per-machine historical endpoint yet, so this is a   */
/* thin placeholder that plots the four machine health_index points.   */
/* It will look much better once we add a fleet-trend endpoint.        */
/* ------------------------------------------------------------------ */

export function HealthSparklineStrip({
  fleet,
  loading,
}: {
  fleet: GeneratorHealthSnapshot[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[72px]" />
        ))}
      </div>
    );
  }
  if (fleet.length === 0) return null;

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {fleet.map((s) => {
        const v = s.health_index ?? 0;
        const tone = v >= 80 ? "text-green" : v >= 55 ? "text-amber" : "text-red";
        return (
          <Card key={s.machine_id} className="!p-3">
            <div className="flex items-baseline justify-between">
              <div className="min-w-0 truncate text-[12.5px] font-medium text-ink">
                {s.name}
              </div>
              <div className={"font-mono text-[18px] font-semibold " + tone}>
                {s.health_index === null || s.health_index === undefined ? "—" : Math.round(s.health_index)}
              </div>
            </div>
            <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[1px] text-ink-faint">
              health index
            </div>
          </Card>
        );
      })}
    </div>
  );
}
