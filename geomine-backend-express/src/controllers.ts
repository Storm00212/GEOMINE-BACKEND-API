import type { Request, Response } from "express";
import { handleApiError } from "./middleware";
import * as services from "./services";

// AUTH

// Verifies credentials and returns a signed access token.
// POST /api/auth/login
export async function loginController(req: Request, res: Response): Promise<void> {
  try {
    const result = await services.loginUser(req.body?.email, req.body?.password);
    res.json(result);
  } catch (error) {
    handleApiError(error, res);
  }
}

// Creates a new account and returns a signed access token.
// POST /api/auth/signup
export async function signupController(req: Request, res: Response): Promise<void> {
  try {
    const result = await services.signupUser(req.body?.email, req.body?.password, req.body?.role);
    res.json(result);
  } catch (error) {
    handleApiError(error, res);
  }
}

// Returns who is currently authenticated and their role.
// GET /api/auth/me
export async function meController(req: Request, res: Response): Promise<void> {
  try {
    const result = await services.getCurrentUser(req.auth!);
    res.json(result);
  } catch (error) {
    handleApiError(error, res);
  }
}

// MACHINES

// Lists machines, optionally active only.
// GET /api/machines
export async function listMachinesController(req: Request, res: Response): Promise<void> {
  try {
    const activeOnly = req.query.active_only === "true";
    const machines = await services.listMachines({ activeOnly });
    res.json({ machines });
  } catch (error) {
    handleApiError(error, res);
  }
}

// Creates a new machine.
// POST /api/machines
export async function createMachineController(req: Request, res: Response): Promise<void> {
  try {
    const machine = await services.createMachine({
      name: req.body?.name,
      location: req.body?.location,
      phaseType: req.body?.phaseType,
    });
    res.json({ machine });
  } catch (error) {
    handleApiError(error, res);
  }
}

// PARAMETERS

// Lists the parameter catalog.
// GET /api/parameters
export async function listParametersController(req: Request, res: Response): Promise<void> {
  try {
    const machineType = (req.query.machine_type as "generator" | undefined) ?? undefined;
    const activeOnly = req.query.active_only === "true";
    const parameters = await services.listParameterDefinitions({ machineType, activeOnly });
    res.json({ parameters });
  } catch (error) {
    handleApiError(error, res);
  }
}

// READINGS

// Logs one or more parameter readings for a machine at a single timestamp.
// POST /api/readings
export async function logReadingsController(req: Request, res: Response): Promise<void> {
  try {
    const readings = await services.logReadings(
      {
        machineId: req.body?.machineId,
        recordedAt: req.body?.recordedAt,
        entries: req.body?.entries,
        notes: req.body?.notes,
        latitude: req.body?.latitude,
        longitude: req.body?.longitude,
        locationAccuracyM: req.body?.locationAccuracyM,
      },
      req.auth!
    );
    res.json({ readings });
  } catch (error) {
    handleApiError(error, res);
  }
}

// Returns the current user's own submitted readings.
// GET /api/readings/mine
export async function myReadingsController(req: Request, res: Response): Promise<void> {
  try {
    const limitParam = req.query.limit as string | undefined;
    const rawLimit = limitParam ? parseInt(limitParam, 10) : 50;
    const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 50 : Math.min(rawLimit, 500);
    const readings = await services.listMyReadings(limit, req.auth!);
    res.json({ readings });
  } catch (error) {
    handleApiError(error, res);
  }
}

// Corrects a mis-entered reading value.
// PATCH /api/readings/:id
export async function correctReadingController(req: Request, res: Response): Promise<void> {
  try {
    const reading = await services.correctReading(req.params.id, req.body?.value);
    res.json({ reading });
  } catch (error) {
    handleApiError(error, res);
  }
}

