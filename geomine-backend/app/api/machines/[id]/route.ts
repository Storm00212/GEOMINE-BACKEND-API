import { NextRequest, NextResponse } from "next/server";
import { deleteMachineController } from "@/lib/modules/machines/machines.controller";
import { handleApiError } from "@/lib/http";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return await deleteMachineController(request, { params });
  } catch (error) {
    return handleApiError(error);
  }
}
