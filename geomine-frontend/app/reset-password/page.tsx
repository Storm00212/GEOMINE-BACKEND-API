"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell, AuthMessage, Field, TextInput, Button } from "@/app/components/geomine-theme";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setMessage(null);

    // Auth is handled by the backend (Neon Postgres + custom JWT), not
    // Supabase. There is no self-service reset endpoint — an administrator
    // re-invites the user via POST /api/admin/invite (which issues a fresh
    // temporary password). For now, guide the user to contact an admin.
    setStatus("success");
    setMessage("Password reset is handled by your administrator. Please contact them, or sign in.");

    setTimeout(() => router.replace("/login"), 1200);
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Contact an administrator to reset your password."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <Button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Processing…" : "Request reset"}
        </Button>

        {message && (
          <AuthMessage status={status === "error" ? "error" : "success"} message={message} />
        )}
      </form>
    </AuthShell>
  );
}

