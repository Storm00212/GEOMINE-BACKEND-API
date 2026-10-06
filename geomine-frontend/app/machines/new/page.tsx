"use client";

import { useState } from "react";
import Link from "next/link";
import { backendFetchClient } from "@/lib/backend-client-browser";
import { useBackendData } from "@/lib/use-backend-data";
import type { Machine } from "@/types/database";
import {
  AppShell,
  AuthMessage,
  Button,
  Card,
  Field,
  SelectInput,
  TextInput,
} from "@/app/components/geomine-theme";

interface CurrentUserData {
  profile: { role: string } | null;
}

interface CreateMachineResponse {
  machine: Machine;
}

export default function NewGeneratorPage() {
  const { data: currentUser, loading: authLoading } = useBackendData<CurrentUserData>(
    "/api/auth/me",
    { profile: null }
  );
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [phaseType, setPhaseType] = useState<Machine["phase_type"]>("three_phase");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdMachine, setCreatedMachine] = useState<Machine | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a generator name.");
      return;
    }

    setSubmitting(true);
    setError("");
    setCreatedMachine(null);

    try {
      const response = await backendFetchClient("/api/machines", {
        method: "POST",
        body: JSON.stringify({
          name: trimmedName,
          location: location.trim() || undefined,
          phaseType,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as
        | CreateMachineResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error("error" in body ? body.error || "Unable to add generator." : "Unable to add generator.");
      }
      if (!("machine" in body) || !body.machine?.id) {
        throw new Error("The backend did not return the created generator.");
      }

      setCreatedMachine(body.machine);
      setName("");
      setLocation("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to add generator.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <AppShell active="machines">
        <p className="px-2 py-6 text-[13px] text-ink-faint">Checking administrator access…</p>
      </AppShell>
    );
  }

  if (currentUser.profile?.role !== "admin") {
    return (
      <AppShell active="machines">
        <h1 className="text-[19px] font-semibold">Add generator</h1>
        <Card className="mt-5">
          <AuthMessage status="error" message="Only administrators can add generators." />
          <Link
            href="/machines"
            className="mt-4 inline-flex rounded-md border border-line px-3 py-2 text-[12.5px] font-medium text-ink-dim transition hover:bg-panel-alt hover:text-ink"
          >
            Back to generators
          </Link>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell active="machines">
      <Link
        href="/machines"
        className="mb-4 inline-flex text-[12px] font-medium text-ink-dim transition hover:text-cyan"
      >
        ← Generators
      </Link>
      <h1 className="text-[19px] font-semibold">Add generator</h1>
      <p className="mb-6 mt-1 text-[13px] text-ink-dim">
        Register a generator in the fleet to begin tracking its readings and health.
      </p>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Generator name" htmlFor="generator-name">
            <TextInput
              id="generator-name"
              autoComplete="off"
              maxLength={120}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Crusher 01"
            />
          </Field>

          <Field label="Site or location" htmlFor="generator-location" hint="Optional">
            <TextInput
              id="generator-location"
              autoComplete="off"
              maxLength={160}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="e.g. North processing plant"
            />
          </Field>

          <Field label="Electrical phase" htmlFor="phase-type">
            <SelectInput
              id="phase-type"
              value={phaseType}
              onChange={(event) => setPhaseType(event.target.value as Machine["phase_type"])}
            >
              <option value="three_phase">Three phase</option>
              <option value="single_phase">Single phase</option>
            </SelectInput>
          </Field>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Adding generator…" : "Add generator"}
          </Button>

          {error && <AuthMessage status="error" message={error} />}
          {createdMachine && (
            <div>
              <AuthMessage
                status="success"
                message={`${createdMachine.name} was added to the fleet.`}
              />
              <Link
                href={`/machines/${createdMachine.id}`}
                className="mt-3 inline-flex text-[12.5px] font-medium text-cyan hover:underline"
              >
                View generator →
              </Link>
            </div>
          )}
        </form>
      </Card>
    </AppShell>
  );
}