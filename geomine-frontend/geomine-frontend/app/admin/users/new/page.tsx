"use client";

import { useState } from "react";
import { backendFetchClient } from "@/lib/backend-client-browser";

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
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold">Invite a user</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Full name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="miner">Miner (logs readings)</option>
            <option value="it">IT (analyzes + exports)</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === "sending" ? "Sending invite…" : "Send invite"}
        </button>

        {status === "sent" && (
          <p className="text-sm text-green-600">Invite sent.</p>
        )}
        {status === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}
      </form>
    </div>
  );
}
