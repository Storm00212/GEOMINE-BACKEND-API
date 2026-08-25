"use client";

import { useBackendData } from "@/lib/use-backend-data";
import type { Machine } from "@/types/database";
import { AppShell } from "@/app/components/geomine-theme";
import ReportBuilder from "./report-builder";

export default function ReportsPage() {
  const { data, loading } = useBackendData<{ machines: Machine[] }>("/api/reports/machines", {
    machines: [],
  });
  const { machines } = data;

  if (loading) {
    return (
      <AppShell active="reports">
        <p className="px-2 py-6 text-[13px] text-ink-faint">Loading…</p>
      </AppShell>
    );
  }

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
