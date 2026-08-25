"use client";

import { useState } from "react";
import { backendFetchClient } from "@/lib/backend-client-browser";
import { Card, Field, TextInput, SelectInput, Button, DividerLabel, AuthMessage } from "@/app/components/geomine-theme";

export default function ReportBuilder({
  machines,
}: {
  machines: { id: string; name: string }[];
}) {
  const [machineId, setMachineId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<"idle" | "downloading" | "error">("idle");

  // The CSV download can't be a plain <a href> anymore — a normal browser
  // navigation to a cross-origin URL carries no Authorization header, so
  // the backend would just 401 it. Instead: fetch it with the token
  // attached, turn the response into a Blob, and trigger the download via
  // a temporary object URL. Slightly more code, but it's what a genuinely
  // authenticated cross-origin file download requires.
  async function handleDownload() {
    setStatus("downloading");

    const params = new URLSearchParams();
    if (machineId !== "all") params.set("machine_id", machineId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const res = await backendFetchClient(`/api/reports/csv?${params.toString()}`);

    if (!res.ok) {
      setStatus("error");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `geomine-readings-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setStatus("idle");
  }

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleDownload();
        }}
        className="space-y-4"
      >
        <Field label="Generator" htmlFor="machine">
          <SelectInput value={machineId} onChange={(e) => setMachineId(e.target.value)}>
            <option value="all">All generators</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </SelectInput>
        </Field>

        <DividerLabel>Date range</DividerLabel>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From" htmlFor="from">
            <TextInput id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To" htmlFor="to">
            <TextInput id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>

        <Button type="submit" disabled={status === "downloading"}>
          {status === "downloading" ? "Preparing…" : "Download CSV"}
        </Button>

        {status === "error" && (
          <AuthMessage status="error" message="Couldn't generate the export. Try again." />
        )}
      </form>
    </Card>
  );
}
