"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Geomine PMS</h1>
          <p className="mt-1 text-sm text-gray-500">
            Predictive maintenance logging
          </p>
        </div>

        {status === "sent" ? (
          <p className="rounded-md bg-green-50 p-4 text-sm text-green-700">
            Check your email for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="you@geomine.com"
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {status === "sending" ? "Sending link…" : "Send sign-in link"}
            </button>

            {status === "error" && (
              <p className="text-sm text-red-600">
                Something went wrong. Try again.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
