import { NextResponse, type NextRequest } from "next/server";

// Supabase removed from the frontend build.
// Keep middleware as a no-op so Next.js can compile/deploy.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

