"use server";

import { revalidatePath } from "next/cache";
import { requireSystemOwnerUserProfile } from "@/lib/auth/session";
import { getSupabaseClientForMutation } from "@/lib/supabase/dataClient";
import { isTeamType, TEAM_TYPES } from "@/types/team";

export async function createTeamAction(input: {
  name: string;
  facilityId: string;
  teamType: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSystemOwnerUserProfile();
    const name = input.name.trim();

    if (!name) {
      return { success: false, error: "Team name is required." };
    }

    if (!input.facilityId) {
      return { success: false, error: "Facility is required." };
    }

    if (!isTeamType(input.teamType)) {
      return { success: false, error: "Select a valid team type." };
    }

    const supabase = await getSupabaseClientForMutation();
    const { error } = await supabase.from("teams").insert({
      name,
      facilityId: input.facilityId,
      teamType: input.teamType,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/administration");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to create team.",
    };
  }
}

export async function updateTeamAction(input: {
  teamId: string;
  name: string;
  facilityId: string;
  teamType: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSystemOwnerUserProfile();
    const name = input.name.trim();

    if (!name) {
      return { success: false, error: "Team name is required." };
    }

    if (!input.facilityId) {
      return { success: false, error: "Facility is required." };
    }

    if (!isTeamType(input.teamType)) {
      return { success: false, error: "Select a valid team type." };
    }

    const supabase = await getSupabaseClientForMutation();
    const { error } = await supabase
      .from("teams")
      .update({
        name,
        facilityId: input.facilityId,
        teamType: input.teamType,
      })
      .eq("id", input.teamId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/administration");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to update team.",
    };
  }
}

export { TEAM_TYPES };
