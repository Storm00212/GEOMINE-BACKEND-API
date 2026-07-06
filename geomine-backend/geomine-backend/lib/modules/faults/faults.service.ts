import { requireRole } from "@/lib/modules/auth";
import { ValidationError } from "@/lib/modules/readings";
import * as repo from "./faults.repository";
import type { FaultEvent } from "@/types/database";

export interface LogFaultInput {
  machineId: string;
  code: string;
  description?: string;
  recordedAt: string;
}

export async function logFaultEvent(input: LogFaultInput): Promise<FaultEvent> {
  const auth = await requireRole(["miner", "it", "admin"]);

  if (!input.machineId) throw new ValidationError("machineId is required");
  if (!input.code || input.code.trim() === "") {
    throw new ValidationError("Fault code is required");
  }

  const { data, error } = await repo.insertFaultEvent({
    machine_id: input.machineId,
    code: input.code.trim(),
    description: input.description ?? null,
    recorded_at: input.recordedAt,
    entered_by: auth.userId,
  });

  if (error) {
    if (error.message.includes("recorded_at cannot be in the future")) {
      throw new ValidationError("Fault time cannot be in the future");
    }
    throw error;
  }

  return data;
}

export async function listFaultEvents(
  machineId: string,
  opts?: { unresolvedOnly?: boolean; limit?: number }
): Promise<FaultEvent[]> {
  return repo.selectFaultEvents(machineId, opts);
}

export async function resolveFault(id: string): Promise<FaultEvent> {
  await requireRole(["it", "admin"]);
  return repo.updateFaultResolved(id);
}
