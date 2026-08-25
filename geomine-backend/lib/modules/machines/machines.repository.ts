// Repository layer — raw Neon/Postgres queries against `machines` and
// `machine_specs`. No auth checks, no validation — that's the service
// layer's job. Auth is enforced in the service layer (requireRole), since
// this backend uses Neon Postgres directly rather than Supabase RLS.

import { query } from "@/lib/db";
import type { Machine } from "@/types/database";

export async function selectMachines(opts?: { activeOnly?: boolean }): Promise<Machine[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (opts?.activeOnly) {
    params.push("active");
    conditions.push(`status = $${params.length}`);
  }

  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  return query<Machine>(`select * from machines ${where} order by name`, params);
}

export async function selectMachineById(id: string): Promise<Machine | null> {
  const rows = await query<Machine>(`select * from machines where id = $1 limit 1`, [id]);
  return rows[0] ?? null;
}

export async function insertMachine(row: {
  name: string;
  location: string | null;
  phase_type: "single_phase" | "three_phase";
}): Promise<Machine> {
  const rows = await query<Machine>(
    `insert into machines (name, location, phase_type)
     values ($1, $2, $3)
     returning *`,
    [row.name, row.location, row.phase_type]
  );
  return rows[0];
}

export async function upsertMachineSpec(machineId: string, key: string, value: number): Promise<void> {
  await query(
    `insert into machine_specs (machine_id, key, value)
     values ($1, $2, $3)
     on conflict (machine_id, key) do update set value = excluded.value`,
    [machineId, key, value]
  );
}
