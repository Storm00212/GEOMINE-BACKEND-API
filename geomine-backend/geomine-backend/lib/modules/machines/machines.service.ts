// Service layer — business logic. Role checks live here (fail fast with a
// clear error) even though RLS is the real enforcement layer underneath.

import { requireRole } from "@/lib/modules/auth";
import * as repo from "./machines.repository";
import type { Machine } from "@/types/database";

export async function listMachines(opts?: { activeOnly?: boolean }): Promise<Machine[]> {
  return repo.selectMachines(opts);
}

export async function getMachine(id: string): Promise<Machine | null> {
  return repo.selectMachineById(id);
}

export async function createMachine(
  input: {
    name: string;
    location?: string;
    phaseType?: "single_phase" | "three_phase";
  },
  request: Request
): Promise<Machine> {
  await requireRole(request, ["admin"]);



  return repo.insertMachine({
    name: input.name,
    location: input.location ?? null,
    phase_type: input.phaseType ?? "three_phase",
  });
}

export async function setMachineSpec(machineId: string, key: string, value: number, request: Request): Promise<void> {
  await requireRole(request, ["admin"]);
  return repo.upsertMachineSpec(machineId, key, value);
}

