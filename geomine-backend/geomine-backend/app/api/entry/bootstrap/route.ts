import { listMachines } from "@/lib/modules/machines";
import { listParameterDefinitions } from "@/lib/modules/parameters";
import { requireAuth } from "@/lib/modules/auth";
import { handleApiError } from "@/lib/http";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/entry/bootstrap
// Everything the entry form needs in one call: active machines + active
// generator parameters. Any authenticated role can read this (miners need
// it to render the form).
export async function GET(request: Request) {
  try {
    await requireAuth(request);


    const [machines, parameters] = await Promise.all([
      listMachines({ activeOnly: true }),
      listParameterDefinitions({ machineType: "generator", activeOnly: true }),
    ]);

    return NextResponse.json({ machines, parameters });
  } catch (error) {
    return handleApiError(error);
  }
}
