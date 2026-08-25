import { prisma } from "./config";
import type { app_users, fault_events, machines, profiles, readings, refuel_events } from "@prisma/client";

// AUTH / PROFILES

// Looks up a user's profile by id. This is the row the auth middleware
// reads on every authenticated request, and profiles.role (not the JWT's
// role claim) is the actual source of truth for what a user is allowed to do.
export async function findProfileById(id: string): Promise<profiles | null> {
  return prisma.profiles.findUnique({ where: { id } });
}

// Looks up a login credential row (email + password hash) by email.
export async function findAppUserByEmail(email: string): Promise<app_users | null> {
  return prisma.app_users.findUnique({ where: { email } });
}

// Creates the login credential row (app_users) for a new user, whether from
// self-signup or an admin invite.
export async function insertAppUser(row: {
  id: string;
  email: string;
  password_hash: string;
  role: "miner" | "it" | "admin";
}): Promise<app_users> {
  return prisma.app_users.create({ data: row });
}

// Creates a profile row for a freshly signed-up user, or updates the role
// if a row with that id already exists.
export async function insertProfileForSignup(id: string, role: "miner" | "it" | "admin"): Promise<profiles> {
  return prisma.profiles.upsert({
    where: { id },
    create: { id, full_name: null, role },
    update: { role },
  });
}

// Creates a profile row for an admin-invited user, or updates the name and
// role if a row with that id already exists.
export async function insertProfileForInvite(
  id: string,
  fullName: string,
  role: "miner" | "it" | "admin"
): Promise<profiles> {
  return prisma.profiles.upsert({
    where: { id },
    create: { id, full_name: fullName, role },
    update: { full_name: fullName, role },
  });
}

// MACHINES

// Lists machines, optionally restricted to ones with status = "active".
export async function findMachines(opts?: { activeOnly?: boolean }): Promise<machines[]> {
  return prisma.machines.findMany({
    where: opts?.activeOnly ? { status: "active" } : undefined,
    orderBy: { name: "asc" },
  });
}

// Looks up one machine by id.
export async function findMachineById(id: string): Promise<machines | null> {
  return prisma.machines.findUnique({ where: { id } });
}

// Creates a new machine.
export async function insertMachine(row: {
  name: string;
  location: string | null;
  phase_type: "single_phase" | "three_phase";
}): Promise<machines> {
  return prisma.machines.create({ data: row });
}

// Sets one nameplate/reference value for a machine (e.g. rated_current,
// poles), creating the row if it doesn't exist yet or overwriting the
// value if it does.
export async function upsertMachineSpec(machineId: string, key: string, value: number): Promise<void> {
  await prisma.machine_specs.upsert({
    where: { machine_id_key: { machine_id: machineId, key } },
    create: { machine_id: machineId, key, value },
    update: { value },
  });
}

// PARAMETERS

// Lists the parameter catalog (output_current, bearing_temp, etc.),
// optionally filtered by machine type and/or restricted to active ones.
export async function findParameterDefinitions(opts?: { machineType?: "generator"; activeOnly?: boolean }) {
  return prisma.parameter_definitions.findMany({
    where: {
      ...(opts?.machineType ? { machine_type: opts.machineType } : {}),
      ...(opts?.activeOnly ? { active: true } : {}),
    },
    orderBy: { sort_order: "asc" },
  });
}

// READINGS

export interface ReadingRow {
  machine_id: string;
  parameter_id: string;
  value: number;
  recorded_at: Date;
  entered_by: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy_m: number | null;
}

// Batch-inserts one or more readings (one logging visit can cover several
// parameters at once) in a single, all-or-nothing transaction, so a
// future-dated timestamp rejects the whole batch rather than partially
// inserting it.
export async function insertReadings(rows: ReadingRow[]): Promise<readings[]> {
  if (rows.length === 0) return [];
  return prisma.$transaction(rows.map((row) => prisma.readings.create({ data: row })));
}

// Returns a machine's reading history as a flat list (id, value, flagged,
// plus the parameter's label/unit joined in) rather than Prisma's nested
// relation shape, since that's what the frontend's chart and history views
// expect.
export async function findReadingsByMachine(machineId: string, opts?: { limit?: number; from?: string; to?: string }) {
  return prisma.$queryRaw<any[]>`
    select
      r.id, r.value, r.recorded_at, r.flagged, r.parameter_id, p.label, p.unit
    from readings r
    join parameter_definitions p on p.id = r.parameter_id
    where r.machine_id = ${machineId}::uuid
      and (${opts?.from ?? null}::timestamptz is null or r.recorded_at >= ${opts?.from ?? null}::timestamptz)
      and (${opts?.to ?? null}::timestamptz is null or r.recorded_at <= ${opts?.to ?? null}::timestamptz)
    order by r.recorded_at asc
    limit ${opts?.limit ?? 100000}
  `;
}

