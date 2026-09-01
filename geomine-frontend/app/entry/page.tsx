"use client";

import { useBackendData } from "@/lib/use-backend-data";
import type { Machine, ParameterDefinition } from "@/types/database";
import { AppShell, DividerLabel } from "@/app/components/geomine-theme";
import EntryForm from "./entry-form";

export default function EntryPage() {
  const { data, loading } = useBackendData<{
    machines: Machine[];
    parameters: ParameterDefinition[];
  }>("/api/entry/bootstrap", { machines: [], parameters: [] });
  const { machines, parameters } = data;

  if (loading) {
    return (
      <AppShell active="entry">
        <p className="px-2 py-6 text-[13px] text-ink-faint">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell active="entry">
      <h1 className="text-[19px] font-semibold">Log a reading</h1>
      <p className="mb-6 mt-1 text-[13px] text-ink-dim">
        Select a generator and enter its current parameter values.
      </p>

      <EntryForm machines={machines} parameters={parameters} />
    </AppShell>
  );
}
