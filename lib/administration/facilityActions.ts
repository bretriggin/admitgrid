"use server";

import { revalidatePath } from "next/cache";
import { requireSystemOwnerUserProfile } from "@/lib/auth/session";
import { getSupabaseClientForMutation } from "@/lib/supabase/dataClient";

export async function createFacilityAction(input: {
  name: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSystemOwnerUserProfile();
    const name = input.name.trim();

    if (!name) {
      return { success: false, error: "Facility name is required." };
    }

    const supabase = await getSupabaseClientForMutation();
    const { error } = await supabase.from("facilities").insert({
      name,
      isActive: true,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/administration");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to create facility.",
    };
  }
}

export async function updateFacilityAction(input: {
  facilityId: string;
  name: string;
  isActive: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSystemOwnerUserProfile();
    const name = input.name.trim();

    if (!name) {
      return { success: false, error: "Facility name is required." };
    }

    const supabase = await getSupabaseClientForMutation();
    const { error } = await supabase
      .from("facilities")
      .update({
        name,
        isActive: input.isActive,
      })
      .eq("id", input.facilityId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/administration");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to update facility.",
    };
  }
}
