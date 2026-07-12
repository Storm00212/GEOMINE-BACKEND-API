import { backendGetJson } from "@/lib/backend-client-server";
import type { Machine } from "@/types/database";
import { AppShell } from "@/app/components/geomine-theme";
import ReportBuilder from "./report-builder";

export default async function ReportsPage() {
  const { machines } = await backendGetJson<{ machines: Machine[] }>("/api/reports/machines", {
    machines: [],
  });

  return (
    <AppShell active="reports">
      <h1 className="text-[19px] font-semibold">Export data</h1>
      <p className="mb-6 mt-1 text-[13px] text-ink-dim">
        Download logged readings as a CSV file.
      </p>

      <ReportBuilder machines={machines} />
    </AppShell>
  );
}
