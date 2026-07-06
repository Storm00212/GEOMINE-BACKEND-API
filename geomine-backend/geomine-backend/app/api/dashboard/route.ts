import { listMachines } from "@/lib/modules/machines";
import { listRecentReadings, listFlaggedReadings } from "@/lib/modules/readings";
import { getFleetHealthSnapshot } from "@/lib/modules/metrics";
import { requireRole } from "@/lib/modules/auth";
import { handleApiError } from "@/lib/http";
import { NextResponse } from "next/server";

// GET /api/dashboard
// Bundles everything the fleet overview page needs into one round-trip
// instead of four separate calls — meaningful on a mobile network, and one
// less thing for the frontend to coordinate loading states for.
export async function GET() {
  try {
    await requireRole(["it", "admin"]);

    const [machines, recentReadings, flaggedReadings, fleetSnapshot] = await Promise.all([
      listMachines(),
      listRecentReadings(20),
      listFlaggedReadings(10),
      getFleetHealthSnapshot(),
    ]);

    return NextResponse.json({ machines, recentReadings, flaggedReadings, fleetSnapshot });
  } catch (error) {
    return handleApiError(error);
  }
}
