import type { ExportRow } from "./repositories";

const CSV_HEADER = "Machine,Parameter,Value,Unit,Recorded At,Flagged,Entry Method\n";

export function toCsv(rows: ExportRow[]): string {
  const body = rows
    .map((row) =>
      [
        row.machine_name ?? "",
        row.parameter_label ?? "",
        row.value,
        row.parameter_unit ?? "",
        new Date(row.recorded_at).toISOString(),
        row.flagged ? "yes" : "no",
        row.entry_method,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  return CSV_HEADER + body;
}