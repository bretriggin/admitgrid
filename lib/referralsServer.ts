import { referralSelect } from "@/lib/referralsShared";
import { withWorkflowFields } from "@/lib/referralWorkflow";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Referral } from "@/types/referral";

export { referralSelect, withWorkflowFields };

export async function getActiveReferrals(): Promise<Referral[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("referrals")
    .select(referralSelect)
    .neq("status", "Completed")
    .order("created_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to fetch active referrals: ${error.message}`);
  }

  return (data ?? []) as Referral[];
}

export async function getCompletedReferrals(): Promise<Referral[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("referrals")
    .select(referralSelect)
    .eq("status", "Completed")
    .order("completedDate", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to fetch completed referrals: ${error.message}`);
  }

  return (data ?? []) as Referral[];
}

export async function getAllReferrals(): Promise<{
  activeReferrals: Referral[];
  completedReferrals: Referral[];
}> {
  const [activeReferrals, completedReferrals] = await Promise.all([
    getActiveReferrals(),
    getCompletedReferrals(),
  ]);

  return { activeReferrals, completedReferrals };
}
