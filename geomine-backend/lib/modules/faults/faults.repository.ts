import { query } from "@/lib/db";
import type { FaultEvent } from "@/types/database";

export async function insertFaultEvent(row: {
  machine_id: string;
  code: string;
  description: string | null;
  recorded_at: string;
  entered_by: string;
}): Promise<FaultEvent> {
  const rows = await query<FaultEvent>(
    `insert into fault_events (machine_id, code, description, recorded_at, entered_by)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [row.machine_id, row.code, row.description, row.recorded_at, row.entered_by]
  );
  return rows[0];
}

export async function selectFaultEvents(
  machineId: string,
  opts?: { unresolvedOnly?: boolean; limit?: number }
): Promise<FaultEvent[]> {
  const conditions = ["machine_id = $1"];
  const params: any[] = [machineId];

  if (opts?.unresolvedOnly) {
    params.push(true);
    conditions.push(`resolved = $${params.length}`);
  }

  const where = conditions.join(" and ");
  const limitClause = opts?.limit ? ` limit ${Number(opts.limit)}` : "";

  return query<FaultEvent>(
    `select * from fault_events where ${where} order by recorded_at desc ${limitClause}`,
    params
  );
}

export async function updateFaultResolved(id: string): Promise<FaultEvent> {
  const rows = await query<FaultEvent>(
    `update fault_events
       set resolved = true, resolved_at = now()
     where id = $1
     returning *`,
    [id]
  );
  return rows[0];
}
