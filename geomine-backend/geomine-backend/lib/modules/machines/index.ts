// Barrel file — every other module keeps importing from
// "@/lib/modules/machines" exactly as before. Internally split across
// machines.repository.ts (raw queries), machines.service.ts (business
// logic, re-exported here), machines.controller.ts (HTTP handlers, wired
// directly into app/api/machines/route.ts).

export { listMachines, getMachine, createMachine, setMachineSpec } from "./machines.service";
