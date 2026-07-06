"use client";

import { useState } from "react";
import { backendFetchClient } from "@/lib/backend-client-browser";

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
    <div className="mt-6 space-y-4">
      <div>
        <label className="block text-sm font-medium">Generator</label>
        <select
          value={machineId}
          onChange={(e) => setMachineId(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">All generators</option>
          {machines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={status === "downloading"}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-center text-sm font-medium text-white disabled:opacity-50"
      >
        {status === "downloading" ? "Preparing…" : "Download CSV"}
      </button>

      {status === "error" && (
        <p className="text-sm text-red-600">Couldn't generate the export. Try again.</p>
      )}
    </div>
  );
}
