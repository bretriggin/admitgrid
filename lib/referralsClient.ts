import { groupDocumentsByReferralId } from "@/lib/clinicalDocuments";
import { referralSelect } from "@/lib/referralsShared";
import { withWorkflowFields } from "@/lib/referralWorkflow";
import {
  sortReferralsByCompletedDateDesc,
  sortReferralsByCreatedAtDesc,
} from "@/lib/referralSorting";
import { supabase } from "@/lib/supabase";
import type { Referral } from "@/types/referral";
import type { ReferralDocument } from "@/types/referralDocument";

async function fetchReferralDocumentsClient(): Promise<ReferralDocument[]> {
  const { data, error } = await supabase
    .from("referral_documents")
    .select("id, referralId, fileName, filePath, documentType, uploadedAt, uploadedBy")
    .order("uploadedAt", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch referral documents: ${error.message}`);
  }

  return (data ?? []) as ReferralDocument[];
}

function attachDocuments(
  referrals: Referral[],
  documentsByReferralId: Map<string, ReferralDocument[]>,
): Referral[] {
  return referrals.map((referral) => ({
    ...referral,
    documents: referral.id ? documentsByReferralId.get(referral.id) ?? [] : [],
  }));
}

export type ReferralsSnapshot = {
  activeReferrals: Referral[];
  completedReferrals: Referral[];
};

export async function fetchReferralsSnapshot(): Promise<ReferralsSnapshot> {
  const [activeResult, completedResult, documents] = await Promise.all([
    supabase
      .from("referrals")
      .select(referralSelect)
      .neq("status", "Completed")
      .order("created_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("referrals")
      .select(referralSelect)
      .eq("status", "Completed")
      .order("completedDate", { ascending: false, nullsFirst: false }),
    fetchReferralDocumentsClient(),
  ]);

  if (activeResult.error) {
    throw new Error(`Failed to fetch active referrals: ${activeResult.error.message}`);
  }

  if (completedResult.error) {
    throw new Error(`Failed to fetch completed referrals: ${completedResult.error.message}`);
  }

  const documentsByReferralId = groupDocumentsByReferralId(documents);

  const activeReferrals = sortReferralsByCreatedAtDesc(
    attachDocuments(
      ((activeResult.data ?? []) as Referral[]).map(withWorkflowFields),
      documentsByReferralId,
    ),
  );

  const completedReferrals = sortReferralsByCompletedDateDesc(
    attachDocuments(
      ((completedResult.data ?? []) as Referral[]).map(withWorkflowFields),
      documentsByReferralId,
    ),
  );

  return { activeReferrals, completedReferrals };
}
