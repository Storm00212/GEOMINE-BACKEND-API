import { requireRole } from "@/lib/modules/auth";
import { ValidationError } from "@/lib/modules/readings";
import * as repo from "./refuel.repository";
import type { RefuelEvent } from "@/types/database";

export interface LogRefuelInput {
  machineId: string;
  litersAdded: number;
  recordedAt: string;
  notes?: string;
}

export async function logRefuelEvent(input: LogRefuelInput, request: Request): Promise<RefuelEvent> {
  const auth = await requireRole(request, ["miner", "it", "admin"]);


  if (!input.machineId) throw new ValidationError("machineId is required");
  if (typeof input.litersAdded !== "number" || input.litersAdded <= 0) {
    throw new ValidationError("litersAdded must be a positive number");
  }

  const { data, error } = await repo.insertRefuelEvent({
    machine_id: input.machineId,
    liters_added: input.litersAdded,
    recorded_at: input.recordedAt,
    entered_by: auth.userId,
    notes: input.notes ?? null,
  });

  if (error) {
    if (error.message.includes("recorded_at cannot be in the future")) {
      throw new ValidationError("Refuel time cannot be in the future");
    }
    throw error;
  }

  return data;
}

export async function listRefuelEvents(
  machineId: string,
  opts?: { limit?: number; from?: string; to?: string }
): Promise<RefuelEvent[]> {
  return repo.selectRefuelEvents(machineId, opts);
}
