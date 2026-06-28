import { supabase } from "@/lib/supabase";
import type { ReferralMessage } from "@/types/referralMessage";

export async function fetchReferralMessages(referralId: string): Promise<ReferralMessage[]> {
  const { data, error } = await supabase
    .from("referral_messages")
    .select("id, referralId, message, createdBy, createdAt")
    .eq("referralId", referralId)
    .order("createdAt", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch referral messages: ${error.message}`);
  }

  return (data ?? []) as ReferralMessage[];
}

export async function sendReferralMessage(params: {
  referralId: string;
  message: string;
  createdBy: string;
}): Promise<ReferralMessage> {
  const trimmedMessage = params.message.trim();

  if (!trimmedMessage) {
    throw new Error("Message cannot be empty.");
  }

  const { data, error } = await supabase
    .from("referral_messages")
    .insert({
      referralId: params.referralId,
      message: trimmedMessage,
      createdBy: params.createdBy,
      createdAt: new Date().toISOString(),
    })
    .select("id, referralId, message, createdBy, createdAt")
    .single();

  if (error) {
    throw new Error(`Failed to send referral message: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to save referral message.");
  }

  return data as ReferralMessage;
}
