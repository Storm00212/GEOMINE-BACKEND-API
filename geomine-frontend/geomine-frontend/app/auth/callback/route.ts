import { NextResponse } from "next/server";

// Supabase OAuth callback removed during Phase 1.
// Redirect users back to login.
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(new URL("/login", origin));
}


