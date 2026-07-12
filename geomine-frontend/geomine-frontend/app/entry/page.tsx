import { backendGetJson } from "@/lib/backend-client-server";
import type { Machine, ParameterDefinition } from "@/types/database";
import { AppShell, DividerLabel } from "@/app/components/geomine-theme";
import EntryForm from "./entry-form";

export default async function EntryPage() {
  const { machines, parameters } = await backendGetJson<{
    machines: Machine[];
    parameters: ParameterDefinition[];
  }>("/api/entry/bootstrap", { machines: [], parameters: [] });

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
