import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// This middleware queries Supabase directly (not the backend) — and that's
// deliberate, not leftover from before the split. It's a same-origin,
// RLS-scoped read of the current user's OWN profile (`id = auth.uid()`,
// already allowed), used only to decide which page to redirect to. Routing
// through the backend for this would mean an extra cross-origin round trip
// on every single page load just to answer "is this a miner or IT" — not
// worth it for something RLS already lets the frontend read safely itself.
// All actual business data still goes through the backend.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = path.startsWith("/login") || path.startsWith("/auth");

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "miner";

    // Miners are locked to the entry screens.
    if (role === "miner" && !path.startsWith("/entry") && !isPublic) {
      return NextResponse.redirect(new URL("/entry", request.url));
    }

    // IT/admin-only areas.
    const staffOnly = path.startsWith("/dashboard") || path.startsWith("/machines") || path.startsWith("/reports");
    if (staffOnly && role === "miner") {
      return NextResponse.redirect(new URL("/entry", request.url));
    }

    // Admin-only areas.
    if (path.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/entry", request.url));
    }

    if (path === "/" || isPublic) {
      const home = role === "miner" ? "/entry" : "/dashboard";
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
