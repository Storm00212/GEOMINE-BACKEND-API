import { getMachine } from "@/lib/modules/machines";
import { listReadingsForMachine } from "@/lib/modules/readings";
import { listParameterDefinitions } from "@/lib/modules/parameters";
import { listFaultEvents } from "@/lib/modules/faults";
import {
  getMachineHealthSnapshot,
  getOverloadDuration,
  getPowerFactorTrend,
  getEstimatedRul,
  getSpecificFuelConsumption,
  getIdleDuration,
  getMaintenanceRecommendation,
} from "@/lib/modules/metrics";
import { requireRole } from "@/lib/modules/auth";
import { handleApiError } from "@/lib/http";
import { NextResponse } from "next/server";

// GET /api/machines/[id]/detail
// Bundles everything the per-machine page needs — machine info, readings,
// parameter catalog, the full metrics snapshot, and the maintenance
// recommendation — into one round-trip instead of the ten separate calls
// this used to be as direct in-process module calls.
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(request, ["it", "admin"]);


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
      getMachine(params.id),
      listReadingsForMachine(params.id, { limit: 500 }),
      listParameterDefinitions({ machineType: "generator" }),
      getMachineHealthSnapshot(params.id),
      getOverloadDuration(params.id),
      getPowerFactorTrend(params.id),
      getEstimatedRul(params.id),
      getSpecificFuelConsumption(params.id),
      getIdleDuration(params.id),
      getMaintenanceRecommendation(params.id),
      listFaultEvents(params.id, { unresolvedOnly: true }),
    ]);

    return NextResponse.json({
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
    return handleApiError(error);
  }
}
