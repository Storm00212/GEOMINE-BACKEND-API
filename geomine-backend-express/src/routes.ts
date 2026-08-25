import { Router } from "express";
import { requireAuth, requireRole } from "./middleware";
import * as c from "./controllers";

export const router = Router();

// AUTH
router.post("/auth/login", c.loginController);
router.post("/auth/signup", c.signupController);
router.get("/auth/me", requireAuth, c.meController);

// MACHINES
// NOTE: the old Next.js backend has no auth check here at all, fixed to require an authenticated user.
router.get("/machines", requireAuth, c.listMachinesController);
router.post("/machines", requireRole(["admin"]), c.createMachineController);
router.get("/machines/:id/detail", requireRole(["it", "admin"]), c.machineDetailController);
router.get("/machines/:id/recommendation", requireRole(["it", "admin"]), c.machineRecommendationController);

// PARAMETERS
router.get("/parameters", requireAuth, c.listParametersController);

// READINGS
router.post("/readings", requireRole(["miner", "it", "admin"]), c.logReadingsController);
router.get("/readings/mine", requireRole(["miner", "it", "admin"]), c.myReadingsController);
router.patch("/readings/:id", requireRole(["it", "admin"]), c.correctReadingController);
router.delete("/readings/:id", requireRole(["admin"]), c.deleteReadingController);

// REFUEL EVENTS
router.post("/refuel-events", requireRole(["miner", "it", "admin"]), c.logRefuelController);
router.get("/refuel-events", requireRole(["it", "admin"]), c.listRefuelController);

// FAULT EVENTS
router.post("/fault-events", requireRole(["miner", "it", "admin"]), c.logFaultController);
router.get("/fault-events", requireRole(["it", "admin"]), c.listFaultController);
router.post("/fault-events/:id/resolve", requireRole(["it", "admin"]), c.resolveFaultController);

// DASHBOARD / ENTRY BOOTSTRAP (COMPOSITE)
router.get("/dashboard", requireRole(["it", "admin"]), c.dashboardController);
router.get("/entry/bootstrap", requireAuth, c.entryBootstrapController);

// METRICS
router.get("/metrics/fleet-snapshot", requireRole(["it", "admin"]), c.fleetSnapshotController);
router.get("/metrics/machine/:id", requireRole(["it", "admin"]), c.machineSnapshotController);

// REPORTS
router.get("/reports/csv", requireRole(["it", "admin"]), c.exportCsvController);
router.get("/reports/machines", requireRole(["it", "admin"]), c.listReportMachinesController);

// ADMIN
router.post("/admin/invite", requireRole(["admin"]), c.inviteUserController);