// Deletes a reading.
// DELETE /api/readings/:id
export async function deleteReadingController(req: Request, res: Response): Promise<void> {
  try {
    await services.deleteReading(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    handleApiError(error, res);
  }
}

// REFUEL EVENTS

// Logs a refuel event.
// POST /api/refuel-events
export async function logRefuelController(req: Request, res: Response): Promise<void> {
  try {
    const event = await services.logRefuelEvent(
      {
        machineId: req.body?.machineId,
        litersAdded: req.body?.litersAdded,
        recordedAt: req.body?.recordedAt,
        notes: req.body?.notes,
      },
      req.auth!
    );
    res.json({ event });
  } catch (error) {
    handleApiError(error, res);
  }
}

// Lists refuel events for one machine, given as the machine_id query param.
// GET /api/refuel-events
export async function listRefuelController(req: Request, res: Response): Promise<void> {
  try {
    const machineId = req.query.machine_id as string | undefined;
    if (!machineId) {
      res.status(400).json({ error: "machine_id query param is required" });
      return;
    }
    const events = await services.listRefuelEvents(machineId, {
      limit: 50,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    });
    res.json({ events });
  } catch (error) {
    handleApiError(error, res);
  }
}

// FAULT EVENTS

// Logs a fault event.
// POST /api/fault-events
export async function logFaultController(req: Request, res: Response): Promise<void> {
  try {
    const event = await services.logFaultEvent(
      {
        machineId: req.body?.machineId,
        code: req.body?.code,
        description: req.body?.description,
        recordedAt: req.body?.recordedAt,
      },
      req.auth!
    );
    res.json({ event });
  } catch (error) {
    handleApiError(error, res);
  }
}

// Lists fault events for one machine, given as the machine_id query param,
// optionally restricted to unresolved ones via unresolved_only=true.
// GET /api/fault-events
export async function listFaultController(req: Request, res: Response): Promise<void> {
  try {
    const machineId = req.query.machine_id as string | undefined;
    if (!machineId) {
      res.status(400).json({ error: "machine_id query param is required" });
      return;
    }
    const unresolvedOnly = req.query.unresolved_only === "true";
    const events = await services.listFaultEvents(machineId, { unresolvedOnly, limit: 50 });
    res.json({ events });
  } catch (error) {
    handleApiError(error, res);
  }
}

// Marks a fault event resolved.
// POST /api/fault-events/:id/resolve
export async function resolveFaultController(req: Request, res: Response): Promise<void> {
  try {
    const event = await services.resolveFault(req.params.id);
    res.json({ event });
  } catch (error) {
    handleApiError(error, res);
  }
}

// DASHBOARD / ENTRY BOOTSTRAP (COMPOSITE)

// Bundles the fleet dashboard's machines, recent readings, flagged
// readings, and health snapshot into one round-trip, instead of the
// frontend making four separate calls and coordinating four loading states.
// GET /api/dashboard
export async function dashboardController(req: Request, res: Response): Promise<void> {
  try {
    const [machines, recentReadings, flaggedReadings, fleetSnapshot] = await Promise.all([
      services.listMachines(),
      services.listRecentReadings(20),
      services.listFlaggedReadings(10),
      services.getFleetHealthSnapshot(),
    ]);
    res.json({ machines, recentReadings, flaggedReadings, fleetSnapshot });
  } catch (error) {
    handleApiError(error, res);
  }
}

// Bundles the active machines and active parameters the entry form needs
// into one call.
// GET /api/entry/bootstrap
export async function entryBootstrapController(req: Request, res: Response): Promise<void> {
  try {
    const [machines, parameters] = await Promise.all([
      services.listMachines({ activeOnly: true }),
      services.listParameterDefinitions({ machineType: "generator", activeOnly: true }),
    ]);
    res.json({ machines, parameters });
  } catch (error) {
    handleApiError(error, res);
  }
}

// METRICS

// Returns the health snapshot for every machine.
// GET /api/metrics/fleet-snapshot
export async function fleetSnapshotController(req: Request, res: Response): Promise<void> {
  try {
    const snapshot = await services.getFleetHealthSnapshot();
    res.json({ snapshot });
  } catch (error) {
    handleApiError(error, res);
  }
}

// Returns the health snapshot for one machine.
// GET /api/metrics/machine/:id
export async function machineSnapshotController(req: Request, res: Response): Promise<void> {
  try {
    const snapshot = await services.getMachineHealthSnapshot(req.params.id);
    res.json({ snapshot });
  } catch (error) {
    handleApiError(error, res);
  }
}

// MACHINE DETAIL / RECOMMENDATION (COMPOSITE)

// Bundles everything the machine detail page needs — the machine, its
// reading history, the parameter catalog, its health snapshot, and every
// metric (overload/idle duration, power factor trend, RUL, fuel
// consumption, maintenance recommendation, open faults) — into one call.
// GET /api/machines/:id/detail
export async function machineDetailController(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const [
      machine,
      readings,
      parameters,
      snapshot,
      overload,
      pfTrend,
      rul,
      fuelConsumption,
      idle,
      recommendation,
      openFaults,
    ] = await Promise.all([
      services.getMachine(id),
      services.listReadingsForMachine(id, { limit: 500 }),
      services.listParameterDefinitions({ machineType: "generator" }),
      services.getMachineHealthSnapshot(id),
      services.getOverloadDuration(id),
      services.getPowerFactorTrend(id),
      services.getEstimatedRul(id),
      services.getSpecificFuelConsumption(id),
      services.getIdleDuration(id),
      services.getMaintenanceRecommendation(id),
      services.listFaultEvents(id, { unresolvedOnly: true }),
    ]);

    res.json({
      machine,
      readings,
      parameters,
      snapshot,
      overload,
      pfTrend,
      rul,
      fuelConsumption,
      idle,
      recommendation,
      openFaults,
    });
  } catch (error) {
    handleApiError(error, res);
  }
}

// Returns a rule-based, explainable maintenance recommendation for one
// machine, with the optional sample_size query param controlling how many
// recent logging visits it considers.
// GET /api/machines/:id/recommendation
export async function machineRecommendationController(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const sampleSizeParam = req.query.sample_size as string | undefined;
    const sampleSize = sampleSizeParam ? parseInt(sampleSizeParam, 10) : 10;

    const [recommendation, snapshot] = await Promise.all([
      services.getMaintenanceRecommendation(id, sampleSize),
      services.getMachineHealthSnapshot(id),
    ]);

    res.json({ machine_id: id, machine_name: snapshot?.name ?? null, recommendation });
  } catch (error) {
    handleApiError(error, res);
  }
}

// REPORTS

// Exports logged readings, optionally filtered by machine and/or date
// range, as a downloadable CSV file.
// GET /api/reports/csv
export async function exportCsvController(req: Request, res: Response): Promise<void> {
  try {
    const rows = await services.getReadingsForExport({
      machineId: req.query.machine_id as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    });
    const csv = services.toCsv(rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="geomine-readings-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    handleApiError(error, res);
  }
}

// Lists machines for the reports page's machine dropdown.
// GET /api/reports/machines
export async function listReportMachinesController(req: Request, res: Response): Promise<void> {
  try {
    const machines = await services.listMachines();
    res.json({ machines });
  } catch (error) {
    handleApiError(error, res);
  }
}

// ADMIN

// Creates an invited user and returns their email plus a generated
// temporary password, for the admin to relay to them.
// POST /api/admin/invite
export async function inviteUserController(req: Request, res: Response): Promise<void> {
  try {
    const result = await services.inviteUser({
      email: req.body?.email,
      fullName: req.body?.full_name,
      role: req.body?.role,
    });
    res.json({ ok: true, ...result });
  } catch (error) {
    handleApiError(error, res);
  }
}
