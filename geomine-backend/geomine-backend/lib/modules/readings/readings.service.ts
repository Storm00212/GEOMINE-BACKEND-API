// Service layer — validation and business rules, then delegates to the
// repository. Role checks live here; RLS is still the real enforcement
// layer underneath.

import { requireRole } from "@/lib/modules/auth";
import * as repo from "./readings.repository";
import type { Reading } from "@/types/database";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export interface LogReadingsInput {
  machineId: string;
  recordedAt: string;
  entries: { parameterId: string; value: number }[];
  notes?: string;
  // Optional, silent data-integrity signal — see readings.repository.ts /
  // migration 0003 for why this isn't a "where is the machine" field.
  latitude?: number;
  longitude?: number;
  locationAccuracyM?: number;
}

/** Batch-logs one or more parameter readings for a machine at a single timestamp. */
export async function logReadings(input: LogReadingsInput): Promise<Reading[]> {
  const auth = await requireRole(["miner", "it", "admin"]);

  if (!input.machineId) throw new ValidationError("machineId is required");
  if (!input.entries || input.entries.length === 0) {
    throw new ValidationError("At least one reading value is required");
  }
  for (const entry of input.entries) {
    if (typeof entry.value !== "number" || Number.isNaN(entry.value)) {
      throw new ValidationError(`Invalid value for parameter ${entry.parameterId}`);
    }
  }

  const rows = input.entries.map((entry) => ({
    machine_id: input.machineId,
    parameter_id: entry.parameterId,
    value: entry.value,
    recorded_at: input.recordedAt,
    entered_by: auth.userId,
    notes: input.notes ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    location_accuracy_m: input.locationAccuracyM ?? null,
  }));

  const { data, error } = await repo.insertReadings(rows);

  // The prevent_future_readings trigger raises a Postgres exception for
  // future-dated entries — surface that as a clean validation error rather
  // than a raw Postgres error string.
  if (error) {
    if (error.message.includes("recorded_at cannot be in the future")) {
      throw new ValidationError("Reading time cannot be in the future");
    }
    throw error;
  }

  return data ?? [];
}

export async function listReadingsForMachine(
  machineId: string,
  opts?: { limit?: number; from?: string; to?: string }
) {
  return repo.selectReadingsByMachine(machineId, opts);
}

export async function listRecentReadings(limit = 20) {
  return repo.selectRecentReadings(limit);
}

export async function listFlaggedReadings(limit = 10) {
  return repo.selectFlaggedReadings(limit);
}

/** A user's own submitted readings — used by the miner's history page. */
export async function listMyReadings(limit = 50) {
  const auth = await requireRole(["miner", "it", "admin"]);
  return repo.selectReadingsByUser(auth.userId, limit);
}

export async function correctReading(id: string, newValue: number): Promise<Reading> {
  await requireRole(["it", "admin"]);

  if (typeof newValue !== "number" || Number.isNaN(newValue)) {
    throw new ValidationError("Invalid value");
  }

  return repo.updateReadingValue(id, newValue);
}

export async function deleteReading(id: string): Promise<void> {
  await requireRole(["admin"]);
  return repo.deleteReadingById(id);
}
