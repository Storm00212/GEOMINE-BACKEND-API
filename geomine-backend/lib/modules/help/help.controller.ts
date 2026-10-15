import { requireAuth } from "@/lib/modules/auth";
import { handleApiError } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { askHelpAssistant } from "./help.service";

export async function helpChatController(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const reply = await askHelpAssistant(body?.message, body?.language, body?.pathname);
    return NextResponse.json({ reply });
  } catch (error) {
    return handleApiError(error);
  }
}