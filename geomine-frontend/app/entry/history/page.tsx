"use client";

import { useBackendData } from "@/lib/use-backend-data";
import { backendFetchClient } from "@/lib/backend-client-browser";
import { AppShell, Card, DividerLabel, ListRow, Badge } from "@/app/components/geomine-theme";

interface CurrentUserData {
  profile: { role: string } | null;
}

export default function EntryHistoryPage() {
  const { data, loading, refetch } = useBackendData<{ readings: any[] }>("/api/readings/mine?limit=50", {
    readings: [],
  });
  const { data: currentUser } = useBackendData<CurrentUserData>("/api/auth/me", {
    profile: null,
  });
  const { readings } = data;
  const isAdmin = currentUser.profile?.role === "admin";

  if (loading) {
    return (
      <AppShell active="entry">
        <p className="px-2 py-6 text-[13px] text-ink-faint">Loading…</p>
      </AppShell>
    );
  }

  async function handleDeleteReading(id: string) {
    if (!window.confirm("Delete this reading?")) return;
    await backendFetchClient(`/api/readings/${id}`, { method: "DELETE" });
    refetch();
  }

  return (
    <AppShell active="entry">
      <h1 className="text-[19px] font-semibold">Your recent entries</h1>
      <p className="mb-6 mt-1 text-[13px] text-ink-dim">
        The last {readings.length} reading{readings.length === 1 ? "" : "s"} you logged.
      </p>

      <Card>
        {readings.map((r: any) => (
          <ListRow key={r.id}>
            <span className="min-w-0 flex items-center gap-2">
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
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteReading(r.id);
                }}
                className="rounded-md border border-line bg-red-dim px-2 py-1 text-[11px] font-semibold text-red hover:bg-red/10 transition"
                aria-label="Delete reading"
              >
                Delete
              </button>
            )}
          </ListRow>
        ))}
        {readings.length === 0 && (
          <p className="px-2 py-4 text-[13px] text-ink-faint">No entries yet.</p>
        )}
      </Card>
    </AppShell>
  );
}
