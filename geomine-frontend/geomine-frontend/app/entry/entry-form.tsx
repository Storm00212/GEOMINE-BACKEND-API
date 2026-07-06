"use client";

import { useState } from "react";
import { backendFetchClient } from "@/lib/backend-client-browser";
import type { Machine, ParameterDefinition } from "@/types/database";

function nowForInput() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function EntryForm({
  machines,
  parameters,
}: {
  machines: Machine[];
  parameters: ParameterDefinition[];
}) {
  const [machineId, setMachineId] = useState("");
  const [recordedAt, setRecordedAt] = useState(nowForInput());
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const genParams = parameters.filter((p) => p.machine_type === "generator");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!machineId) return;

    const entries = genParams
      .filter((p) => values[p.id] !== undefined && values[p.id] !== "")
      .map((p) => ({ parameterId: p.id, value: Number(values[p.id]) }));

    if (entries.length === 0) return;

    setStatus("saving");

    const res = await backendFetchClient("/api/readings", {
      method: "POST",
      body: JSON.stringify({
        machineId,
        recordedAt: new Date(recordedAt).toISOString(),
        entries,
      }),
    });

    if (res.ok) {
      setStatus("saved");
      setValues({});
    } else {
      const body = await res.json().catch(() => ({}));
      setErrorMsg(body.error ?? "Something went wrong. Try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div>
        <label className="block text-sm font-medium">Generator</label>
        <select
          required
          value={machineId}
          onChange={(e) => setMachineId(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Select a generator…</option>
          {machines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} {m.location ? `— ${m.location}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Reading time</label>
        <input
          type="datetime-local"
          required
          value={recordedAt}
          onChange={(e) => setRecordedAt(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-gray-400">
          Defaults to now — change this if you're logging an earlier shift.
        </p>
      </div>

      <div className="space-y-3">
        {genParams.map((p) => (
          <div key={p.id}>
            <label className="block text-sm font-medium">
              {p.label} {p.unit ? <span className="text-gray-400">({p.unit})</span> : null}
            </label>
            <input
              type="number"
              step="any"
              value={values[p.id] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [p.id]: e.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={status === "saving"}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Submit reading"}
      </button>

      {status === "saved" && (
        <p className="text-sm text-green-600">Reading logged successfully.</p>
      )}
      {status === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}
    </form>
  );
}
