// No auth gating needed — the parameter catalog is readable by any
// authenticated user (miners need it to render the entry form).

import { selectParameterDefinitions } from "./parameters.repository";
import type { ParameterDefinition } from "@/types/database";

export async function listParameterDefinitions(opts?: {
  machineType?: "generator";
  activeOnly?: boolean;
}): Promise<ParameterDefinition[]> {
  return selectParameterDefinitions(opts);
}
