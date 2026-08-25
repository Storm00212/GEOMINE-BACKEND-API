import { randomUUID, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import * as repo from "./repositories";
import { signAccessToken } from "./middleware";
import { ValidationError, ConflictError, UnauthorizedError, type AuthContext, type UserRole } from "./types";

// AUTH

// Verifies an email/password pair against app_users and, if they match,
// returns a signed access token. Throws UnauthorizedError with a generic
// "Invalid credentials" message either way (unknown email or wrong
// password) so a caller can't use the error to enumerate which emails exist.
export async function loginUser(email: unknown, password: unknown): Promise<{ accessToken: string }> {
  if (!email || typeof email !== "string") throw new ValidationError("email is required");
  if (!password || typeof password !== "string") throw new ValidationError("password is required");

  const user = await repo.findAppUserByEmail(email);
  if (!user) throw new UnauthorizedError("Invalid credentials");

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new UnauthorizedError("Invalid credentials");

  const accessToken = signAccessToken({ sub: user.id, role: user.role as UserRole });
  return { accessToken };
}

// Creates a new account — an app_users row for login plus a profiles row
// for role/authorization — and returns a signed access token so the user
// is immediately logged in. Rejects an already-used email with
// ConflictError rather than silently overwriting the existing account.
export async function signupUser(
  email: unknown,
  password: unknown,
  role: unknown
): Promise<{ accessToken: string }> {
  if (!email || typeof email !== "string") throw new ValidationError("email is required");
  if (!password || typeof password !== "string" || password.length < 8) {
    throw new ValidationError("password must be at least 8 characters");
  }

  const allowedRoles = new Set(["miner", "it", "admin"]);
  const resolvedRole = (typeof role === "string" && allowedRoles.has(role) ? role : "miner") as UserRole;

  const existing = await repo.findAppUserByEmail(email);
  if (existing) throw new ConflictError("Email already in use");

  const userId = randomUUID();
  const password_hash = await bcrypt.hash(password, 10);

  await repo.insertAppUser({ id: userId, email, password_hash, role: resolvedRole });
  await repo.insertProfileForSignup(userId, resolvedRole);

  const accessToken = signAccessToken({ sub: userId, role: resolvedRole });
  return { accessToken };
}

// Returns the currently authenticated user's id and profile — who am I,
// what's my role.
export async function getCurrentUser(auth: AuthContext) {
  return { userId: auth.userId, profile: auth.profile };
}

// MACHINES

// Lists machines, optionally restricted to ones with status = "active".
export async function listMachines(opts?: { activeOnly?: boolean }) {
  return repo.findMachines(opts);
}

// Returns one machine by id, or null if it doesn't exist.
export async function getMachine(id: string) {
  return repo.findMachineById(id);
}

// Creates a new machine, defaulting phaseType to three_phase if not given.
export async function createMachine(input: { name: string; location?: string; phaseType?: "single_phase" | "three_phase" }) {
  return repo.insertMachine({
    name: input.name,
    location: input.location ?? null,
    phase_type: input.phaseType ?? "three_phase",
  });
}

// Sets a machine's nameplate/reference value (e.g. rated_current). Not
// currently wired to any route — the function exists for a future admin UI.
export async function setMachineSpec(machineId: string, key: string, value: number) {
  return repo.upsertMachineSpec(machineId, key, value);
}

// PARAMETERS

// Lists the parameter catalog, optionally filtered by machine type and/or
// restricted to active parameters.
export async function listParameterDefinitions(opts?: { machineType?: "generator"; activeOnly?: boolean }) {
  return repo.findParameterDefinitions(opts);
}

// READINGS

export interface LogReadingsInput {
  machineId: string;
  recordedAt: string;
  entries: { parameterId: string; value: number }[];
  notes?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracyM?: number;
}

// Batch-logs one or more parameter readings for a machine at a single
// timestamp — one logging visit can cover several parameters at once.
// Validates that a machine was given, at least one entry was provided, and
// every value is a real number, then translates the database's
// future-dated-timestamp rejection into a clean validation error instead
// of a raw database error leaking through.
export async function logReadings(input: LogReadingsInput, auth: AuthContext) {
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
    recorded_at: new Date(input.recordedAt),
    entered_by: auth.userId,
    notes: input.notes ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    location_accuracy_m: input.locationAccuracyM ?? null,
  }));

  try {
    return await repo.insertReadings(rows);
  } catch (error: any) {
    if (error?.message?.includes("recorded_at cannot be in the future")) {
      throw new ValidationError("Reading time cannot be in the future");
    }
    throw error;
  }
}

