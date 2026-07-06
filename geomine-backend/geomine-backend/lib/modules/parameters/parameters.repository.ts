import { createClient } from "@/lib/supabase/request-client";
import type { ParameterDefinition } from "@/types/database";

export async function selectParameterDefinitions(opts?: {
  machineType?: "generator";
  activeOnly?: boolean;
}): Promise<ParameterDefinition[]> {
  const supabase = createClient();
  let query = supabase.from("parameter_definitions").select("*").order("sort_order");

  if (opts?.machineType) query = query.eq("machine_type", opts.machineType);
  if (opts?.activeOnly) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
