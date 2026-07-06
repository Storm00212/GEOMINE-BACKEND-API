import { backendGetJson } from "@/lib/backend-client-server";
import type { Machine } from "@/types/database";
import ReportBuilder from "./report-builder";

export default async function ReportsPage() {
  const { machines } = await backendGetJson<{ machines: Machine[] }>("/api/reports/machines", {
    machines: [],
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold">Export data</h1>
      <p className="mt-1 text-sm text-gray-500">
        Download logged readings as a CSV file.
      </p>

      <ReportBuilder machines={machines} />
    </div>
  );
}