// Returns the most recent readings across the whole fleet, with machine
// name and parameter label/unit joined in, for the dashboard's recent
// activity feed.
export async function findRecentReadings(limit: number) {
  return prisma.$queryRaw<any[]>`
    select
      r.id, r.value, r.recorded_at, r.flagged, r.machine_id, m.name as machine_name,
      r.parameter_id, p.label, p.unit
    from readings r
    join machines m on m.id = r.machine_id
    join parameter_definitions p on p.id = r.parameter_id
    order by r.recorded_at desc
    limit ${limit}
  `;
}

// Returns readings currently flagged as outside their parameter's expected
// range, for the dashboard's out-of-range feed.
export async function findFlaggedReadings(limit: number) {
  return prisma.$queryRaw<any[]>`
    select
      r.id, r.value, r.recorded_at, r.flagged, r.machine_id, m.name as machine_name,
      r.parameter_id, p.label, p.unit
    from readings r
    join machines m on m.id = r.machine_id
    join parameter_definitions p on p.id = r.parameter_id
    where r.flagged = true
    order by r.recorded_at desc
    limit ${limit}
  `;
}

// Returns one user's own submitted readings, for their entry history page.
export async function findReadingsByUser(userId: string, limit: number) {
  return prisma.$queryRaw<any[]>`
    select
      r.id, r.value, r.recorded_at, r.flagged, r.machine_id, m.name as machine_name,
      r.parameter_id, p.label, p.unit
    from readings r
    join machines m on m.id = r.machine_id
    join parameter_definitions p on p.id = r.parameter_id
    where r.entered_by = ${userId}::uuid
    order by r.recorded_at desc
    limit ${limit}
  `;
}

// Corrects a mis-entered reading value.
export async function updateReadingValue(id: string, value: number): Promise<readings> {
  return prisma.readings.update({ where: { id }, data: { value } });
}

// Deletes a reading.
export async function deleteReadingById(id: string): Promise<void> {
  await prisma.readings.delete({ where: { id } });
}

// REFUEL EVENTS

// Logs a refuel event.
export async function insertRefuelEvent(row: {
  machine_id: string;
  liters_added: number;
  recorded_at: Date;
  entered_by: string;
  notes: string | null;
}): Promise<refuel_events> {
  return prisma.refuel_events.create({ data: row });
}

