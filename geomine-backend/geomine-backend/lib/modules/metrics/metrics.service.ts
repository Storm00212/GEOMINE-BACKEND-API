// Service layer — typed wrappers around the repository calls. The actual
// calculations live in Postgres (see the migrations for the formulas and
// which ones are physics vs. heuristic) — this layer just gives the rest of
// the app typed, named functions instead of raw SQL function names and
// untyped rows scattered around.

import * as repo from "./metrics.repository";

export interface ReadingStats {
  mean: number | null;
  volatility: number | null;
  min_value: number | null;
  max_value: number | null;
  reading_count: number;
}

export async function getReadingStats(
  machineId: string,
  parameterId: string,
  from?: string,
  to?: string
): Promise<ReadingStats | null> {
  const data = await repo.callGetReadingStats(machineId, parameterId, from, to);
  return data as ReadingStats | null;
}

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

/** One row per machine — everything the fleet dashboard needs in one query. */
export async function getFleetHealthSnapshot(): Promise<GeneratorHealthSnapshot[]> {
  const data = await repo.selectFleetHealthSnapshot();
  return (data ?? []) as GeneratorHealthSnapshot[];
}

export async function getMachineHealthSnapshot(machineId: string): Promise<GeneratorHealthSnapshot | null> {
  return (await repo.selectMachineHealthSnapshot(machineId)) as GeneratorHealthSnapshot | null;
}

export interface OverloadDuration {
  overload_minutes: number;
  sample_count: number;
}

export async function getOverloadDuration(machineId: string, from?: string, to?: string): Promise<OverloadDuration | null> {
  const data = await repo.callGetOverloadDuration(machineId, from, to);
  return data as OverloadDuration | null;
}

export interface PowerFactorTrend {
  slope_per_day: number | null;
  direction: "improving" | "declining" | "stable" | "insufficient_data";
  sample_count: number;
}

/** Proxy for "efficiency trend" — see migration 0002 for why. */
export async function getPowerFactorTrend(machineId: string, from?: string, to?: string): Promise<PowerFactorTrend | null> {
  const data = await repo.callGetPowerFactorTrend(machineId, from, to);
  return data as PowerFactorTrend | null;
}

export interface RulEstimate {
  status: "insufficient_data";
  note: string;
}

/** Always 'insufficient_data' for now — see migration 0002's comment for why this is intentional. */
export async function getEstimatedRul(machineId: string): Promise<RulEstimate | null> {
  const data = await repo.callGetEstimatedRul(machineId);
  return data as RulEstimate | null;
}

export interface FleetSummaryRow {
  machine_id: string;
  name: string;
  status: string;
  readings_last_7d: number;
  flagged_count: number;
  last_reading_at: string | null;
}

export async function getFleetSummary(): Promise<FleetSummaryRow[]> {
  const data = await repo.selectFleetSummary();
  return (data ?? []) as FleetSummaryRow[];
}

export interface SpecificFuelConsumption {
  liters_consumed: number | null;
  kwh_generated: number | null;
  l_per_kwh: number | null;
  note: string;
}

/** Real efficiency metric (unlike the PF-trend proxy) — see migration 0003 for the refuel-aware math. */
export async function getSpecificFuelConsumption(machineId: string, from?: string, to?: string): Promise<SpecificFuelConsumption | null> {
  const data = await repo.callGetSpecificFuelConsumption(machineId, from, to);
  return data as SpecificFuelConsumption | null;
}

export interface IdleDuration {
  idle_minutes: number;
  sample_count: number;
}

export async function getIdleDuration(machineId: string, from?: string, to?: string): Promise<IdleDuration | null> {
  const data = await repo.callGetIdleDuration(machineId, from, to);
  return data as IdleDuration | null;
}

export interface MaintenanceRecommendation {
  status: "healthy" | "watch" | "needs_maintenance" | "insufficient_data";
  confidence: "high" | "medium" | "low";
  reasons: string[];
  sample_count: number;
  avg_interval_hours: number | null;
}

/**
 * Rule-based and fully explainable — NOT a statistical or ML prediction.
 * See migration 0003's comment for the exact thresholds and why "10
 * readings" means 10 distinct logging visits, not 10 raw rows.
 */
export async function getMaintenanceRecommendation(machineId: string, sampleSize = 10): Promise<MaintenanceRecommendation | null> {
  const data = await repo.callGetMaintenanceRecommendation(machineId, sampleSize);
  return data as MaintenanceRecommendation | null;
}
