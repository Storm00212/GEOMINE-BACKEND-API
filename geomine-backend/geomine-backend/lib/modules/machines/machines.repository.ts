// Repository layer — raw Supabase queries against `machines` and
// `machine_specs`. No auth checks, no validation — that's the service
// layer's job. RLS still applies since this uses the request-scoped client.

import { createClient } from "@/lib/supabase/request-client";
import type { Machine } from "@/types/database";

export async function selectMachines(opts?: { activeOnly?: boolean }): Promise<Machine[]> {
  const supabase = createClient();
  let query = supabase.from("machines").select("*").order("name");

  if (opts?.activeOnly) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function selectMachineById(id: string): Promise<Machine | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("machines").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

export async function insertMachine(row: {
  name: string;
  location: string | null;
  phase_type: "single_phase" | "three_phase";
}): Promise<Machine> {
  const supabase = createClient();
  const { data, error } = await supabase.from("machines").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function upsertMachineSpec(machineId: string, key: string, value: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("machine_specs")
    .upsert({ machine_id: machineId, key, value }, { onConflict: "machine_id,key" });
  if (error) throw error;
}
