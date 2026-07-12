"use client";

import { useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";
import { clearAccessToken, getAccessToken } from "@/lib/auth/token-storage";

export default function AuthNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsAuthenticated(Boolean(getAccessToken()));
    setIsLoading(false);
  }, []);

  if (
    isLoading ||
    pathname === "/login" ||
    pathname.startsWith("/auth") ||
    pathname === "/reset-password"
  ) {
    return null;
  }

  if (!isAuthenticated) return null;

  function handleSignOut() {
    clearAccessToken();
    router.replace("/login");
  }

  return (
    <div className="flex justify-end px-4 py-3">
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        Log out
      </button>
    </div>
  );
}

