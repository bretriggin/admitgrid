import { calculateReferralWorkflow } from "@/lib/referralStatus";
import type { Referral } from "@/types/referral";

export function withWorkflowFields(referral: Referral): Referral {
  if (referral.status === "Completed") {
    return {
      ...referral,
      status: "Completed",
      currentOwner: referral.currentOwner ?? "None",
    };
  }

  const workflow = calculateReferralWorkflow(referral);

  return {
    ...referral,
    status: workflow.status,
    currentOwner: workflow.currentOwner,
  };
}
