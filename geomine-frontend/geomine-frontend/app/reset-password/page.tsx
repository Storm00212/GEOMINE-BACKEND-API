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

    // Phase 1: Supabase reset flow removed.
    // Backend custom reset endpoint to be implemented in Phase 2.
    // For now, guide the user to login.
    setStatus("success");
    setMessage("Password reset is not available yet. Please contact your administrator or sign in.");

    setTimeout(() => router.replace("/login"), 1200);
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Temporarily disabled during the Supabase → Neon migration."
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