// Returns a machine's reading history.
export async function listReadingsForMachine(machineId: string, opts?: { limit?: number; from?: string; to?: string }) {
  return repo.findReadingsByMachine(machineId, opts);
}

// Returns the most recent readings across the whole fleet, for the
// dashboard's activity feed.
export async function listRecentReadings(limit = 20) {
  return repo.findRecentReadings(limit);
}

// Returns readings currently flagged as outside their parameter's expected
// range.
export async function listFlaggedReadings(limit = 10) {
  return repo.findFlaggedReadings(limit);
}

// Returns a user's own submitted readings, for their entry history page.
export async function listMyReadings(limit: number, auth: AuthContext) {
  return repo.findReadingsByUser(auth.userId, limit);
}

// Corrects a mis-entered reading value.
export async function correctReading(id: string, newValue: unknown) {
  if (typeof newValue !== "number" || Number.isNaN(newValue)) {
    throw new ValidationError("Invalid value");
  }
  return repo.updateReadingValue(id, newValue);
}

// Deletes a reading.
export async function deleteReading(id: string) {
  return repo.deleteReadingById(id);
}

// REFUEL EVENTS

export interface LogRefuelInput {
  machineId: string;
  litersAdded: number;
  recordedAt: string;
  notes?: string;
}

// Logs a refuel event, validating that a machine was given and that
// litersAdded is a positive number, and translating a future-dated
// timestamp into a clean validation error.
export async function logRefuelEvent(input: LogRefuelInput, auth: AuthContext) {
  if (!input.machineId) throw new ValidationError("machineId is required");
  if (typeof input.litersAdded !== "number" || input.litersAdded <= 0) {
    throw new ValidationError("litersAdded must be a positive number");
  }

  try {
    return await repo.insertRefuelEvent({
      machine_id: input.machineId,
      liters_added: input.litersAdded,
      recorded_at: new Date(input.recordedAt),
      entered_by: auth.userId,
      notes: input.notes ?? null,
    });
  } catch (error: any) {
    if (error?.message?.includes("recorded_at cannot be in the future")) {
      throw new ValidationError("Refuel time cannot be in the future");
    }
    throw error;
  }
}

// Lists refuel events for one machine.
export async function listRefuelEvents(machineId: string, opts?: { limit?: number; from?: string; to?: string }) {
  return repo.findRefuelEvents(machineId, opts);
}

// FAULT EVENTS

export interface LogFaultInput {
  machineId: string;
  code: string;
  description?: string;
  recordedAt: string;
}

// Logs a fault event, validating that a machine and a non-empty code were
// given, and translating a future-dated timestamp into a clean validation
// error.
export async function logFaultEvent(input: LogFaultInput, auth: AuthContext) {
  if (!input.machineId) throw new ValidationError("machineId is required");
  if (!input.code || input.code.trim() === "") {
    throw new ValidationError("Fault code is required");
  }

  try {
    return await repo.insertFaultEvent({
      machine_id: input.machineId,
      code: input.code.trim(),
      description: input.description ?? null,
      recorded_at: new Date(input.recordedAt),
      entered_by: auth.userId,
    });
  } catch (error: any) {
    if (error?.message?.includes("recorded_at cannot be in the future")) {
      throw new ValidationError("Fault time cannot be in the future");
    }
    throw error;
  }
}

// Lists fault events for one machine, optionally restricted to the ones
// still unresolved.
export async function listFaultEvents(machineId: string, opts?: { unresolvedOnly?: boolean; limit?: number }) {
  return repo.findFaultEvents(machineId, opts);
}

// Marks a fault event resolved.
export async function resolveFault(id: string) {
  return repo.updateFaultResolved(id);
}

// REPORTS

export interface ExportFilters {
  machineId?: string;
  from?: string;
  to?: string;
}

// Returns the reading history, optionally filtered by machine and/or date
// range, for a CSV export.
export async function getReadingsForExport(filters: ExportFilters) {
  return repo.findReadingsForExport(filters);
}

