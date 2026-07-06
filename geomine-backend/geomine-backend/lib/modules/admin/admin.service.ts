import { requireRole } from "@/lib/modules/auth";
import { inviteUserByEmail } from "./admin.repository";
import type { UserRole } from "@/types/database";

export interface InviteUserInput {
  email: string;
  fullName: string;
  role: UserRole;
}

export async function inviteUser(input: InviteUserInput): Promise<void> {
  await requireRole(["admin"]);

  if (!input.email || !["miner", "it", "admin"].includes(input.role)) {
    throw new Error("Invalid invite payload");
  }

  const { error } = await inviteUserByEmail(input.email, {
    full_name: input.fullName,
    role: input.role,
  });

  if (error) throw new Error(error.message);
}
