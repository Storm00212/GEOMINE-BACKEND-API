"use client";

import React from "react";

export function ThemeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0D12] text-slate-100">
      {children}
    </div>
  );
}

export function NeonSidebar({
  active,
  roleLabel,
  onNavigate,
}: {
  active: "entry" | "dashboard" | "detail" | "reports";
  roleLabel: string;
  onNavigate: (key: "entry" | "dashboard" | "detail" | "reports") => void;
}) {
  return (
    <div className="w-[220px] flex-shrink-0 bg-[#14161B] border-r border-[#2C313C] p-6">
      <div className="pb-6 border-b border-[#2C313C] mb-5">
        <div className="text-[17px] font-semibold tracking-[0.5px]">
          GEOMINE<span className="text-[#E8A33D]"> · PMS</span>
        </div>
        <div className="mt-1 font-mono text-[10px] text-[#5C6270] tracking-[1.2px]">
          PREDICTIVE MAINTENANCE
        </div>
      </div>

      <div className="mt-3">
        <NavItem
          active={active === "entry"}
          label="Log a reading"
          role="MINER"
          onClick={() => onNavigate("entry")}
        />
        <NavItem
          active={active === "dashboard"}
          label="Fleet overview"
          role="IT · ADMIN"
          onClick={() => onNavigate("dashboard")}
        />
        <NavItem
          active={active === "detail"}
          label="Generator"
          role={roleLabel || "IT · ADMIN"}
          onClick={() => onNavigate("detail")}
        />
        <NavItem
          active={active === "reports"}
          label="Export data"
          role="IT · ADMIN"
          onClick={() => onNavigate("reports")}
        />
      </div>

      <div className="mt-auto pt-4 border-t border-[#2C313C] flex items-center gap-3">
        <div className="w-[26px] h-[26px] rounded-full bg-[#1E3438] text-[#4FC3D9] flex items-center justify-center font-semibold text-[11px]">
          SK
        </div>
        <div>
          <div className="text-[12px] font-medium">Session</div>
          <div className="font-mono text-[9.5px] text-[#5C6270]">{roleLabel}</div>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  active,
  label,
  role,
  onClick,
}: {
  active: boolean;
  label: string;
  role: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "w-full text-left px-3 py-2 rounded-[6px] border border-transparent mb-1 transition " +
        (active ? "bg-[#282D37] border-[#363C48]" : "hover:bg-[#282D37]")
      }
    >
      <div className="flex flex-col gap-[2px]">
        <div className="text-[13.5px] font-medium text-[#8D95A3]">{label}</div>
        <div className="font-mono text-[9.5px] text-[#5C6270] tracking-[0.8px]">
          {role}
        </div>
      </div>
    </button>
  );
}

export function NeonCard({
  children,
  tint,
  className,
}: {
  children: React.ReactNode;
  tint?: "red" | "amber";
  className?: string;
}) {
  const tintClass =
    tint === "red"
      ? "bg-[#402323] border-[#5A3230]"
      : tint === "amber"
        ? "bg-[#4A3B22]/30 border-[#6B5228]"
        : "bg-[#21252D]";

  return (
    <div
      className={
        "rounded-[8px] border border-[#363C48] p-4 " +
        tintClass +
        " " +
        (className || "")
      }
    >
      {children}
    </div>
  );
}

export function NeonDividerLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10.5px] tracking-[1px] text-[#5C6270] uppercase my-4">
      {children}
    </div>
  );
}

