// Repository layer — raw data access for `readings` using Neon/Postgres.
// No business rules, no auth decisions.

import { query } from "@/lib/db";
import type { Reading } from "@/types/database";

export interface ReadingRow {
  machine_id: string;
  parameter_id: string;
  value: number;
  recorded_at: string;
  entered_by: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy_m: number | null;
}

export async function insertReadings(
  rows: ReadingRow[]
): Promise<{ data: Reading[] | null; error: any }> {
  if (rows.length === 0) return { data: [], error: null };

  // Insert rows and return the inserted ones.
  // Use parameterized VALUES for safety.
  const columns = [
    "machine_id",
    "parameter_id",
    "value",
    "recorded_at",
    "entered_by",
    "notes",
    "latitude",
    "longitude",
    "location_accuracy_m",
  ] as const;

  const values: any[] = [];
  const placeholders: string[] = [];

  rows.forEach((row, i) => {
    const base = i * columns.length;
    const ph = columns
      .map((_, j) => {
        values.push((row as any)[columns[j]]);
        return `$${base + j + 1}`;
      })
      .join(", ");
    placeholders.push(`(${ph})`);
  });

  const data = await query<Reading>(
    `insert into readings (${columns.join(", ")})
     values ${placeholders.join(", ")}
     returning *`,
    values
  );

  return { data, error: null };
}

export async function selectReadingsByMachine(
  machineId: string,
  opts?: { limit?: number; from?: string; to?: string }
) {
  const conditions: string[] = ["r.machine_id = $1"];
  const params: any[] = [machineId];

  if (opts?.from) {
    params.push(opts.from);
    conditions.push(`r.recorded_at >= $${params.length}`);
  }
  if (opts?.to) {
    params.push(opts.to);
    conditions.push(`r.recorded_at <= $${params.length}`);
  }
  if (opts?.limit) {
    // handled via LIMIT
  }

  const where = conditions.join(" and ");
  const limitClause = opts?.limit ? ` limit ${opts.limit}` : "";

  return query(
    `select
      r.id,
      r.value,
      r.recorded_at,
      r.flagged,
      r.parameter_id,
      p.label,
      p.unit
     from readings r
     join parameter_definitions p on p.id = r.parameter_id
     where ${where}
     order by r.recorded_at asc
     ${limitClause}`,
    params
  );
}



export async function selectRecentReadings(limit: number) {
  return query(
    `select
      r.id,
      r.value,
      r.recorded_at,
      r.flagged,
      r.machine_id,
      m.name as machine_name,
      r.parameter_id,
      p.label,
      p.unit
     from readings r
     join machines m on m.id = r.machine_id
     join parameter_definitions p on p.id = r.parameter_id
     order by r.recorded_at desc
     limit $1`,
    [limit]
  );
}

export async function selectFlaggedReadings(limit: number) {
  return query(
    `select
      r.id,
      r.value,
      r.recorded_at,
      r.flagged,
      r.machine_id,
      m.name as machine_name,
      r.parameter_id,
      p.label,
      p.unit
     from readings r
     join machines m on m.id = r.machine_id
     join parameter_definitions p on p.id = r.parameter_id
     where r.flagged = true
     order by r.recorded_at desc
     limit $1`,
    [limit]
  );
}

export async function selectReadingsByUser(userId: string, limit: number) {
  return query(
    `select
      r.id,
      r.value,
      r.recorded_at,
      r.flagged,
      r.machine_id,
      m.name as machine_name,
      r.parameter_id,
      p.label,
      p.unit
     from readings r
     join machines m on m.id = r.machine_id
     join parameter_definitions p on p.id = r.parameter_id
     where r.entered_by = $1
     order by r.recorded_at desc
     limit $2`,
    [userId, limit]
  );
}

export async function updateReadingValue(id: string, value: number): Promise<Reading> {
  const rows = await query<Reading>(
    `update readings
       set value = $2
     where id = $1
     returning *`,
    [id, value]
  );

  return rows[0];
}

export async function deleteReadingById(id: string): Promise<void> {
  await query(`delete from readings where id = $1`, [id]);
}

