import type { SupabaseClient } from "@supabase/supabase-js";

export const SYSTEM_OWNER_PROTECTED =
  "The System Owner account cannot be edited, deactivated, rejected, downgraded, or have roles removed.";

export async function isSystemOwnerProfile(
  supabase: SupabaseClient,
  profileId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("isSystemOwner")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return data.isSystemOwner === true;
}

export async function isSystemOwnerAuthUser(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("isSystemOwner")
    .eq("authUserId", authUserId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return data.isSystemOwner === true;
}

export async function assertMutableManagedProfile(
  supabase: SupabaseClient,
  profileId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (await isSystemOwnerProfile(supabase, profileId)) {
    return { ok: false, error: SYSTEM_OWNER_PROTECTED };
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "User profile not found." };
  }

  return { ok: true };
}
