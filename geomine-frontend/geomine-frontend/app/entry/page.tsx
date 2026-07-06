import { backendGetJson } from "@/lib/backend-client-server";
import type { Machine, ParameterDefinition } from "@/types/database";
import EntryForm from "./entry-form";

export default async function EntryPage() {
  const { machines, parameters } = await backendGetJson<{
    machines: Machine[];
    parameters: ParameterDefinition[];
  }>("/api/entry/bootstrap", { machines: [], parameters: [] });

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-xl font-semibold">Log a reading</h1>
      <p className="mt-1 text-sm text-gray-500">
        Select a generator and enter its current parameter values.
      </p>

      <EntryForm machines={machines} parameters={parameters} />
    </div>
  );
}
