import { inviteUser } from "./admin.service";
import { handleApiError } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

/** POST /api/admin/invite — admin only (enforced in the service layer). */
export async function inviteUserController(request: NextRequest) {
  try {
    const { email, full_name, role } = await request.json();
    await inviteUser({ email, fullName: full_name, role });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
