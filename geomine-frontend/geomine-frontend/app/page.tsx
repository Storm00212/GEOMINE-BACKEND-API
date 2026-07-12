"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth/token-storage";

export default function Home() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getAccessToken();
    setToken(t);
    setLoading(false);
  }, []);

  // If we ever need role-based redirect later, we can call /api/auth/me here.
  // For now, we provide a visible landing UI even when unauthenticated.
  const hero = useMemo(() => {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl">
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#181B21]">
            <div className="absolute inset-0 opacity-70 pointer-events-none">
              <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-[#4FC3D9]/20 blur-3xl" />
              <div className="absolute -bottom-28 -right-24 h-96 w-96 rounded-full bg-[#E8A33D]/15 blur-3xl" />
            </div>

            <div className="relative p-8 md:p-12">
              <div className="flex flex-col md:flex-row md:items-start gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-3 rounded-full border border-slate-700 bg-slate-900/30 px-4 py-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#4FC3D9] shadow-[0_0_0_4px_rgba(79,195,217,0.2)]" />
                    <span className="text-xs tracking-[0.2em] text-slate-300">PREDICTIVE MAINTENANCE</span>
                  </div>

                  <h1 className="mt-5 text-3xl md:text-4xl font-semibold text-slate-50">
                    GEOMINE · PMS
                  </h1>
                  <p className="mt-3 text-slate-300 text-sm md:text-base leading-relaxed max-w-xl">
                    Log generator readings, get out-of-range alerts, and export maintenance
                    reports — with Neon/PostgreSQL for stable performance.
                  </p>

                  <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Stat label="Generators" value="—" />
                    <Stat label="Readings (recent)" value="—" />
                    <Stat label="Flagged" value="—" accent="amber" />
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
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

                  <div className="mt-6 text-xs text-slate-400 leading-relaxed">
                    No UI errors = backend endpoints are wired. If you still see a blank screen,
                    verify you’re rendering this root route at <span className="font-mono text-slate-200">/</span>.
                  </div>
                </div>

                <div className="w-full md:w-[360px]">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
                    <div className="text-sm font-semibold text-slate-100">Quick actions</div>
                    <div className="mt-2 text-xs text-slate-400">
                      Roles: miner / it / admin
                    </div>

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
                        title="Explore endpoints"
                        subtitle="Backend routes are ready"
                        onClick={() => window.open("https://geomine-backend-api-backend.onrender.com", "_blank")}
                      />
                    </div>

                    <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/30 p-4">
                      <div className="text-xs tracking-[0.2em] text-slate-400">TIP</div>
                      <div className="mt-2 text-xs text-slate-300 leading-relaxed">
                        Login returns a JWT access token stored in localStorage. The UI
                        shows only when authenticated (see <span className="font-mono">geomine_access_token</span>).
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {loading ? null : (
                <div className="relative mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5">
                    <div className="text-xs tracking-[0.2em] text-slate-400">NEXT</div>
                    <div className="mt-2 text-sm font-semibold text-slate-100">If you want dashboards</div>
                    <div className="mt-1 text-xs text-slate-300">
                      Implemented next: /entry, /dashboard, /machines/[id], /reports with graphs.
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5">
                    <div className="text-xs tracking-[0.2em] text-slate-400">AUTH</div>
                    <div className="mt-2 text-sm font-semibold text-slate-100">
                      {token ? "You’re authenticated" : "You’re not signed in"}
                    </div>
                    <div className="mt-1 text-xs text-slate-300">
                      {token
                        ? "Use the top-right Log out button when testing UI flows."
                        : "Use /login to sign in and reveal authenticated UI."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tailwind theme helpers */}
          <style jsx>{`
            .btn-primary {
              background: #4FC3D9;
              color: #0D2B30;
              border: none;
              border-radius: 10px;
              padding: 10px 14px;
              font-weight: 700;
              font-size: 13px;
              cursor: pointer;
              box-shadow: 0 10px 30px rgba(79,195,217,0.12);
            }
            .btn-primary:hover { opacity: 0.92; }
            .btn-secondary {
              background: rgba(15,23,42,0.35);
              border: 1px solid rgba(51,65,85,0.9);
              color: #EDEFF3;
              border-radius: 10px;
              padding: 10px 14px;
              font-weight: 700;
              font-size: 13px;
              cursor: pointer;
            }
            .btn-secondary:hover { background: rgba(15,23,42,0.5); }
          `}</style>
        </div>
      </div>
    );
  }, [router, token, loading]);

  return <div className="bg-[#0B0D12] min-h-screen">{hero}</div>;
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber";
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
      <div className="text-[10px] tracking-[0.22em] text-slate-400 uppercase">{label}</div>
      <div
        className={`mt-2 font-mono text-xl font-semibold ${accent === "amber" ? "text-[#E8A33D]" : "text-slate-100"}`}
      >
        {value}
      </div>
    </div>
  );
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
      className="w-full text-left rounded-lg border border-slate-800 bg-slate-950/20 p-3 hover:bg-slate-950/35 transition"
    >
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      <div className="text-xs text-slate-400 mt-1">{subtitle}</div>
    </button>
  );
}

