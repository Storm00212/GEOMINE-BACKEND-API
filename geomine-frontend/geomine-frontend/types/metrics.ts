// These mirror the types in the backend's lib/modules/metrics/metrics.service.ts
// exactly, since the frontend can no longer import them directly across the
// deployable boundary — it only ever sees these shapes as JSON over HTTP.
// If the backend's shape changes, this file needs a matching update; there's
// no compiler link between the two repos to catch drift automatically.

export interface GeneratorHealthSnapshot {
  machine_id: string;
  name: string;
  status: string;
  phase_type: "single_phase" | "three_phase";
  latest_current: number | null;
  latest_bearing_temp: number | null;
  latest_coolant_temp: number | null;
  latest_power_factor: number | null;
  latest_fuel_level: number | null;
  latest_engine_hours: number | null;
  open_fault_count: number;
  last_reading_at: string | null;
  loading_pct: number | null;
  apparent_power_kva: number | null;
  real_power_kw: number | null;
  frequency_hz: number | null;
  thermal_stress_index: number | null;
  health_index: number | null;
  maintenance_priority_score: number | null;
}

export interface OverloadDuration {
  overload_minutes: number;
  sample_count: number;
}

export interface PowerFactorTrend {
  slope_per_day: number | null;
  direction: "improving" | "declining" | "stable" | "insufficient_data";
  sample_count: number;
}

export interface RulEstimate {
  status: "insufficient_data";
  note: string;
}

export interface SpecificFuelConsumption {
  liters_consumed: number | null;
  kwh_generated: number | null;
  l_per_kwh: number | null;
  note: string;
}

export interface IdleDuration {
  idle_minutes: number;
  sample_count: number;
}

export interface MaintenanceRecommendation {
  status: "healthy" | "watch" | "needs_maintenance" | "insufficient_data";
  confidence: "high" | "medium" | "low";
  reasons: string[];
  sample_count: number;
  avg_interval_hours: number | null;
}
