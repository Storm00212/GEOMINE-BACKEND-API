// Repository layer — raw Supabase queries against `readings`. No auth
// checks, no validation. RLS still applies since this uses the
// request-scoped client — a miner's query here still can't return another
// user's rows regardless of what this file does.

import { createClient } from "@/lib/supabase/request-client";
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

export async function insertReadings(rows: ReadingRow[]): Promise<{ data: Reading[] | null; error: any }> {
  const supabase = createClient();
  return supabase.from("readings").insert(rows).select();
}

export async function selectReadingsByMachine(
  machineId: string,
  opts?: { limit?: number; from?: string; to?: string }
) {
  const supabase = createClient();
  let query = supabase
    .from("readings")
    .select("id, value, recorded_at, flagged, parameter_id, parameter_definitions(label, unit)")
    .eq("machine_id", machineId)
    .order("recorded_at", { ascending: true });

  if (opts?.from) query = query.gte("recorded_at", opts.from);
  if (opts?.to) query = query.lte("recorded_at", opts.to);
  if (opts?.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function selectRecentReadings(limit: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("readings")
    .select("id, value, recorded_at, flagged, machines(name), parameter_definitions(label, unit)")
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function selectFlaggedReadings(limit: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("readings")
    .select("id, value, recorded_at, machines(name), parameter_definitions(label, unit)")
    .eq("flagged", true)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function selectReadingsByUser(userId: string, limit: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("readings")
    .select("id, value, recorded_at, flagged, machines(name), parameter_definitions(label, unit)")
    .eq("entered_by", userId)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function updateReadingValue(id: string, value: number): Promise<Reading> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("readings")
    .update({ value })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReadingById(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("readings").delete().eq("id", id);
  if (error) throw error;
}
