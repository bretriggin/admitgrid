import { redirect } from "next/navigation";
import { getAuthenticatedUserProfile } from "@/lib/auth/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/userProfile";

export async function requireAuthenticatedUserProfile(): Promise<UserProfile> {
  const supabase = await createServerSupabaseClient();
  const profile = await getAuthenticatedUserProfile(supabase);

  if (!profile) {
    redirect("/login");
  }

  return profile;
}

export async function requireExecutiveUserProfile(): Promise<UserProfile> {
  const profile = await requireAuthenticatedUserProfile();

  if (!profile.isExecutive) {
    redirect("/");
  }

  return profile;
}

export async function requireSystemOwnerUserProfile(): Promise<UserProfile> {
  const profile = await requireAuthenticatedUserProfile();

  if (!profile.isSystemOwner) {
    redirect("/");
  }

  return profile;
}

export async function getOptionalAuthenticatedUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createServerSupabaseClient();
    return await getAuthenticatedUserProfile(supabase);
  } catch (error) {
    console.error("Error loading optional auth profile:", error);
    return null;
  }
}
