import { query } from "@/lib/db";
import type { ParameterDefinition } from "@/types/database";

export async function selectParameterDefinitions(opts?: {
  machineType?: "generator";
  activeOnly?: boolean;
}): Promise<ParameterDefinition[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (opts?.machineType) {
    params.push(opts.machineType);
    conditions.push(`machine_type = $${params.length}`);
  }
  if (opts?.activeOnly) {
    params.push(true);
    conditions.push(`active = $${params.length}`);
  }

  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  return query<ParameterDefinition>(
    `select * from parameter_definitions ${where} order by sort_order`,
    params
  );
}
