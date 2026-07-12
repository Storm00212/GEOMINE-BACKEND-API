import { requireRole } from "@/lib/modules/auth";
import { inviteUserByEmail, type InvitedUser } from "./admin.repository";
import type { UserRole } from "@/types/database";

export interface InviteUserInput {
  email: string;
  fullName: string;
  role: UserRole;
}

export async function inviteUser(
  request: Request,
  input: InviteUserInput
): Promise<InvitedUser> {
  await requireRole(request, ["admin"]);


  if (!input.email || !["miner", "it", "admin"].includes(input.role)) {
    throw new Error("Invalid invite payload");
  }

  return inviteUserByEmail(input.email, {
    full_name: input.fullName,
    role: input.role,
  });
}
