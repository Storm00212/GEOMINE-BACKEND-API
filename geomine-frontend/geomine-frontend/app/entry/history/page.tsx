import { backendGetJson } from "@/lib/backend-client-server";
import { AppShell, Card, DividerLabel, ListRow, Badge } from "@/app/components/geomine-theme";

export default async function EntryHistoryPage() {
  const { readings } = await backendGetJson<{ readings: any[] }>("/api/readings/mine?limit=50", {
    readings: [],
  });

  return (
    <AppShell active="entry">
      <h1 className="text-[19px] font-semibold">Your recent entries</h1>
      <p className="mb-6 mt-1 text-[13px] text-ink-dim">
        The last {readings.length} reading{readings.length === 1 ? "" : "s"} you logged.
      </p>

      <Card>
        {readings.map((r: any) => (
          <ListRow key={r.id}>
            <span className="min-w-0">
              <span className="font-medium text-ink">{r.machines?.name}</span> —{" "}
              {r.parameter_definitions?.label}:{" "}
              <span className="font-mono">
                {r.value} {r.parameter_definitions?.unit}
              </span>
              <span className="ml-2 font-mono text-[11px] text-ink-faint">
                {new Date(r.recorded_at).toLocaleString()}
              </span>
            </span>
            {r.flagged && <Badge tone="red">OUT OF RANGE</Badge>}
          </ListRow>
        ))}
        {readings.length === 0 && (
          <p className="px-2 py-4 text-[13px] text-ink-faint">No entries yet.</p>
        )}
      </Card>
    </AppShell>
  );
}
