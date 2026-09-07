"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/auth/api";
import { setAccessToken } from "@/lib/auth/token-storage";
import {
  AuthShell,
  Field,
  TextInput,
  Button,
  Spinner,
} from "@/app/components/geomine-theme";

type AuthMode = "login" | "signup";
type Status = "idle" | "submitting" | "error" | "success";

interface AuthFormState {
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  emailError: string | null;
  passwordError: string | null;
  formError: string | null;
  status: Status;
}

const initialState: AuthFormState = {
  email: "",
  password: "",
  confirmPassword: "",
  showPassword: false,
  emailError: null,
  passwordError: null,
  formError: null,
  status: "idle",
};

function isLikelyEmail(s: string): boolean {
  // Light-weight format check — same as <input type="email"> but client-side
  // so we can show the message under the field without waiting for submit.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message.trim();
    return m.length > 0 ? m : "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [state, setState] = useState<AuthFormState>(initialState);
  const isSignup = mode === "signup";
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();

  function set<K extends keyof AuthFormState>(key: K, value: AuthFormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function resetForMode(next: AuthMode) {
    setMode(next);
    setState({ ...initialState });
  }

  function validateLocally(): boolean {
    let ok = true;
    if (!isLikelyEmail(state.email)) {
      set("emailError", "Enter a valid email address.");
      ok = false;
    } else {
      set("emailError", null);
    }
    if (state.password.length === 0) {
      set("passwordError", "Password is required.");
      ok = false;
    } else if (isSignup && state.password.length < 8) {
      set("passwordError", "Password must be at least 8 characters.");
      ok = false;
    } else if (isSignup && state.password !== state.confirmPassword) {
      set("passwordError", "Passwords do not match.");
      ok = false;
    } else {
      set("passwordError", null);
    }
    return ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    set("formError", null);
    if (!validateLocally()) return;
    set("status", "submitting");

    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const body: Record<string, unknown> = isSignup
        ? { email: state.email.trim().toLowerCase(), password: state.password, role: "miner" }
        : { email: state.email.trim().toLowerCase(), password: state.password };
      const data = await apiPost<{ accessToken: string }>(endpoint, body);
      setAccessToken(data.accessToken);
      set("status", "success");
      router.replace("/");
    } catch (err) {
      set("formError", extractErrorMessage(err));
      set("status", "error");
    }
  }

  const submitting = state.status === "submitting";

  return (
    <AuthShell
      title={isSignup ? "Create an account" : "Sign in"}
      subtitle="Predictive maintenance logging"
    >
      <button
        type="button"
        onClick={() => resetForMode(isSignup ? "login" : "signup")}
        className="mb-5 self-start font-mono text-[11px] tracking-[0.5px] text-ink-faint transition hover:text-cyan"
      >
        {isSignup ? "← ALREADY HAVE AN ACCOUNT? SIGN IN" : "← NEED AN ACCOUNT? SIGN UP"}
      </button>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor={emailId} hint={state.emailError ?? undefined}>
          <TextInput
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={state.email}
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => {
              if (state.email.length > 0 && !isLikelyEmail(state.email)) {
                set("emailError", "Enter a valid email address.");
              } else {
                set("emailError", null);
              }
            }}
            placeholder="you@geomine.com"
            aria-invalid={state.emailError ? "true" : "false"}
            className={state.emailError ? "!border-red" : ""}
          />
        </Field>

        <Field
          label="Password"
          htmlFor={passwordId}
          hint={state.passwordError ?? undefined}
        >
          <div className="relative">
            <TextInput
              id={passwordId}
              type={state.showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={state.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="••••••••"
              aria-invalid={state.passwordError ? "true" : "false"}
              className={(state.passwordError ? "!border-red " : "") + "!pr-10"}
            />
            <button
              type="button"
              onClick={() => set("showPassword", !state.showPassword)}
              tabIndex={-1}
              aria-label={state.showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-faint transition hover:text-ink"
            >
              {state.showPassword ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8z" />
                  <circle cx="8" cy="8" r="1.6" />
                  <line x1="3" y1="3" x2="13" y2="13" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8z" />
                  <circle cx="8" cy="8" r="1.6" />
                </svg>
              )}
            </button>
          </div>
        </Field>

        {isSignup && (
          <Field label="Confirm password" htmlFor={confirmId}>
            <TextInput
              id={confirmId}
              type={state.showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={state.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              placeholder="••••••••"
            />
          </Field>
        )}

        {state.formError && (
          <div
            role="alert"
            className="rounded-md border border-red/60 bg-red-dim px-3 py-2.5 text-[12.5px] text-red"
          >
            {state.formError}
          </div>
        )}

        <Button type="submit" disabled={submitting}>
          <span className="inline-flex items-center justify-center gap-2">
            {submitting && <Spinner size={14} />}
            {submitting
              ? isSignup
                ? "Creating account…"
                : "Signing in…"
              : isSignup
                ? "Sign up"
                : "Sign in"}
          </span>
        </Button>

        {!isSignup && (
          <div className="-mt-1 text-center">
            <a
              href="/reset-password"
              className="font-mono text-[10.5px] uppercase tracking-[0.5px] text-ink-faint transition hover:text-cyan"
            >
              Forgot password?
            </a>
          </div>
        )}
      </form>
    </AuthShell>
  );
}
