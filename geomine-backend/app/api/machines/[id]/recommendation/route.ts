import { getMaintenanceRecommendation, getMachineHealthSnapshot } from "@/lib/modules/metrics";
import { requireRole } from "@/lib/modules/auth";
import { handleApiError } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

// GET /api/machines/[id]/recommendation
// Returns a rule-based, explainable health assessment for one generator —
// see the SQL comment on get_maintenance_recommendation (migration 0003)
// for exactly how `status` is decided. This is triage guidance built from
// real thresholds and trend rules, not a statistical or ML prediction —
// the `reasons` array is there so it can be checked, not just trusted.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(request, ["it", "admin"]);


    const { searchParams } = new URL(request.url);
    const sampleSizeParam = searchParams.get("sample_size");
    const sampleSize = sampleSizeParam ? parseInt(sampleSizeParam, 10) : 10;

    const [recommendation, snapshot] = await Promise.all([
      getMaintenanceRecommendation(params.id, sampleSize),
      getMachineHealthSnapshot(params.id),
    ]);

    return NextResponse.json({
      machine_id: params.id,
      machine_name: snapshot?.name ?? null,
      recommendation,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
