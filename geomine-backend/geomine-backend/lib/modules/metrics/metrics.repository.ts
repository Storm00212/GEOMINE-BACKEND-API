// Repository layer — raw Neon/Postgres calls to the SQL functions/views
// defined in the migrations. No shaping beyond what Postgres returns;
// typing and any defaults live in the service layer.

import { query } from "@/lib/db";

export async function callGetReadingStats(
  machineId: string,
  parameterId: string,
  from?: string,
  to?: string
) {
  const rows = await query(
    `select * from get_reading_stats($1, $2, $3, $4)`,
    [machineId, parameterId, from ?? null, to ?? null]
  );
  return rows[0] ?? null;
}

export async function selectFleetHealthSnapshot() {
  return query(
    `select * from generator_health_snapshot order by maintenance_priority_score desc`
  );
}

export async function selectMachineHealthSnapshot(machineId: string) {
  const rows = await query(
    `select * from generator_health_snapshot where machine_id = $1 limit 1`,
    [machineId]
  );
  return rows[0] ?? null;
}

export async function callGetOverloadDuration(
  machineId: string,
  from?: string,
  to?: string
) {
  const rows = await query(
    `select * from get_overload_duration_minutes($1, $2, $3)`,
    [machineId, from ?? null, to ?? null]
  );
  return rows[0] ?? null;
}

export async function callGetPowerFactorTrend(
  machineId: string,
  from?: string,
  to?: string
) {
  const rows = await query(
    `select * from get_power_factor_trend($1, $2, $3)`,
    [machineId, from ?? null, to ?? null]
  );
  return rows[0] ?? null;
}

export async function callGetEstimatedRul(machineId: string) {
  const rows = await query(
    `select * from get_estimated_rul($1)`,
    [machineId]
  );
  return rows[0] ?? null;
}

export async function selectFleetSummary() {
  return query(`select * from fleet_summary order by name`);
}

export async function callGetSpecificFuelConsumption(
  machineId: string,
  from?: string,
  to?: string
) {
  const rows = await query(
    `select * from get_specific_fuel_consumption($1, $2, $3)`,
    [machineId, from ?? null, to ?? null]
  );
  return rows[0] ?? null;
}

export async function callGetIdleDuration(
  machineId: string,
  from?: string,
  to?: string
) {
  const rows = await query(
    `select * from get_idle_duration_minutes($1, $2, $3)`,
    [machineId, from ?? null, to ?? null]
  );
  return rows[0] ?? null;
}

export async function callGetMaintenanceRecommendation(
  machineId: string,
  sampleSize: number
) {
  const rows = await query(
    `select * from get_maintenance_recommendation($1, $2)`,
    [machineId, sampleSize]
  );
  return rows[0] ?? null;
}
