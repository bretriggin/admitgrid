"use server";

import { resolveUserProfileForAuthUser } from "@/lib/auth/bootstrap";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/userProfile";

export async function fetchCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return resolveUserProfileForAuthUser(supabase, user);
}
