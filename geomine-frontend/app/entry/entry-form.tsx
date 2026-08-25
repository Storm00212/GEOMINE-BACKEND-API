"use client";

import { useState } from "react";
import { backendFetchClient } from "@/lib/backend-client-browser";
import type { Machine, ParameterDefinition } from "@/types/database";
import { Field, TextInput, SelectInput, Button, DividerLabel, Card, AuthMessage } from "@/app/components/geomine-theme";

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
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Generator" htmlFor="machine">
          <SelectInput
            id="machine"
            required
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
          >
            <option value="">Select a generator…</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.location ? `— ${m.location}` : ""}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field
          label="Reading time"
          htmlFor="recordedAt"
          hint="Defaults to now — change this if you're logging an earlier shift."
        >
          <TextInput
            id="recordedAt"
            type="datetime-local"
            required
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
          />
        </Field>

        <DividerLabel>Generator parameters</DividerLabel>
        <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
          {genParams.map((p) => (
            <Field
              key={p.id}
              label={p.label}
              htmlFor={`param-${p.id}`}
            >
              <div className="flex items-center gap-2">
                <TextInput
                  id={`param-${p.id}`}
                  type="number"
                  step="any"
                  value={values[p.id] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [p.id]: e.target.value }))}
                  placeholder="—"
                />
                {p.unit && (
                  <span className="w-10 shrink-0 font-mono text-[11px] text-ink-faint">
                    {p.unit}
                  </span>
                )}
              </div>
            </Field>
          ))}
        </div>

        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Submit reading"}
        </Button>

        {status === "saved" && (
          <AuthMessage status="success" message="Reading logged successfully." />
        )}
        {status === "error" && <AuthMessage status="error" message={errorMsg} />}
      </form>
    </Card>
  );
}
