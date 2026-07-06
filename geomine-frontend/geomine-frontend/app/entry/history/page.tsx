import { backendGetJson } from "@/lib/backend-client-server";

export default async function EntryHistoryPage() {
  const { readings } = await backendGetJson<{ readings: any[] }>("/api/readings/mine?limit=50", {
    readings: [],
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold">Your recent entries</h1>

      <div className="mt-6 divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
        {readings.map((r: any) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{r.machines?.name}</p>
              <p className="text-gray-500">
                {r.parameter_definitions?.label}: {r.value} {r.parameter_definitions?.unit}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(r.recorded_at).toLocaleString()}
              </p>
            </div>
            {r.flagged && (
              <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                Out of range
              </span>
            )}
          </div>
        ))}
        {readings.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-400">No entries yet.</p>
        )}
      </div>
    </div>
  );
}
