import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ReferralActivityLogEntry } from "@/types/referralActivity";

export async function fetchAllReferralActivityLogs(): Promise<ReferralActivityLogEntry[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("referral_activity_log")
    .select("id, referralId, action, details, createdBy, createdAt")
    .order("createdAt", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch referral activity logs: ${error.message}`);
  }

  return (data ?? []) as ReferralActivityLogEntry[];
}
