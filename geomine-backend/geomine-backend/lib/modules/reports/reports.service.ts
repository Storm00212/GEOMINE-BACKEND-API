import { selectReadingsForExport, type ExportFilters, type ExportRow } from "./reports.repository";

export type { ExportFilters, ExportRow };

export async function getReadingsForExport(filters: ExportFilters): Promise<ExportRow[]> {
  return selectReadingsForExport(filters);
}

/** Pure formatting — not a database concern, kept in the service layer. */
export function toCsv(rows: ExportRow[]): string {
  const header = "Machine,Parameter,Value,Unit,Recorded At,Flagged,Entry Method\n";

  const body = rows
    .map((r) =>
      [
        r.machines?.name ?? "",
        r.parameter_definitions?.label ?? "",
        r.value,
        r.parameter_definitions?.unit ?? "",
        new Date(r.recorded_at).toISOString(),
        r.flagged ? "yes" : "no",
        r.entry_method,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  return header + body;
}
