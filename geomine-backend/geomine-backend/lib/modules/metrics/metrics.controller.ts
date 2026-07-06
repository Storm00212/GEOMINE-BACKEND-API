import { requireRole } from "@/lib/modules/auth";
import { getFleetHealthSnapshot, getMachineHealthSnapshot } from "./metrics.service";
import { handleApiError } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

/** GET /api/metrics/fleet-snapshot — it/admin only. */
export async function fleetSnapshotController() {
  try {
    await requireRole(["it", "admin"]);
    const snapshot = await getFleetHealthSnapshot();
    return NextResponse.json({ snapshot });
  } catch (error) {
    return handleApiError(error);
  }
}

/** GET /api/metrics/machine/[id] — it/admin only. Just the snapshot row —
 *  for the fuller bundle (readings, faults, recommendation, etc.) see
 *  /api/machines/[id]/detail instead. */
export async function machineSnapshotController(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(["it", "admin"]);
    const snapshot = await getMachineHealthSnapshot(params.id);
    return NextResponse.json({ snapshot });
  } catch (error) {
    return handleApiError(error);
  }
}
