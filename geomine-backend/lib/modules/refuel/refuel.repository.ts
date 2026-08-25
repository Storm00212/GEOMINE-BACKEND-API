import { query } from "@/lib/db";
import type { RefuelEvent } from "@/types/database";

export async function insertRefuelEvent(row: {
  machine_id: string;
  liters_added: number;
  recorded_at: string;
  entered_by: string;
  notes: string | null;
}): Promise<RefuelEvent> {
  const rows = await query<RefuelEvent>(
    `insert into refuel_events (machine_id, liters_added, recorded_at, entered_by, notes)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [row.machine_id, row.liters_added, row.recorded_at, row.entered_by, row.notes]
  );
  return rows[0];
}

export async function selectRefuelEvents(
  machineId: string,
  opts?: { limit?: number; from?: string; to?: string }
): Promise<RefuelEvent[]> {
  const conditions = ["machine_id = $1"];
  const params: any[] = [machineId];

  if (opts?.from) {
    params.push(opts.from);
    conditions.push(`recorded_at >= $${params.length}`);
  }
  if (opts?.to) {
    params.push(opts.to);
    conditions.push(`recorded_at <= $${params.length}`);
  }

  const where = conditions.join(" and ");
  const limitClause = opts?.limit ? ` limit ${Number(opts.limit)}` : "";

  return query<RefuelEvent>(
    `select * from refuel_events where ${where} order by recorded_at desc ${limitClause}`,
    params
  );
}
