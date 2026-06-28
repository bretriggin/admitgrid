import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchUserProfileByAuthUserId } from "@/lib/auth/profile";
import { isBrandNewSystem } from "@/lib/supabase/admin";
import {
  getUserProfileCount,
  hasSystemOwnerAccess,
  needsSystemOwnerPromotion,
  SYSTEM_OWNER_ACCESS,
} from "@/lib/auth/systemOwner";
import type { UserProfile } from "@/types/userProfile";
import type { User } from "@supabase/supabase-js";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readNameFromAuthUser(user: User): { firstName: string; lastName: string } {
  const metadata = user.user_metadata ?? {};

  const firstName = String(
    metadata.firstName ?? metadata.first_name ?? metadata.given_name ?? "",
  ).trim();

  const lastName = String(
    metadata.lastName ?? metadata.last_name ?? metadata.family_name ?? "",
  ).trim();

  if (firstName || lastName) {
    return { firstName, lastName };
  }

  const fullName = String(metadata.full_name ?? metadata.name ?? "").trim();

  if (!fullName) {
    return { firstName: "", lastName: "" };
  }

  const [head, ...rest] = fullName.split(/\s+/);
  return {
    firstName: head ?? "",
    lastName: rest.join(" "),
  };
}

async function ensureExecutiveRole(supabase: SupabaseClient, profileId: string): Promise<void> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("id")
    .eq("userProfileId", profileId)
    .eq("role", "Executive")
    .maybeSingle();

  if (error) {
    console.error("Failed to check Executive role during bootstrap:", error.message);
    return;
  }

  if (data) {
    return;
  }

  const { error: insertError } = await supabase.from("user_roles").insert({
    userProfileId: profileId,
    role: "Executive",
  });

  if (insertError) {
    console.error("Failed to assign Executive role during bootstrap:", insertError.message);
  }
}

/**
 * When exactly one profile exists and it belongs to the signed-in user, ensure full
 * System Owner access (including executive privileges and approval status).
 */
async function ensureSoleProfileSystemOwner(
  supabase: SupabaseClient,
  user: User,
  profile: UserProfile,
): Promise<UserProfile> {
  if (profile.authUserId !== user.id) {
    return profile;
  }

  const profileCount = await getUserProfileCount(supabase);

  if (profileCount !== 1) {
    if (hasSystemOwnerAccess(profile)) {
      await ensureExecutiveRole(supabase, profile.id);
    }

    return profile;
  }

  if (!needsSystemOwnerPromotion(profile)) {
    await ensureExecutiveRole(supabase, profile.id);
    return profile;
  }

  const { error } = await supabase
    .from("user_profiles")
    .update(SYSTEM_OWNER_ACCESS)
    .eq("id", profile.id)
    .eq("authUserId", user.id);

  if (error) {
    console.error("Failed to promote sole profile to system owner:", error.message);
    return profile;
  }

  await ensureExecutiveRole(supabase, profile.id);

  return (await fetchUserProfileByAuthUserId(supabase, user.id)) ?? profile;
}

/**
 * When user_profiles is empty, the first authenticated user becomes the System Owner.
 * Uses the caller's Supabase client (RLS policies must allow bootstrap inserts).
 */
export async function tryBootstrapFirstSystemOwnerProfile(
  user: User,
  supabase: SupabaseClient,
): Promise<UserProfile | null> {
  const existingProfile = await fetchUserProfileByAuthUserId(supabase, user.id);

  if (existingProfile) {
    return ensureSoleProfileSystemOwner(supabase, user, existingProfile);
  }

  if (!(await isBrandNewSystem(supabase))) {
    return null;
  }

  const email = normalizeEmail(user.email ?? "");

  if (!email) {
    return null;
  }

  const { firstName, lastName } = readNameFromAuthUser(user);
  const now = new Date().toISOString();

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .insert({
      authUserId: user.id,
      firstName,
      lastName,
      email,
      facility: "",
      jobTitle: "",
      ...SYSTEM_OWNER_ACCESS,
      createdAt: now,
    })
    .select("id")
    .single();

  if (profileError || !profile) {
    const racedProfile = await fetchUserProfileByAuthUserId(supabase, user.id);

    if (racedProfile) {
      return ensureSoleProfileSystemOwner(supabase, user, racedProfile);
    }

    return null;
  }

  await ensureExecutiveRole(supabase, profile.id);

  const createdProfile = await fetchUserProfileByAuthUserId(supabase, user.id);

  if (!createdProfile) {
    return null;
  }

  return ensureSoleProfileSystemOwner(supabase, user, createdProfile);
}

/** @deprecated Use tryBootstrapFirstSystemOwnerProfile */
export const tryBootstrapFirstExecutiveProfile = tryBootstrapFirstSystemOwnerProfile;

/**
 * Resolve the profile for the currently signed-in auth user, bootstrapping or
 * promoting the sole profile to System Owner when appropriate.
 */
export async function resolveUserProfileForAuthUser(
  supabase: SupabaseClient,
  user: User,
): Promise<UserProfile | null> {
  const profile = await fetchUserProfileByAuthUserId(supabase, user.id);

  if (profile) {
    return ensureSoleProfileSystemOwner(supabase, user, profile);
  }

  return tryBootstrapFirstSystemOwnerProfile(user, supabase);
}
