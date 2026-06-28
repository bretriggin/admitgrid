import { supabase } from "@/lib/supabase";
import type { ReferralActivityAction, ReferralActivityLogEntry } from "@/types/referralActivity";

export const REFERRAL_ACTIVITY_ACTIONS = {
  REFERRAL_CREATED: "Referral created",
  DOCUMENT_UPLOADED: "Document uploaded",
  DON_REVIEW_SAVED: "DON review saved",
  MDS_REVIEW_SAVED: "MDS review saved",
  CASE_MANAGER_REVIEW_SAVED: "Case Manager review saved",
  BOM_REVIEW_SAVED: "BOM review saved",
  REFERRAL_COMPLETED: "Referral completed",
} as const satisfies Record<string, ReferralActivityAction>;

export async function logReferralActivity(
  referralId: string,
  action: ReferralActivityAction,
  details: string,
  createdBy = "",
): Promise<void> {
  try {
    const { error } = await supabase.from("referral_activity_log").insert({
      referralId,
      action,
      details,
      createdBy,
      createdAt: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to log referral activity:", error.message);
    }
  } catch (error) {
    console.error("Failed to log referral activity:", error);
  }
}

export async function fetchReferralActivityLog(
  referralId: string,
): Promise<ReferralActivityLogEntry[]> {
  const { data, error } = await supabase
    .from("referral_activity_log")
    .select("id, referralId, action, details, createdBy, createdAt")
    .eq("referralId", referralId)
    .order("createdAt", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch referral activity log: ${error.message}`);
  }

  return (data ?? []) as ReferralActivityLogEntry[];
}
