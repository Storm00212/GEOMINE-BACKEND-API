// Repository layer — raw calls to the SQL functions/views from migrations
// 0002/0003. No shaping beyond what Supabase returns; typing and any
// defaults live in the service layer.

import { createClient } from "@/lib/supabase/request-client";

export async function callGetReadingStats(machineId: string, parameterId: string, from?: string, to?: string) {
  const supabase = createClient();
  return supabase
    .rpc("get_reading_stats", { p_machine_id: machineId, p_parameter_id: parameterId, p_from: from ?? null, p_to: to ?? null })
    .single();
}

export async function selectFleetHealthSnapshot() {
  const supabase = createClient();
  return supabase.from("generator_health_snapshot").select("*").order("maintenance_priority_score", { ascending: false });
}

export async function selectMachineHealthSnapshot(machineId: string) {
  const supabase = createClient();
  return supabase.from("generator_health_snapshot").select("*").eq("machine_id", machineId).single();
}

export async function callGetOverloadDuration(machineId: string, from?: string, to?: string) {
  const supabase = createClient();
  return supabase
    .rpc("get_overload_duration_minutes", { p_machine_id: machineId, p_from: from ?? undefined, p_to: to ?? undefined })
    .single();
}

export async function callGetPowerFactorTrend(machineId: string, from?: string, to?: string) {
  const supabase = createClient();
  return supabase
    .rpc("get_power_factor_trend", { p_machine_id: machineId, p_from: from ?? undefined, p_to: to ?? undefined })
    .single();
}

export async function callGetEstimatedRul(machineId: string) {
  const supabase = createClient();
  return supabase.rpc("get_estimated_rul", { p_machine_id: machineId }).single();
}

export async function selectFleetSummary() {
  const supabase = createClient();
  return supabase.from("fleet_summary").select("*").order("name");
}

export async function callGetSpecificFuelConsumption(machineId: string, from?: string, to?: string) {
  const supabase = createClient();
  return supabase
    .rpc("get_specific_fuel_consumption", { p_machine_id: machineId, p_from: from ?? undefined, p_to: to ?? undefined })
    .single();
}

export async function callGetIdleDuration(machineId: string, from?: string, to?: string) {
  const supabase = createClient();
  return supabase
    .rpc("get_idle_duration_minutes", { p_machine_id: machineId, p_from: from ?? undefined, p_to: to ?? undefined })
    .single();
}

export async function callGetMaintenanceRecommendation(machineId: string, sampleSize: number) {
  const supabase = createClient();
  return supabase
    .rpc("get_maintenance_recommendation", { p_machine_id: machineId, p_sample_size: sampleSize })
    .single();
}
