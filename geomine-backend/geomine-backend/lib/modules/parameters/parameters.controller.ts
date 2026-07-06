import { requireAuth } from "@/lib/modules/auth";
import { listParameterDefinitions } from "./parameters.service";
import { handleApiError } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

/** GET /api/parameters — any authenticated user. */
export async function listParametersController(request: NextRequest) {
  try {
    await requireAuth();
    const machineType = request.nextUrl.searchParams.get("machine_type") as "generator" | null;
    const activeOnly = request.nextUrl.searchParams.get("active_only") === "true";

    const parameters = await listParameterDefinitions({
      machineType: machineType ?? undefined,
      activeOnly,
    });
    return NextResponse.json({ parameters });
  } catch (error) {
    return handleApiError(error);
  }
}
