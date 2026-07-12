import type {
  GeneratorHealthSnapshot,
  OverloadDuration,
  PowerFactorTrend,
  RulEstimate,
  SpecificFuelConsumption,
  IdleDuration,
} from "@/types/metrics";
import { Card, DividerLabel, MetricTile, statusFromHealth } from "@/app/components/geomine-theme";

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
    <div className="mt-6 space-y-5">
      <Card>
        <DividerLabel>Latest readings</DividerLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricTile label="Fuel level" value={fmt(snapshot.latest_fuel_level, " L")} />
          <MetricTile label="Engine hours" value={fmt(snapshot.latest_engine_hours, " hr")} />
          <MetricTile label="Coolant temp" value={fmt(snapshot.latest_coolant_temp, "°C")} />
          <MetricTile
            label="Open faults"
            value={snapshot.open_fault_count}
            tone={snapshot.open_fault_count > 0 ? "red" : "green"}
          />
        </div>
      </Card>

      <Card>
        <DividerLabel>Calculated — physics</DividerLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricTile label="Loading" value={fmt(snapshot.loading_pct, "%")} tone="cyan" />
          <MetricTile label="Apparent power" value={fmt(snapshot.apparent_power_kva, " kVA")} tone="cyan" />
          <MetricTile label="Real power" value={fmt(snapshot.real_power_kw, " kW")} tone="cyan" />
          <MetricTile label="Frequency" value={fmt(snapshot.frequency_hz, " Hz")} tone="cyan" />
          <MetricTile
            label="Fuel efficiency"
            value={fuelConsumption?.l_per_kwh ? `${fuelConsumption.l_per_kwh} L/kWh` : "—"}
            hint={fuelConsumption && fuelConsumption.note !== "ok" ? fuelConsumption.note : undefined}
          />
        </div>
      </Card>

      <Card>
        <DividerLabel>Heuristic — pending calibration</DividerLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricTile
            label="Thermal stress"
            value={fmt(snapshot.thermal_stress_index, "%")}
            tone={snapshot.thermal_stress_index && snapshot.thermal_stress_index >= 85 ? "red" : "amber"}
          />
          <MetricTile
            label="Health index"
            value={fmt(snapshot.health_index)}
            tone={statusFromHealth(snapshot.health_index)}
          />
          <MetricTile
            label="Maintenance priority"
            value={fmt(snapshot.maintenance_priority_score)}
            tone={
              snapshot.maintenance_priority_score && snapshot.maintenance_priority_score >= 50
                ? "red"
                : snapshot.maintenance_priority_score && snapshot.maintenance_priority_score >= 25
                  ? "amber"
                  : "green"
            }
          />
          <MetricTile
            label="Overload (30d)"
            value={overload ? `${overload.overload_minutes} min` : "—"}
            hint={overload ? `${overload.sample_count} samples` : undefined}
          />
          <MetricTile
            label="Idle (30d)"
            value={idle ? `${idle.idle_minutes} min` : "—"}
            hint={idle ? `${idle.sample_count} samples` : undefined}
          />
          <MetricTile
            label="PF trend"
            value={pfTrend ? pfTrend.direction.replace("_", " ") : "—"}
            tone={
              pfTrend?.direction === "declining"
                ? "amber"
                : pfTrend?.direction === "improving"
                  ? "green"
                  : "neutral"
            }
            hint={pfTrend ? `${pfTrend.sample_count} samples` : undefined}
          />
        </div>
      </Card>

      {rul && (
        <Card tint="amber">
          <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.5px] text-amber">
            Remaining useful life: not yet available
          </div>
          <p className="mt-1 text-[12.5px] text-ink-dim">{rul.note}</p>
        </Card>
      )}
    </div>
  );
}
