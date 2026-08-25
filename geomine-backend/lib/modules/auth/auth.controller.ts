// Controller layer — HTTP request/response only. Parses the request,
// calls the service, shapes the response. No business logic here beyond
// "what does this endpoint return."

import { requireAuth } from "./auth.service";
import { handleApiError } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

/** GET /api/auth/me — who am I, what's my role. Any authenticated user. */
export async function meController(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    return NextResponse.json({ userId: auth.userId, profile: auth.profile });
  } catch (error) {
    return handleApiError(error);
  }
}

