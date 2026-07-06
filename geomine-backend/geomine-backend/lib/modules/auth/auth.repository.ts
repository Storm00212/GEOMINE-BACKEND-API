// Repository layer — raw data access only. No business rules, no auth
// decisions live here, just "get the row(s)". Every other layer in this
// module goes through here rather than calling Supabase directly.

import { createClient } from "@/lib/supabase/request-client";
import type { Profile } from "@/types/database";
import type { User } from "@supabase/supabase-js";

export async function getAuthUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
  return (data as Profile) ?? null;
}
