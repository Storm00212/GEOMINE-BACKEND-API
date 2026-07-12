"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/auth/api";
import { setAccessToken } from "@/lib/auth/token-storage";
import {
  AuthShell,
  AuthMessage,
  Field,
  TextInput,
  SelectInput,
  Button,
} from "@/components/geomine-theme";

type AuthMode = "login" | "signup";

type Status = "idle" | "submitting" | "error" | "success";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"miner" | "it" | "admin">("miner");

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setMessage(null);

    if (isSignup) {
      if (password !== confirmPassword) {
        setStatus("error");
        setMessage("Passwords do not match.");
        return;
      }
      if (password.length < 8) {
        setStatus("error");
        setMessage("Password must be at least 8 characters.");
        return;
      }

      const data = await apiPost<{ accessToken: string }>(
        "/api/auth/signup",
        { email, password, role }
      );

      setAccessToken(data.accessToken);
      setStatus("success");
      router.replace("/");
      return;
    }

    const data = await apiPost<{ accessToken: string }>(
      "/api/auth/login",
      { email, password }
    );

    setAccessToken(data.accessToken);
    setStatus("success");
    router.replace("/");
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

        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {isSignup ? "Create an account" : "Sign in"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setMode(isSignup ? "login" : "signup");
                setStatus("idle");
                setMessage(null);
              }}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              {isSignup ? "Already have an account?" : "Need an account?"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="********"
              />
            </div>

            {isSignup && (
              <>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium">
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as "miner" | "it" | "admin")
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="miner">Miner</option>
                    <option value="it">IT / Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="********"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {status === "submitting"
                ? isSignup
                  ? "Creating account…"
                  : "Signing in…"
                : isSignup
                ? "Sign up"
                : "Sign in"}
            </button>

            {message && (
              <p
                className={`rounded-md p-4 text-sm ${
                  status === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

