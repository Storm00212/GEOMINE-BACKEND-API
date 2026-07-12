import { query } from "@/lib/db";

export interface ExportFilters {
  machineId?: string;
  from?: string;
  to?: string;
}

export interface ExportRow {
  machine_name: string | null;
  parameter_label: string | null;
  parameter_unit: string | null;
  value: number;
  recorded_at: string;
  flagged: boolean;
  entry_method: string;
}

export async function selectReadingsForExport(filters: ExportFilters): Promise<ExportRow[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.machineId) {
    params.push(filters.machineId);
    conditions.push(`r.machine_id = $${params.length}`);
  }
  if (filters.from) {
    params.push(filters.from);
    conditions.push(`r.recorded_at >= $${params.length}`);
  }
  if (filters.to) {
    params.push(`${filters.to}T23:59:59`);
    conditions.push(`r.recorded_at <= $${params.length}`);
  }

  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";

  return query<ExportRow>(
    `select
       m.name as machine_name,
       p.label as parameter_label,
       p.unit as parameter_unit,
       r.value,
       r.recorded_at,
       r.flagged,
       r.entry_method
     from readings r
     join machines m on m.id = r.machine_id
     join parameter_definitions p on p.id = r.parameter_id
     ${where}
     order by r.recorded_at asc`,
    params
  );
}
