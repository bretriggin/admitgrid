import { getCompletedMonthKey } from "@/lib/completedReferrals";
import type { Referral } from "@/types/referral";

export const CLINICAL_DENIAL_REASONS = [
  "IV Antibiotics",
  "Ventilator",
  "Dialysis",
  "Behavioral",
  "Isolation",
  "Bariatric",
  "High Cost Medication",
  "No Appropriate Bed",
  "Staffing",
  "Physician Declined",
  "Other",
] as const;

export type ClinicalDenialReason = (typeof CLINICAL_DENIAL_REASONS)[number];

export type CompletedReferralsFilters = {
  outcome: string;
  denialReason: string;
  monthKey: string;
};

export const ALL_FILTER = "All";

export function getCompletedReasonDisplay(referral: Referral): string {
  if (referral.outcome === "Admitted") {
    return "-";
  }

  if (!referral.clinicalDenialReason?.trim()) {
    return "-";
  }

  if (referral.clinicalDenialReason === "Other" && referral.clinicalDenialNotes?.trim()) {
    return `Other: ${referral.clinicalDenialNotes.trim()}`;
  }

  return referral.clinicalDenialReason;
}

export function getCompletedMonthOptions(
  referrals: Referral[],
): { key: string; label: string }[] {
  const options = new Map<string, string>();

  for (const referral of referrals) {
    if (!referral.completedDate) {
      continue;
    }

    const key = getCompletedMonthKey(referral.completedDate);
    if (options.has(key)) {
      continue;
    }

    const date = new Date(referral.completedDate);
    const label = date.toLocaleString("en-US", { month: "long", year: "numeric" });
    options.set(key, label);
  }

  return Array.from(options.entries())
    .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
    .map(([key, label]) => ({ key, label }));
}

export function filterCompletedReferrals(
  referrals: Referral[],
  filters: CompletedReferralsFilters,
  options?: { ignoreMonth?: boolean },
): Referral[] {
  return referrals.filter((referral) => {
    if (!options?.ignoreMonth && filters.monthKey !== ALL_FILTER) {
      if (!referral.completedDate) {
        return false;
      }

      if (getCompletedMonthKey(referral.completedDate) !== filters.monthKey) {
        return false;
      }
    }

    if (filters.outcome !== ALL_FILTER && referral.outcome !== filters.outcome) {
      return false;
    }

    if (
      filters.denialReason !== ALL_FILTER &&
      referral.clinicalDenialReason !== filters.denialReason
    ) {
      return false;
    }

    return true;
  });
}

export function searchCompletedReferralsByPatient(
  referrals: Referral[],
  query: string,
): Referral[] {
  const trimmedQuery = query.trim().toLowerCase();

  if (!trimmedQuery) {
    return referrals;
  }

  return referrals.filter((referral) =>
    referral.patient.toLowerCase().includes(trimmedQuery),
  );
}
