// Small shared helper so every API route handles auth/validation errors the
// same way instead of each one writing its own try/catch → status mapping.

import { NextResponse } from "next/server";
import { UnauthorizedError, ForbiddenError } from "@/lib/modules/auth";
import { ValidationError } from "@/lib/modules/readings";

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
