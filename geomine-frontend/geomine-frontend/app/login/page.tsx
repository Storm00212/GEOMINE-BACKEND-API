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
} from "@/app/components/geomine-theme";

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
    <AuthShell
      title={isSignup ? "Create an account" : "Sign in"}
      subtitle="Predictive maintenance logging"
    >
      <button
        type="button"
        onClick={() => {
          setMode(isSignup ? "login" : "signup");
          setStatus("idle");
          setMessage(null);
        }}
        className="mb-5 self-start font-mono text-[11px] tracking-[0.5px] text-ink-faint transition hover:text-cyan"
      >
        {isSignup ? "← ALREADY HAVE AN ACCOUNT? SIGN IN" : "← NEED AN ACCOUNT? SIGN UP"}
      </button>

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

        <Field label="Password" htmlFor="password">
          <TextInput
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        {isSignup && (
          <>
            <Field label="Role" htmlFor="role">
              <SelectInput
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as "miner" | "it" | "admin")}
              >
                <option value="miner">Miner</option>
                <option value="it">IT / Staff</option>
                <option value="admin">Admin</option>
              </SelectInput>
            </Field>

            <Field label="Confirm password" htmlFor="confirmPassword">
              <TextInput
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
          </>
        )}

        <Button type="submit" disabled={status === "submitting"}>
          {status === "submitting"
            ? isSignup
              ? "Creating account…"
              : "Signing in…"
            : isSignup
              ? "Sign up"
              : "Sign in"}
        </Button>

        {message && (
          <AuthMessage status={status === "error" ? "error" : "success"} message={message} />
        )}
      </form>
    </AuthShell>
  );
}

