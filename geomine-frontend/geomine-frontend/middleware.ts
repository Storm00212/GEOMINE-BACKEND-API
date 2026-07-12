import { NextResponse, type NextRequest } from "next/server";

// Auth is handled entirely by the backend (Neon Postgres + custom JWT Bearer
// tokens stored in localStorage). This frontend middleware is a pass-through
// no-op so Next.js can compile/deploy.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

