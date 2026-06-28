import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ReferralDocument } from "@/types/referralDocument";

export async function fetchReferralDocuments(): Promise<ReferralDocument[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("referral_documents")
    .select("id, referralId, fileName, filePath, documentType, uploadedAt, uploadedBy")
    .order("uploadedAt", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch referral documents: ${error.message}`);
  }

  return (data ?? []) as ReferralDocument[];
}