// Formats reading rows as CSV text — one header row plus one quoted,
// comma-separated row per reading, with embedded quotes escaped. Pure
// formatting, not a database concern, which is why it lives here rather
// than in the repository.
export function toCsv(rows: Awaited<ReturnType<typeof getReadingsForExport>>): string {
  const header = "Machine,Parameter,Value,Unit,Recorded At,Flagged,Entry Method\n";

  const body = rows
    .map((r) =>
      [
        r.machine_name ?? "",
        r.parameter_label ?? "",
        r.value,
        r.parameter_unit ?? "",
        new Date(r.recorded_at).toISOString(),
        r.flagged ? "yes" : "no",
        r.entry_method,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  return header + body;
}

// METRICS
//
// Thin, typed wrappers around the repository's raw-SQL calls — the actual
// calculations live in Postgres (see database/0002_reconstructed_metrics_and_events.sql
// for the formulas and which ones are physics versus heuristic). This
// layer exists so the rest of the app gets named functions instead of raw
// SQL function names scattered around.

// Returns mean, volatility, min, and max for one machine and parameter
// over an optional date range.
export async function getReadingStats(machineId: string, parameterId: string, from?: string, to?: string) {
  return repo.callGetReadingStats(machineId, parameterId, from, to);
}

// Returns one health snapshot row per machine, sorted by maintenance
// priority.
export async function getFleetHealthSnapshot() {
  return repo.findFleetHealthSnapshot();
}

// Returns one machine's health snapshot.
export async function getMachineHealthSnapshot(machineId: string) {
  return repo.findMachineHealthSnapshot(machineId);
}

// Returns how many minutes a machine spent above its rated load.
export async function getOverloadDuration(machineId: string, from?: string, to?: string) {
  return repo.callGetOverloadDuration(machineId, from, to);
}

// Returns a machine's power factor trend — a heuristic proxy for
// "efficiency trend", since true efficiency needs fuel/mechanical-input
// data this system doesn't have.
export async function getPowerFactorTrend(machineId: string, from?: string, to?: string) {
  return repo.callGetPowerFactorTrend(machineId, from, to);
}

// Returns a machine's estimated remaining useful life. Always
// insufficient_data for now — deliberately not implemented, since a real
// estimate needs a degradation curve calibrated against historical failure
// data that doesn't exist yet.
export async function getEstimatedRul(machineId: string) {
  return repo.callGetEstimatedRul(machineId);
}

// Returns reading counts and flags per machine over the last 7 days, for a
// lighter-weight fleet overview than the full health snapshot.
export async function getFleetSummary() {
  return repo.findFleetSummary();
}

// Returns a machine's real, refuel-aware fuel efficiency — unlike the
// power-factor-trend proxy, this is an actual efficiency measurement.
export async function getSpecificFuelConsumption(machineId: string, from?: string, to?: string) {
  return repo.callGetSpecificFuelConsumption(machineId, from, to);
}

// Returns how many minutes a machine spent idle.
export async function getIdleDuration(machineId: string, from?: string, to?: string) {
  return repo.callGetIdleDuration(machineId, from, to);
}

// Returns a rule-based, explainable maintenance recommendation for one
// machine — not a statistical or ML prediction, so the specific reasons
// that fired can be checked, not just trusted.
export async function getMaintenanceRecommendation(machineId: string, sampleSize = 10) {
  return repo.callGetMaintenanceRecommendation(machineId, sampleSize);
}

// ADMIN

export interface InviteUserInput {
  email: unknown;
  fullName: unknown;
  role: unknown;
}

// Creates an invited user (app_users + profiles rows) and returns a
// generated temporary password for the admin to relay to them. Validates
// that a real email and a real role were given, and rejects an
// already-used email with ConflictError.
export async function inviteUser(input: InviteUserInput) {
  const allowedRoles = ["miner", "it", "admin"];
  if (!input.email || typeof input.email !== "string" || !allowedRoles.includes(input.role as string)) {
    throw new ValidationError("Invalid invite payload");
  }
  const email = input.email;
  const fullName = typeof input.fullName === "string" ? input.fullName : "";
  const role = input.role as UserRole;

  const existing = await repo.findAppUserByEmail(email);
  if (existing) throw new ConflictError("Email already in use");

  const userId = randomUUID();
  const temporaryPassword = randomBytes(12).toString("hex");
  const password_hash = await bcrypt.hash(temporaryPassword, 10);

  await repo.insertAppUser({ id: userId, email, password_hash, role });
  await repo.insertProfileForInvite(userId, fullName, role);

  return { email, temporaryPassword };
}
