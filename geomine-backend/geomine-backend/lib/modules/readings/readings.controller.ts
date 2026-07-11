// Controller layer — parses the request, calls the service, shapes the
// response.

import {
  logReadings,
  listMyReadings,
  correctReading,
  deleteReading,
} from "./readings.service";
import { handleApiError } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

/** POST /api/readings — miner, it, or admin. */
export async function logReadingsController(request: NextRequest) {
  try {
    const body = await request.json();
    const readings = await logReadings({
      machineId: body.machineId,
      recordedAt: body.recordedAt,
      entries: body.entries,
      notes: body.notes,
      latitude: body.latitude,
      longitude: body.longitude,
      locationAccuracyM: body.locationAccuracyM,
    });
    return NextResponse.json({ readings });
  } catch (error) {
    return handleApiError(error);
  }
}

  /** GET /api/readings/mine — a user's own submitted readings. */
export async function myReadingsController(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const rawLimit = limitParam ? parseInt(limitParam, 10) : 50;
    const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 50 : Math.min(rawLimit, 500);
    const readings = await listMyReadings(limit);
    return NextResponse.json({ readings });
  } catch (error) {
    return handleApiError(error);
  }
}

/** PATCH /api/readings/[id] — it/admin, fixes a mis-entered value. */
export async function correctReadingController(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const reading = await correctReading(params.id, body.value);
    return NextResponse.json({ reading });
  } catch (error) {
    return handleApiError(error);
  }
}

/** DELETE /api/readings/[id] — admin only. */
export async function deleteReadingController(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteReading(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
