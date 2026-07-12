"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAccessToken } from "@/lib/auth/token-storage";

export type NavKey = "entry" | "dashboard" | "machines" | "reports";

export type StatusTone = "green" | "amber" | "red" | "cyan" | "neutral";

const NAV_ITEMS: { key: NavKey; label: string; role: string; href: string }[] = [
  { key: "entry", label: "Log a reading", role: "MINER", href: "/entry" },
  { key: "dashboard", label: "Fleet overview", role: "IT · ADMIN", href: "/dashboard" },
  { key: "machines", label: "Generator", role: "IT · ADMIN", href: "/machines" },
  { key: "reports", label: "Export data", role: "IT · ADMIN", href: "/reports" },
];

const TONE_TEXT: Record<StatusTone, string> = {
  green: "text-green",
  amber: "text-amber",
  red: "text-red",
  cyan: "text-cyan",
  neutral: "text-ink",
};

const TONE_DOT: Record<StatusTone, string> = {
  green: "gm-dot green",
  amber: "gm-dot amber",
  red: "gm-dot red",
  cyan: "gm-dot green",
  neutral: "gm-dot green",
};

export function statusFromHealth(health: number | null | undefined): StatusTone {
  if (health === null || health === undefined) return "neutral";
  if (health >= 80) return "green";
  if (health >= 55) return "amber";
  return "red";
}

export function toneText(tone: StatusTone) {
  return TONE_TEXT[tone];
}

export function toneDot(tone: StatusTone) {
  return TONE_DOT[tone];
}

/* ------------------------------------------------------------------ */
/* App shell: fixed sidebar + mobile top bar + scrollable main content */
/* ------------------------------------------------------------------ */

export function AppShell({
  active,
  user,
  children,
}: {
  active: NavKey;
  user?: { initials?: string; role?: string };
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = user?.initials ?? "SK";
  const role = user?.role ?? "IT";

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-line-soft bg-side px-4 md:hidden">
        <Link href="/dashboard" className="text-[15px] font-semibold tracking-[0.5px]">
          GEOMINE<span className="text-amber"> · PMS</span>
        </Link>
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-dim"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
            {menuOpen ? (
              <>
                <line x1="4" y1="4" x2="14" y2="14" />
                <line x1="14" y1="4" x2="4" y2="14" />
              </>
            ) : (
              <>
                <line x1="3" y1="5" x2="15" y2="5" />
                <line x1="3" y1="9" x2="15" y2="9" />
                <line x1="3" y1="13" x2="15" y2="13" />
              </>
            )}
          </svg>
        </button>
      </header>

      {/* Fixed sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[220px] flex-col border-r border-line-soft bg-side p-6 md:flex">
        <Sidebar active={active} initials={initials} role={role} />
      </aside>

      {/* Mobile slide-down nav */}
      {menuOpen && (
        <nav className="fixed inset-x-0 top-14 z-20 border-b border-line-soft bg-side md:hidden">
          <Sidebar active={active} initials={initials} role={role} onNavigate={() => setMenuOpen(false)} />
        </nav>
      )}

      {/* Main content — scrolls independently of the fixed sidebar */}
      <main className="min-h-screen px-4 pb-16 pt-20 md:ml-[220px] md:max-w-[900px] md:px-10 md:py-8 md:pb-10">
        {children}
      </main>
    </div>
  );
}

