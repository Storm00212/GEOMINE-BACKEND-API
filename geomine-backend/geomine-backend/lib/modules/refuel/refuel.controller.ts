import { requireRole } from "@/lib/modules/auth";
import { logRefuelEvent, listRefuelEvents } from "./refuel.service";
import { handleApiError } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

/** POST /api/refuel-events — miner, it, or admin. */
export async function logRefuelController(request: NextRequest) {
  try {
    const body = await request.json();
    const event = await logRefuelEvent({
      machineId: body.machineId,
      litersAdded: body.litersAdded,
      recordedAt: body.recordedAt,
      notes: body.notes,
    });
    return NextResponse.json({ event });
  } catch (error) {
    return handleApiError(error);
  }
}

/** GET /api/refuel-events?machine_id=... — it/admin only. */
export async function listRefuelController(request: NextRequest) {
  try {
    await requireRole(["it", "admin"]);
    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get("machine_id");
    if (!machineId) {
      return NextResponse.json({ error: "machine_id query param is required" }, { status: 400 });
    }
    const events = await listRefuelEvents(machineId, {
      limit: 50,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });
    return NextResponse.json({ events });
  } catch (error) {
    return handleApiError(error);
  }
}
