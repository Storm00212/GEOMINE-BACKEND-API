"use client";

import Link from "next/link";
import { AuthShell } from "@/app/components/geomine-theme";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Password reset"
      subtitle="Self-service reset is not available."
    >
      <div className="space-y-4 text-[13px] text-ink-dim">
        <p>
          Geomine accounts are created and managed by your site administrator.
          If you have forgotten your password, ask the administrator to invite
          you again — they will generate a new temporary password you can use
          to sign in and change it.
        </p>
        <p className="text-ink-faint">
          If you are the administrator, sign in and use the{" "}
          <span className="font-mono text-ink">Invite user</span> action to
          re-issue credentials.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Link
          href="/login"
          className="w-full rounded-md bg-cyan px-4 py-2.5 text-center text-[13.5px] font-semibold text-[#0D2B30] transition hover:opacity-90"
        >
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
