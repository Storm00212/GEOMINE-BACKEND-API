import { requireRole } from "@/lib/modules/auth";
import { getReadingsForExport, toCsv } from "./reports.service";
import { listMachines } from "@/lib/modules/machines";
import { handleApiError } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

/** GET /api/reports/csv — it/admin only. */
export async function exportCsvController(request: NextRequest) {
  try {
    await requireRole(request, ["it", "admin"]);


    const { searchParams } = request.nextUrl;
    const rows = await getReadingsForExport({
      machineId: searchParams.get("machine_id") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });

    const csv = toCsv(rows);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="geomine-readings-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/** GET /api/reports/machines — it/admin only. Supporting endpoint for the
 *  reports page's machine dropdown; delegates to the machines module
 *  rather than duplicating machine access inside "reports". */
export async function listReportMachinesController(request: NextRequest) {
  try {
    await requireRole(request, ["it", "admin"]);
    const machines = await listMachines();
    return NextResponse.json({ machines });
  } catch (error) {
    return handleApiError(error);
  }
}
