import type {
  GeneratorHealthSnapshot,
  OverloadDuration,
  PowerFactorTrend,
  RulEstimate,
  SpecificFuelConsumption,
  IdleDuration,
} from "@/types/metrics";

function fmt(v: number | null | undefined, unit = "") {
  return v === null || v === undefined ? "—" : `${v}${unit}`;
}

export default function MetricsPanel({
  snapshot,
  overload,
  pfTrend,
  rul,
  fuelConsumption,
  idle,
}: {
  snapshot: GeneratorHealthSnapshot;
  overload: OverloadDuration | null;
  pfTrend: PowerFactorTrend | null;
  rul: RulEstimate | null;
  fuelConsumption: SpecificFuelConsumption | null;
  idle: IdleDuration | null;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Latest readings
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Fuel level" value={fmt(snapshot.latest_fuel_level, " L")} />
          <Metric label="Engine hours" value={fmt(snapshot.latest_engine_hours, " hr")} />
          <Metric label="Coolant temp" value={fmt(snapshot.latest_coolant_temp, "°C")} />
          <Metric label="Open faults" value={snapshot.open_fault_count} />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Calculated — physics
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Loading" value={fmt(snapshot.loading_pct, "%")} />
          <Metric label="Apparent power" value={fmt(snapshot.apparent_power_kva, " kVA")} />
          <Metric label="Real power" value={fmt(snapshot.real_power_kw, " kW")} />
          <Metric label="Frequency" value={fmt(snapshot.frequency_hz, " Hz")} />
          <Metric
            label="Fuel efficiency"
            value={fuelConsumption?.l_per_kwh ? `${fuelConsumption.l_per_kwh} L/kWh` : "—"}
            hint={fuelConsumption && fuelConsumption.note !== "ok" ? fuelConsumption.note : undefined}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Heuristic — pending calibration against real operating history
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Thermal stress" value={fmt(snapshot.thermal_stress_index, "%")} />
          <Metric label="Health index" value={fmt(snapshot.health_index)} />
          <Metric label="Maintenance priority" value={fmt(snapshot.maintenance_priority_score)} />
          <Metric
            label="Overload (30d)"
            value={overload ? `${overload.overload_minutes} min` : "—"}
            hint={overload ? `${overload.sample_count} samples` : undefined}
          />
          <Metric
            label="Idle (30d)"
            value={idle ? `${idle.idle_minutes} min` : "—"}
            hint={idle ? `${idle.sample_count} samples` : undefined}
          />
          <Metric
            label="PF trend (proxy for efficiency)"
            value={pfTrend ? pfTrend.direction.replace("_", " ") : "—"}
            hint={pfTrend ? `${pfTrend.sample_count} samples` : undefined}
          />
        </div>
      </div>

      {rul && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <p className="font-medium text-amber-800">Remaining useful life: not yet available</p>
          <p className="mt-1 text-amber-700">{rul.note}</p>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
      {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
    </div>
  );
}
