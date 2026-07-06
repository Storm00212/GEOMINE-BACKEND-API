// Controller layer — parses the request, calls the service, shapes the
// response. No business logic beyond that.

import { listMachines, createMachine } from "./machines.service";
import { handleApiError } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

/** GET /api/machines — any authenticated user. */
export async function listMachinesController(request: NextRequest) {
  try {
    const activeOnly = request.nextUrl.searchParams.get("active_only") === "true";
    const machines = await listMachines({ activeOnly });
    return NextResponse.json({ machines });
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST /api/machines — admin only (enforced in the service layer). */
export async function createMachineController(request: NextRequest) {
  try {
    const body = await request.json();
    const machine = await createMachine({
      name: body.name,
      location: body.location,
      phaseType: body.phaseType,
    });
    return NextResponse.json({ machine });
  } catch (error) {
    return handleApiError(error);
  }
}
