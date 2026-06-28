import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApprovalStatus, UserProfile } from "@/types/userProfile";

export const SYSTEM_OWNER_ACCESS = {
  isSystemOwner: true,
  isExecutive: true,
  isActive: true,
  approvalStatus: "Approved" as ApprovalStatus,
};

export type SystemOwnerAccessFields = typeof SYSTEM_OWNER_ACCESS;

export function hasSystemOwnerAccess(
  profile: Pick<
    UserProfile,
    "isSystemOwner" | "isExecutive" | "isActive" | "approvalStatus"
  >,
): boolean {
  return (
    profile.isSystemOwner === true &&
    profile.isExecutive === true &&
    profile.isActive === true &&
    profile.approvalStatus === "Approved"
  );
}

export function needsSystemOwnerPromotion(
  profile: Pick<
    UserProfile,
    "isSystemOwner" | "isExecutive" | "isActive" | "approvalStatus"
  >,
): boolean {
  return !hasSystemOwnerAccess(profile);
}

export async function getUserProfileCount(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("user_profiles")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(`Failed to count user profiles: ${error.message}`);
  }

  return count ?? 0;
}

export async function isSoleUserProfile(
  supabase: SupabaseClient,
  profileId: string,
): Promise<boolean> {
  const count = await getUserProfileCount(supabase);

  if (count !== 1) {
    return false;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}