function Sidebar({
  active,
  initials,
  role,
  onNavigate,
}: {
  active: NavKey;
  initials: string;
  role: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    clearAccessToken();
    router.replace("/login");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 border-b border-line-soft pb-6">
        <div className="px-2 text-[17px] font-semibold tracking-[0.5px]">
          GEOMINE<span className="text-amber"> · PMS</span>
        </div>
        <div className="mt-1 px-2 font-mono text-[10px] tracking-[1.2px] text-ink-faint">
          PREDICTIVE MAINTENANCE
        </div>
      </div>

      <div className="mt-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              className={
                "mb-1 flex flex-col gap-[2px] rounded-md border border-transparent px-3 py-2 transition " +
                (isActive
                  ? "border-line bg-panel-alt"
                  : "hover:bg-panel-alt")
              }
            >
              <span className="text-[13.5px] font-medium text-ink-dim">
                {item.label}
              </span>
              <span className="font-mono text-[9.5px] tracking-[0.8px] text-ink-faint">
                {item.role}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3 border-t border-line-soft pt-4">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-cyan-dim font-semibold text-[11px] text-cyan">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-medium">Session</div>
          <div className="font-mono text-[9.5px] text-ink-faint">{role}</div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-line px-2 py-1 font-mono text-[9.5px] tracking-[0.8px] text-ink-faint transition hover:border-red hover:text-red"
        >
          LOG OUT
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Primitive building blocks                                          */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  tint,
  className = "",
}: {
  children: React.ReactNode;
  tint?: "red" | "amber";
  className?: string;
}) {
  const tintClass =
    tint === "red"
      ? "bg-red-dim border-[#5A3230]"
      : tint === "amber"
        ? "bg-amber-dim/40 border-[#6B5228]"
        : "bg-panel border-line-soft";
  return (
    <div className={"rounded-lg border p-4 " + tintClass + " " + className}>{children}</div>
  );
}

export function DividerLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 font-mono text-[10.5px] uppercase tracking-[1px] text-ink-faint">
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-[15px] font-semibold text-ink">{children}</h2>
      {hint && <span className="font-mono text-[10.5px] text-ink-faint">{hint}</span>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: StatusTone;
}) {
  return (
    <div className="rounded-lg border border-line-soft bg-panel p-4">
      <div className="text-[11.5px] text-ink-dim">{label}</div>
      <div className={"mt-1.5 font-mono text-2xl font-semibold " + TONE_TEXT[tone]}>
        {value}
      </div>
    </div>
  );
}

export function MetricTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: StatusTone;
}) {
  return (
    <div className="rounded-md bg-panel-alt p-3">
      <div className="text-[10.5px] leading-[1.3] text-ink-dim">{label}</div>
      <div className={"mt-1 font-mono text-[15px] font-semibold " + TONE_TEXT[tone]}>
        {value}
      </div>
      {hint && <div className="mt-0.5 font-mono text-[9.5px] text-ink-faint">{hint}</div>}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-medium text-ink-dim">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-ink-faint">{hint}</p>}
    </div>
  );
}

const INPUT_CLASS =
  "w-full rounded-md border border-line bg-panel-alt px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-faint transition focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan/40";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={INPUT_CLASS + " " + className} {...rest} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <select className={INPUT_CLASS + " " + className} {...rest}>
      {children}
    </select>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
}) {
  const base =
    "w-full rounded-md px-4 py-2.5 text-[13.5px] font-semibold transition disabled:opacity-50";
  const styles =
    variant === "ghost"
      ? "border border-line bg-transparent text-ink hover:bg-panel-alt"
      : "bg-cyan text-[#0D2B30] hover:opacity-90";
  return (
    <button className={base + " " + styles + " " + className} {...rest}>
      {children}
    </button>
  );
}

export function StatusDot({ tone }: { tone: StatusTone }) {
  return <span className={TONE_DOT[tone]} />;
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: StatusTone;
}) {
  const map: Record<StatusTone, string> = {
    green: "bg-green-dim text-green border-[#2F4E3C]",
    amber: "bg-amber-dim text-amber border-[#6B5228]",
    red: "bg-red-dim text-red border-[#5A3230]",
    cyan: "bg-cyan-dim text-cyan border-[#2C4A50]",
    neutral: "bg-panel-alt text-ink-dim border-line",
  };
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-[0.5px] " +
        map[tone]
      }
    >
      {children}
    </span>
  );
}

