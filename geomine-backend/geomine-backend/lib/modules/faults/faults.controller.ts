import { requireRole } from "@/lib/modules/auth";
import { logFaultEvent, listFaultEvents, resolveFault } from "./faults.service";
import { handleApiError } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

/** POST /api/fault-events — miner, it, or admin. */
export async function logFaultController(request: NextRequest) {
  try {
    const body = await request.json();
    const event = await logFaultEvent({
      machineId: body.machineId,
      code: body.code,
      description: body.description,
      recordedAt: body.recordedAt,
    });
    return NextResponse.json({ event });
  } catch (error) {
    return handleApiError(error);
  }
}

/** GET /api/fault-events?machine_id=...&unresolved_only=true — it/admin only. */
export async function listFaultController(request: NextRequest) {
  try {
    await requireRole(["it", "admin"]);
    const machineId = request.nextUrl.searchParams.get("machine_id");
    if (!machineId) {
      return NextResponse.json({ error: "machine_id query param is required" }, { status: 400 });
    }
    const unresolvedOnly = request.nextUrl.searchParams.get("unresolved_only") === "true";
    const events = await listFaultEvents(machineId, { unresolvedOnly, limit: 50 });
    return NextResponse.json({ events });
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST /api/fault-events/[id]/resolve — it/admin only. */
export async function resolveFaultController(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await resolveFault(params.id);
    return NextResponse.json({ event });
  } catch (error) {
    return handleApiError(error);
  }
}
