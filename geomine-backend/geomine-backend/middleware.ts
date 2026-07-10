import { NextResponse, type NextRequest } from "next/server";

// This backend is called cross-origin by a separate frontend deployable, so
// every response needs explicit CORS headers — the browser will otherwise
// block the frontend's JavaScript from reading the response (server-to-server
// calls, e.g. from the frontend's own Server Components, aren't subject to
// CORS at all — this only matters for the frontend's Client Components
// calling this API directly from the browser).
//
// Auth here is a Bearer token (see lib/supabase/request-client.ts), not a
// cookie, so we don't need Access-Control-Allow-Credentials or any cookie
// dance — just an origin allowlist and the Authorization header allowed
// through.
function getAllowedOrigins(): string[] {
  const defaults = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://geomine-backend-api-frontend.onrender.com",
  ];
  const raw = process.env.ALLOWED_ORIGINS || "";
  const configured = raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  return Array.from(new Set([...defaults, ...configured]));
}

function corsHeaders(origin: string | null): Headers {
  const headers = new Headers();
  const allowed = getAllowedOrigins();

  if (origin && allowed.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Preflight — browsers send this before the real request for anything
  // beyond a simple GET, to ask "are you going to allow this?"
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
  }

  const response = NextResponse.next();
  const headers = corsHeaders(origin);
  headers.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
