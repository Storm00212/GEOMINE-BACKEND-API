"use client";

import { useState } from "react";
import { backendFetchClient } from "@/lib/backend-client-browser";
import { AppShell, Card, Field, TextInput, SelectInput, Button, AuthMessage } from "@/app/components/geomine-theme";

export default function InviteUserPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("miner");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const res = await backendFetchClient("/api/admin/invite", {
      method: "POST",
      body: JSON.stringify({ email, full_name: fullName, role }),
    });

    if (res.ok) {
      setStatus("sent");
      setEmail("");
      setFullName("");
    } else {
      const body = await res.json().catch(() => ({}));
      setErrorMsg(body.error ?? "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <AppShell active="dashboard">
      <h1 className="text-[19px] font-semibold">Invite a user</h1>
      <p className="mb-6 mt-1 text-[13px] text-ink-dim">
        Send a role-scoped invite to a new team member.
      </p>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full name" htmlFor="fullName">
            <TextInput
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Operator"
            />
          </Field>

          <Field label="Email" htmlFor="email">
            <TextInput
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@geomine.com"
            />
          </Field>

          <Field label="Role" htmlFor="role">
            <SelectInput id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="miner">Miner (logs readings)</option>
              <option value="it">IT (analyzes + exports)</option>
              <option value="admin">Admin</option>
            </SelectInput>
          </Field>

          <Button type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Sending invite…" : "Send invite"}
          </Button>

          {status === "sent" && <AuthMessage status="success" message="Invite sent." />}
          {status === "error" && <AuthMessage status="error" message={errorMsg} />}
        </form>
      </Card>
    </AppShell>
  );
}
