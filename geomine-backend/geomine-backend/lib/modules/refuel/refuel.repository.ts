import { createClient } from "@/lib/supabase/request-client";
import type { RefuelEvent } from "@/types/database";

export async function insertRefuelEvent(row: {
  machine_id: string;
  liters_added: number;
  recorded_at: string;
  entered_by: string;
  notes: string | null;
}) {
  const supabase = createClient();
  return supabase.from("refuel_events").insert(row).select().single();
}

export async function selectRefuelEvents(
  machineId: string,
  opts?: { limit?: number; from?: string; to?: string }
): Promise<RefuelEvent[]> {
  const supabase = createClient();
  let query = supabase
    .from("refuel_events")
    .select("*")
    .eq("machine_id", machineId)
    .order("recorded_at", { ascending: false });

  if (opts?.from) query = query.gte("recorded_at", opts.from);
  if (opts?.to) query = query.lte("recorded_at", opts.to);
  if (opts?.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