export function AlertBox({
  children,
  tint = "red",
}: {
  children: React.ReactNode;
  tint?: "red" | "amber";
}) {
  const cls =
    tint === "red"
      ? "border-[#5A3230] bg-red-dim text-red"
      : "border-[#6B5228] bg-amber-dim/40 text-amber";
  return (
    <div className={"flex gap-2.5 rounded-lg border p-3 text-[12.5px] " + cls}>
      <span className="font-mono font-semibold">!</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fleet list row                                                     */
/* ------------------------------------------------------------------ */

export function FleetRow({
  href,
  name,
  sub,
  status,
  metrics,
}: {
  href: string;
  name: string;
  sub?: string;
  status: StatusTone;
  metrics: { label: string; value: string | number; tone?: StatusTone }[];
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between border-b border-line-soft px-2 py-3 last:border-b-0 hover:bg-panel-alt/50"
    >
      <div className="flex min-w-0 items-center gap-3">
        <StatusDot tone={status} />
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-medium text-ink">{name}</div>
          {sub && <div className="mt-0.5 truncate text-[11px] text-ink-faint">{sub}</div>}
        </div>
      </div>
      <div className="flex items-center gap-5 sm:gap-7">
        {metrics.map((m) => (
          <div key={m.label} className="text-right">
            <div className="font-mono text-[9.5px] uppercase tracking-[0.5px] text-ink-faint">
              {m.label}
            </div>
            <div className={"font-mono text-[13px] font-semibold " + TONE_TEXT[m.tone ?? "neutral"]}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </Link>
  );
}

export function ListRow({
  children,
  tint,
}: {
  children: React.ReactNode;
  tint?: "red" | "amber";
}) {
  const cls = tint === "red" ? "text-red" : tint === "amber" ? "text-amber" : "text-ink-dim";
  return (
    <div className={"flex items-center justify-between gap-3 border-b border-line-soft px-2 py-2.5 text-[12.5px] last:border-b-0 " + cls}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Standalone auth layout (login / signup / reset)                    */
/* ------------------------------------------------------------------ */

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="text-[19px] font-semibold tracking-[0.5px]">
            GEOMINE<span className="text-amber"> · PMS</span>
          </div>
          <div className="mt-1 font-mono text-[10px] tracking-[1.2px] text-ink-faint">
            PREDICTIVE MAINTENANCE
          </div>
        </div>

        <div className="rounded-xl border border-line-soft bg-panel p-6 shadow-2xl shadow-black/30">
          <h1 className="text-[18px] font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-[13px] text-ink-dim">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-4 text-center font-mono text-[10px] tracking-[0.5px] text-ink-faint">
          SECURE SESSION · JWT AUTHENTICATED
        </p>
      </div>
    </div>
  );
}

export function AuthMessage({
  status,
  message,
}: {
  status: "error" | "success" | "info";
  message: string;
}) {
  const cls =
    status === "error"
      ? "border-[#5A3230] bg-red-dim text-red"
      : status === "success"
        ? "border-[#2F4E3C] bg-green-dim text-green"
        : "border-line bg-panel-alt text-ink-dim";
  return (
    <div className={"mt-4 rounded-md border px-3 py-2.5 text-[12.5px] " + cls}>{message}</div>
  );
}

/* ------------------------------------------------------------------ */
/* Radial health gauge (SVG)                                          */
/* ------------------------------------------------------------------ */

export function HealthGauge({
  value,
  size = 88,
}: {
  value: number | null | undefined;
  size?: number;
}) {
  const tone = statusFromHealth(value);
  const color =
    tone === "green" ? "#4FAE7C" : tone === "amber" ? "#E8A33D" : tone === "red" ? "#E0574F" : "#5C6270";
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value === null || value === undefined ? 0 : Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#363C48" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[18px] font-semibold" style={{ color }}>
          {value === null || value === undefined ? "—" : value}
        </span>
        <span className="font-mono text-[8px] uppercase tracking-[1px] text-ink-faint">health</span>
      </div>
    </div>
  );
}
