import { createClient } from "@/lib/supabase/request-client";

export interface ExportFilters {
  machineId?: string;
  from?: string;
  to?: string;
}

export interface ExportRow {
  machines: { name: string } | null;
  parameter_definitions: { label: string; unit: string | null } | null;
  value: number;
  recorded_at: string;
  flagged: boolean;
  entry_method: string;
}

export async function selectReadingsForExport(filters: ExportFilters): Promise<ExportRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("readings")
    .select(
      "value, recorded_at, flagged, entry_method, machines(name), parameter_definitions(label, unit)"
    )
    .order("recorded_at", { ascending: true });

  if (filters.machineId) query = query.eq("machine_id", filters.machineId);
  if (filters.from) query = query.gte("recorded_at", filters.from);
  if (filters.to) query = query.lte("recorded_at", `${filters.to}T23:59:59`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as ExportRow[];
}