// Lists refuel events for one machine, optionally within a date range.
export async function findRefuelEvents(
  machineId: string,
  opts?: { limit?: number; from?: string; to?: string }
): Promise<refuel_events[]> {
  return prisma.refuel_events.findMany({
    where: {
      machine_id: machineId,
      ...(opts?.from || opts?.to
        ? {
            recorded_at: {
              ...(opts?.from ? { gte: new Date(opts.from) } : {}),
              ...(opts?.to ? { lte: new Date(opts.to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { recorded_at: "desc" },
    take: opts?.limit,
  });
}

// FAULT EVENTS

// Logs a fault event.
export async function insertFaultEvent(row: {
  machine_id: string;
  code: string;
  description: string | null;
  recorded_at: Date;
  entered_by: string;
}): Promise<fault_events> {
  return prisma.fault_events.create({ data: row });
}

// Lists fault events for one machine, optionally restricted to the ones
// still unresolved.
export async function findFaultEvents(
  machineId: string,
  opts?: { unresolvedOnly?: boolean; limit?: number }
): Promise<fault_events[]> {
  return prisma.fault_events.findMany({
    where: {
      machine_id: machineId,
      ...(opts?.unresolvedOnly ? { resolved: false } : {}),
    },
    orderBy: { recorded_at: "desc" },
    take: opts?.limit,
  });
}

// Marks a fault event resolved and stamps the resolution time.
export async function updateFaultResolved(id: string): Promise<fault_events> {
  return prisma.fault_events.update({
    where: { id },
    data: { resolved: true, resolved_at: new Date() },
  });
}

// REPORTS

export interface ExportFilters {
  machineId?: string;
  from?: string;
  to?: string;
}

export interface ExportRow {
  machine_name: string | null;
  parameter_label: string | null;
  parameter_unit: string | null;
  value: number;
  recorded_at: Date;
  flagged: boolean;
  entry_method: string;
}

// Returns the full reading history, optionally filtered by machine and/or
// date range, for a CSV export.
export async function findReadingsForExport(filters: ExportFilters): Promise<ExportRow[]> {
  return prisma.$queryRaw<ExportRow[]>`
    select
      m.name as machine_name, p.label as parameter_label, p.unit as parameter_unit,
      r.value, r.recorded_at, r.flagged, r.entry_method
    from readings r
    join machines m on m.id = r.machine_id
    join parameter_definitions p on p.id = r.parameter_id
    where (${filters.machineId ?? null}::uuid is null or r.machine_id = ${filters.machineId ?? null}::uuid)
      and (${filters.from ?? null}::timestamptz is null or r.recorded_at >= ${filters.from ?? null}::timestamptz)
      and (${filters.to ?? null}::text is null or r.recorded_at <= (${filters.to ?? null}::text || 'T23:59:59')::timestamptz)
    order by r.recorded_at asc
  `;
}

// METRICS
//
// Every function below calls a Postgres view or function defined in
// database/full-neon-mvp.sql / database/0002_reconstructed_metrics_and_events.sql
// rather than computing anything in JS — the actual formulas (and which
// ones are real physics versus heuristics not yet validated against real
// failure history) live there, not here.

// Returns mean, volatility, min, and max for one machine and parameter
// over an optional date range.
export async function callGetReadingStats(machineId: string, parameterId: string, from?: string, to?: string) {
  const rows = await prisma.$queryRaw<any[]>`
    select * from get_reading_stats(${machineId}::uuid, ${parameterId}::uuid, ${from ?? null}::timestamptz, ${to ?? null}::timestamptz)
  `;
  return rows[0] ?? null;
}

// Returns one health snapshot row per machine (loading, temperatures,
// health index, maintenance priority, etc.), sorted by maintenance
// priority so the most urgent machine is first.
export async function findFleetHealthSnapshot() {
  return prisma.$queryRaw<any[]>`select * from generator_health_snapshot order by maintenance_priority_score desc`;
}

// Returns the same health snapshot as findFleetHealthSnapshot, but for a
// single machine.
export async function findMachineHealthSnapshot(machineId: string) {
  const rows = await prisma.$queryRaw<any[]>`
    select * from generator_health_snapshot where machine_id = ${machineId}::uuid limit 1
  `;
  return rows[0] ?? null;
}

// Returns how many minutes a machine spent drawing more current than its
// rated_current spec, over an optional date range.
export async function callGetOverloadDuration(machineId: string, from?: string, to?: string) {
  const rows = await prisma.$queryRaw<any[]>`
    select * from get_overload_duration_minutes(${machineId}::uuid, ${from ?? null}::timestamptz, ${to ?? null}::timestamptz)
  `;
  return rows[0] ?? null;
}

// Returns the direction (improving/declining/stable) and slope of a
// machine's power factor over an optional date range — a heuristic
// stand-in for "efficiency trend" since true efficiency needs
// fuel/mechanical-input data this system doesn't have.
export async function callGetPowerFactorTrend(machineId: string, from?: string, to?: string) {
  const rows = await prisma.$queryRaw<any[]>`
    select * from get_power_factor_trend(${machineId}::uuid, ${from ?? null}::timestamptz, ${to ?? null}::timestamptz)
  `;
  return rows[0] ?? null;
}

// Returns a machine's estimated remaining useful life. Always comes back
// as insufficient_data — deliberately not implemented, since a real
// estimate needs a degradation curve calibrated against historical
// failure data that doesn't exist yet.
export async function callGetEstimatedRul(machineId: string) {
  const rows = await prisma.$queryRaw<any[]>`select * from get_estimated_rul(${machineId}::uuid)`;
  return rows[0] ?? null;
}

// Returns reading counts (total and flagged) per machine over the last 7
// days, for a lighter-weight fleet overview than the full health snapshot.
export async function findFleetSummary() {
  return prisma.$queryRaw<any[]>`select * from fleet_summary order by name`;
}

// Returns a machine's real, refuel-aware fuel efficiency (liters per kWh)
// over an optional date range. Returns a note instead of a number when the
// fuel level rose more than the logged refuels explain, rather than
// reporting a misleading figure.
export async function callGetSpecificFuelConsumption(machineId: string, from?: string, to?: string) {
  const rows = await prisma.$queryRaw<any[]>`
    select * from get_specific_fuel_consumption(${machineId}::uuid, ${from ?? null}::timestamptz, ${to ?? null}::timestamptz)
  `;
  return rows[0] ?? null;
}

// Returns how many minutes a machine spent below its idle-load threshold,
// over an optional date range.
export async function callGetIdleDuration(machineId: string, from?: string, to?: string) {
  const rows = await prisma.$queryRaw<any[]>`
    select * from get_idle_duration_minutes(${machineId}::uuid, ${from ?? null}::timestamptz, ${to ?? null}::timestamptz)
  `;
  return rows[0] ?? null;
}

// Returns a rule-based maintenance recommendation (status, confidence, and
// the specific reasons that fired) built from the last sampleSize distinct
// logging visits — explainable by design, not a statistical or ML
// prediction.
export async function callGetMaintenanceRecommendation(machineId: string, sampleSize: number) {
  const rows = await prisma.$queryRaw<any[]>`
    select * from get_maintenance_recommendation(${machineId}::uuid, ${sampleSize}::int)
  `;
  return rows[0] ?? null;
}
