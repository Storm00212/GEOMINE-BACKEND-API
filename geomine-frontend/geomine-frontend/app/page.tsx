"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth/token-storage";
import { StatCard, Badge } from "@/app/components/geomine-theme";

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
          <div className="relative overflow-hidden rounded-2xl border border-line-soft bg-panel">
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-cyan/20 blur-3xl" />
              <div className="absolute -bottom-28 -right-24 h-96 w-96 rounded-full bg-amber/15 blur-3xl" />
            </div>

            <div className="relative p-8 md:p-12">
              <div className="flex flex-col gap-8 md:flex-row md:items-start">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-3 rounded-full border border-line bg-panel-alt px-4 py-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan shadow-[0_0_0_4px_rgba(79,195,217,0.2)]" />
                    <span className="font-mono text-[11px] tracking-[0.2em] text-ink-dim">
                      PREDICTIVE MAINTENANCE
                    </span>
                  </div>

                  <h1 className="mt-5 text-3xl font-semibold text-ink md:text-4xl">
                    GEOMINE · PMS
                  </h1>
                  <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-ink-dim md:text-base">
                    Log generator readings, get out-of-range alerts, and export maintenance
                    reports — backed by Neon/PostgreSQL for stable, observable performance.
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

                  <div className="mt-6 text-[12px] leading-relaxed text-ink-faint">
                    No UI errors means backend endpoints are wired. If you still see a blank
                    screen, verify you're rendering this root route at{" "}
                    <span className="font-mono text-ink-dim">/</span>.
                  </div>
                </div>

                <div className="w-full md:w-[340px]">
                  <div className="rounded-xl border border-line-soft bg-panel-alt p-5">
                    <div className="text-[14px] font-semibold text-ink">Quick actions</div>
                    <div className="mt-2 text-[12px] text-ink-faint">Roles: miner / it / admin</div>

                    <div className="mt-5 space-y-3">
                      <QuickLink
                        title="Login"
                        subtitle="Access your role dashboard"
                        onClick={() => router.push("/login")}
                      />
                      <QuickLink
                        title="Signup"
                        subtitle="Create an account with a role"
                        onClick={() => router.push("/login")}
                      />
                      <QuickLink
                        title="Fleet overview"
                        subtitle="See generator health"
                        onClick={() => router.push(token ? "/dashboard" : "/login")}
                      />
                    </div>

                    <div className="mt-5 rounded-lg border border-line-soft bg-base/40 p-4">
                      <div className="font-mono text-[10px] tracking-[0.2em] text-ink-faint">TIP</div>
                      <div className="mt-2 text-[12px] leading-relaxed text-ink-dim">
                        Login returns a JWT access token stored in localStorage. The UI shows
                        only when authenticated (see{" "}
                        <span className="font-mono text-ink">geomine_access_token</span>).
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {!loading && (
                <div className="relative mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-line-soft bg-panel-alt p-5">
                    <div className="font-mono text-[10px] tracking-[0.2em] text-ink-faint">NEXT</div>
                    <div className="mt-2 text-[14px] font-semibold text-ink">If you want dashboards</div>
                    <div className="mt-1 text-[12px] text-ink-dim">
                      Implemented: /entry, /dashboard, /machines/[id], /reports with graphs.
                    </div>
                  </div>
                  <div className="rounded-xl border border-line-soft bg-panel-alt p-5">
                    <div className="font-mono text-[10px] tracking-[0.2em] text-ink-faint">AUTH</div>
                    <div className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-ink">
                      {token ? "You're authenticated" : "You're not signed in"}
                      <Badge tone={token ? "green" : "neutral"}>{token ? "LIVE" : "GUEST"}</Badge>
                    </div>
                    <div className="mt-1 text-[12px] text-ink-dim">
                      {token
                        ? "Use the sidebar Log out button when testing UI flows."
                        : "Use /login to sign in and reveal authenticated UI."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <style jsx>{`
            .btn-primary {
              background: #4fc3d9;
              color: #0d2b30;
              border: none;
              border-radius: 10px;
              padding: 10px 16px;
              font-weight: 700;
              font-size: 13px;
              cursor: pointer;
              box-shadow: 0 10px 30px rgba(79, 195, 217, 0.12);
            }
            .btn-primary:hover {
              opacity: 0.92;
            }
            .btn-secondary {
              background: rgba(40, 45, 55, 0.6);
              border: 1px solid #363c48;
              color: #edeff3;
              border-radius: 10px;
              padding: 10px 16px;
              font-weight: 700;
              font-size: 13px;
              cursor: pointer;
            }
            .btn-secondary:hover {
              background: rgba(40, 45, 55, 0.9);
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
