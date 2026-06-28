import type { Referral } from "@/types/referral";

export type ReferralStatusBadgeLabel =
  | "New Referral"
  | "In Review"
  | "Ready to Admit"
  | "Clinical Denied"
  | "Financial Denied"
  | "Admitted"
  | "Not Admitted";

export function getReferralStatusDisplayLabel(referral: Referral): string {
  if (referral.status === "Completed") {
    if (referral.outcome === "Clinical Denied") {
      return "Clinical Denied";
    }

    if (referral.outcome === "Financial Denied") {
      return "Financial Denied";
    }

    if (referral.outcome === "Admitted") {
      return "Admitted";
    }

    return "Not Admitted";
  }

  return referral.status;
}

export function getReferralStatusBadgeClassName(label: string): string {
  switch (label) {
    case "New Referral":
      return "bg-gray-200 text-gray-700";
    case "In Review":
      return "bg-blue-600 text-white";
    case "Ready to Admit":
      return "bg-green-600 text-white";
    case "Clinical Denied":
    case "Financial Denied":
      return "bg-red-600 text-white";
    case "Admitted":
    case "Not Admitted":
      return "bg-gray-700 text-white";
    default:
      return "bg-gray-200 text-gray-700";
  }
}
