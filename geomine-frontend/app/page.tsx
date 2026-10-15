"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth/token-storage";
import { StatCard } from "@/app/components/geomine-theme";
import { ThemeToggle } from "@/app/components/theme-provider";

export default function Home() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getAccessToken();
    setToken(t);
    setLoading(false);
  }, []);

  const hero = useMemo(() => {
    return (
      <div className="min-h-screen bg-base">
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
          <div className="mb-4 flex justify-end">
            <ThemeToggle />
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-line-soft bg-panel">
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-cyan/20 blur-3xl" />
              <div className="absolute -bottom-28 -right-24 h-96 w-96 rounded-full bg-amber/15 blur-3xl" />
            </div>

            <div className="relative p-8 md:p-12">
              <div className="flex flex-col gap-8 md:flex-row md:items-start">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-3 rounded-full border border-line bg-panel-alt px-4 py-2">
                    <span className="gm-status-halo h-2.5 w-2.5 rounded-full bg-cyan" />
                    <span className="font-mono text-[11px] tracking-[0.2em] text-ink-dim">
                      PREDICTIVE MAINTENANCE
                    </span>
                  </div>

                  <h1 className="mt-5 text-3xl font-semibold text-ink md:text-4xl">
                    GEOMINE · PMS
                  </h1>
                  <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-ink-dim md:text-base">
                    Track generator readings, monitor fleet health, and prepare maintenance
                    reports for your team.
                  </p>

                  <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <StatCard label="Generators" value="—" />
                    <StatCard label="Readings (recent)" value="—" />
                    <StatCard label="Flagged" value="—" tone="amber" />
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                      className="btn-primary"
                      onClick={() => router.push(token ? "/dashboard" : "/login")}
                    >
                      {token ? "Go to Fleet Overview" : "Sign in to start"}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => router.push(token ? "/entry" : "/login")}
                    >
                      {token ? "Log a reading" : "Create an account"}
                    </button>
                  </div>

                </div>

                <div className="w-full md:w-[340px]">
                  <div className="rounded-xl border border-line-soft bg-panel-alt p-5">
                    <div className="text-[14px] font-semibold text-ink">Account access</div>
                    <div className="mt-2 text-[12px] leading-relaxed text-ink-faint">
                      Sign in with the work email and password registered for your account.
                    </div>

                    <div className="mt-5 space-y-3">
                      <QuickLink
                        title="Login"
                        subtitle="Use your registered email and password"
                        onClick={() => router.push("/login")}
                      />
                      <QuickLink
                        title="Create an account"
                        subtitle="Register for Miner access"
                        onClick={() => router.push("/login")}
                      />
                      <QuickLink
                        title="Fleet overview"
                        subtitle="For IT and Admin accounts"
                        onClick={() => router.push(token ? "/dashboard" : "/login")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {!loading && (
                <div className="relative mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-line-soft bg-panel-alt p-5">
                    <div className="font-mono text-[10px] tracking-[0.2em] text-ink-faint">MINER</div>
                    <div className="mt-2 text-[14px] font-semibold text-ink">Create a Miner account</div>
                    <div className="mt-1 text-[12px] leading-relaxed text-ink-dim">
                      Choose Create an account, enter your work email, create a password of at least
                      8 characters, and confirm it. New self-registrations are assigned Miner access.
                    </div>
                  </div>
                  <div className="rounded-xl border border-line-soft bg-panel-alt p-5">
                    <div className="font-mono text-[10px] tracking-[0.2em] text-ink-faint">IT / ADMIN</div>
                    <div className="mt-2 text-[14px] font-semibold text-ink">Request role-based access</div>
                    <div className="mt-1 text-[12px] leading-relaxed text-ink-dim">
                      IT and Admin roles are assigned by an administrator, not selected during sign-up.
                      Ask your administrator for an invitation, then sign in with the assigned email and password.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <style jsx>{`
            .btn-primary {
              background: rgb(var(--cyan));
              color: rgb(var(--button-ink));
              border: none;
              border-radius: 10px;
              padding: 10px 16px;
              font-weight: 700;
              font-size: 13px;
              cursor: pointer;
              box-shadow: 0 10px 30px rgb(var(--cyan) / 0.12);
            }
            .btn-primary:hover {
              opacity: 0.92;
            }
            .btn-secondary {
              background: rgb(var(--panel-alt) / 0.6);
              border: 1px solid rgb(var(--line));
              color: rgb(var(--ink));
              border-radius: 10px;
              padding: 10px 16px;
              font-weight: 700;
              font-size: 13px;
              cursor: pointer;
            }
            .btn-secondary:hover {
              background: rgb(var(--panel-alt) / 0.9);
            }
          `}</style>
        </div>
      </div>
    );
  }, [router, token, loading]);

  return hero;
}

function QuickLink({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-line-soft bg-base/30 p-3 text-left transition hover:bg-base/50"
    >
      <div className="text-[13px] font-semibold text-ink">{title}</div>
      <div className="mt-1 text-[12px] text-ink-faint">{subtitle}</div>
    </button>
  );
}
