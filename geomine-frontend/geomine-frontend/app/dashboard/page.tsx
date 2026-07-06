import { backendGetJson } from "@/lib/backend-client-server";
import type { Machine } from "@/types/database";
import type { GeneratorHealthSnapshot } from "@/types/metrics";
import Link from "next/link";

interface DashboardData {
  machines: Machine[];
  recentReadings: any[];
  flaggedReadings: any[];
  fleetSnapshot: GeneratorHealthSnapshot[];
}

export default async function DashboardPage() {
  const { machines, recentReadings, flaggedReadings, fleetSnapshot } =
    await backendGetJson<DashboardData>("/api/dashboard", {
      machines: [],
      recentReadings: [],
      flaggedReadings: [],
      fleetSnapshot: [],
    });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Fleet overview</h1>
        <Link href="/reports" className="text-sm text-gray-600 underline">
          Export data →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Generators" value={String(machines.length)} />
        <StatCard label="Readings (recent)" value={String(recentReadings.length)} />
        <StatCard label="Flagged (out of range)" value={String(flaggedReadings.length)} tone="warn" />
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Generator health</h2>
          <p className="text-xs text-gray-400">Sorted by maintenance priority</p>
        </div>
        <div className="mt-2 divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
          {fleetSnapshot.map((s) => (
            <Link
              key={s.machine_id}
              href={`/machines/${s.machine_id}`}
              className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50"
            >
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-gray-400">
                  {s.last_reading_at
                    ? `Last reading ${new Date(s.last_reading_at).toLocaleDateString()}`
                    : "No readings yet"}
                </p>
              </div>
              <div className="flex gap-4 text-right">
                <MiniMetric label="Loading" value={fmtPct(s.loading_pct)} />
                <MiniMetric label="Health" value={fmtScore(s.health_index)} />
                <MiniMetric label="Priority" value={s.maintenance_priority_score ?? "—"} />
              </div>
            </Link>
          ))}
          {fleetSnapshot.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-400">No generators added yet.</p>
          )}
        </div>
      </section>

      {flaggedReadings.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-red-600">Out-of-range readings</h2>
          <div className="mt-2 divide-y divide-gray-200 rounded-md border border-red-200 bg-red-50">
            {flaggedReadings.map((r: any) => (
              <div key={r.id} className="px-4 py-2 text-sm">
                <span className="font-medium">{r.machines?.name}</span> —{" "}
                {r.parameter_definitions?.label}: {r.value} {r.parameter_definitions?.unit}{" "}
                <span className="text-xs text-gray-400">
                  ({new Date(r.recorded_at).toLocaleString()})
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-gray-700">Recent readings</h2>
        <div className="mt-2 divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
          {recentReadings.map((r: any) => (
            <div key={r.id} className="px-4 py-2 text-sm">
              <span className="font-medium">{r.machines?.name}</span> —{" "}
              {r.parameter_definitions?.label}: {r.value} {r.parameter_definitions?.unit}{" "}
              <span className="text-xs text-gray-400">
                ({new Date(r.recorded_at).toLocaleString()})
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone === "warn" ? "text-red-600" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function fmtPct(v: number | null) {
  return v === null || v === undefined ? "—" : `${v}%`;
}

function fmtScore(v: number | null) {
  return v === null || v === undefined ? "—" : v;
}
