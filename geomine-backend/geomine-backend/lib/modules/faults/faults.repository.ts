import { createClient } from "@/lib/supabase/request-client";
import type { FaultEvent } from "@/types/database";

export async function insertFaultEvent(row: {
  machine_id: string;
  code: string;
  description: string | null;
  recorded_at: string;
  entered_by: string;
}) {
  const supabase = createClient();
  return supabase.from("fault_events").insert(row).select().single();
}

export async function selectFaultEvents(
  machineId: string,
  opts?: { unresolvedOnly?: boolean; limit?: number }
): Promise<FaultEvent[]> {
  const supabase = createClient();
  let query = supabase
    .from("fault_events")
    .select("*")
    .eq("machine_id", machineId)
    .order("recorded_at", { ascending: false });

  if (opts?.unresolvedOnly) query = query.eq("resolved", false);
  if (opts?.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function updateFaultResolved(id: string): Promise<FaultEvent> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fault_events")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
