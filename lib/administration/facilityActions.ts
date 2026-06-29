"use server";

import { revalidatePath } from "next/cache";
import { requireSystemOwnerUserProfile } from "@/lib/auth/session";
import { isNextRedirectError } from "@/lib/auth/errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CreateFacilityResult, FacilityInsertDebug } from "@/lib/administration/facilityActionTypes";
import type { Facility } from "@/types/facility";

type PostgrestErrorLike = {
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

const FACILITY_SELECT = 'id, name, "isActive", "createdAt"';

function formatPostgrestError(error: PostgrestErrorLike): string {
  const parts = [error.message];

  if (error.code) {
    parts.push(`Code: ${error.code}`);
  }

  if (error.details) {
    parts.push(`Details: ${error.details}`);
  }

  if (error.hint) {
    parts.push(`Hint: ${error.hint}`);
  }

  return parts.join(" | ");
}

function serializeForDebug(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (typeof value === "object") {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
  }

  return value;
}

function mapFacilityRow(row: {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}): Facility {
  return {
    id: row.id,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt,
  };
}

export async function createFacilityAction(input: {
  name: string;
}): Promise<CreateFacilityResult> {
  const steps: string[] = [];
  const debug: FacilityInsertDebug = {
    serverActionCalled: true,
    steps,
    insertStatement: `supabase.from("facilities").insert({ name }).select('${FACILITY_SELECT}').single()`,
    insertPayload: null,
    selectColumns: FACILITY_SELECT,
    profileId: null,
    supabaseData: null,
    supabaseError: null,
  };

  steps.push("Server action started");
  console.log("[createFacilityAction] Server action started");
  console.log("[createFacilityAction] Facility name received:", input.name);

  try {
    steps.push("Calling requireSystemOwnerUserProfile()");
    const profile = await requireSystemOwnerUserProfile();
    debug.profileId = profile.id;
    steps.push(`System owner verified: ${profile.id}`);
    console.log("[createFacilityAction] System owner verified:", profile.id);

    const name = input.name.trim();
    debug.insertPayload = { name };

    if (!name) {
      steps.push("Validation failed: empty facility name");
      return {
        success: false,
        error: "Facility name is required.",
        debug,
      };
    }

    steps.push("Database insert started");
    console.log("[createFacilityAction] Database insert started");
    console.log(
      "[createFacilityAction] Insert statement:",
      debug.insertStatement,
      debug.insertPayload,
    );

    const supabase = await createServerSupabaseClient();
    const response = await supabase
      .from("facilities")
      .insert({ name })
      .select(FACILITY_SELECT)
      .single();

    debug.supabaseData = serializeForDebug(response.data);
    debug.supabaseError = serializeForDebug(response.error);

    console.log("[createFacilityAction] Supabase response data:", response.data);
    console.log("[createFacilityAction] Supabase response error:", response.error);

    if (response.error) {
      const errorMessage = formatPostgrestError(response.error);
      steps.push(`Database insert error: ${errorMessage}`);
      console.error("[createFacilityAction] Database insert error:", response.error);
      return {
        success: false,
        error: errorMessage,
        debug,
      };
    }

    if (!response.data) {
      const errorMessage =
        "Insert returned no row. Check RLS SELECT policy on the facilities table.";
      steps.push(errorMessage);
      return {
        success: false,
        error: errorMessage,
        debug,
      };
    }

    const facility = mapFacilityRow(response.data as {
      id: string;
      name: string;
      isActive: boolean;
      createdAt: string;
    });

    steps.push(`Database insert success: ${facility.id}`);
    console.log("[createFacilityAction] Database insert success:", facility);

    revalidatePath("/administration");
    revalidatePath("/");

    return { success: true, facility, debug };
  } catch (error) {
    console.error("[createFacilityAction] Unexpected exception:", error);
    debug.supabaseError = serializeForDebug(error);

    if (isNextRedirectError(error)) {
      steps.push("Auth redirect thrown — user may not be system owner on this request");
      throw error;
    }

    const errorMessage =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error);

    steps.push(`Unexpected exception: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      debug,
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

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("facilities")
      .update({
        name,
        isActive: input.isActive,
      })
      .eq("id", input.facilityId);

    if (error) {
      return { success: false, error: formatPostgrestError(error) };
    }

    revalidatePath("/administration");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[updateFacilityAction] Unexpected exception:", error);

    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof Error) {
      return { success: false, error: `${error.name}: ${error.message}` };
    }

    return { success: false, error: String(error) };
  }
}
