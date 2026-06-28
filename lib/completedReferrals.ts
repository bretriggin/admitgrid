import type { Referral, ReferralOutcome } from "@/types/referral";

export const REFERRAL_OUTCOMES: ReferralOutcome[] = [
  "Admitted",
  "Clinical Denied",
  "Financial Denied",
  "Chose Another Facility",
  "Hospital Discharged Home",
  "Family Declined",
  "Hospice",
  "Expired",
  "Duplicate Referral",
  "Other",
];

export type CompletedMonthGroup = {
  key: string;
  label: string;
  referrals: Referral[];
};

export type CompletedYearGroup = {
  year: string;
  months: CompletedMonthGroup[];
};

export function getCompletedMonthKey(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getCompletedMonthLabel(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", { month: "long" });
}

export function groupCompletedByYearMonth(referrals: Referral[]): CompletedYearGroup[] {
  const monthGroups = new Map<string, CompletedMonthGroup>();

  for (const referral of referrals) {
    if (!referral.completedDate) {
      continue;
    }

    const key = getCompletedMonthKey(referral.completedDate);
    const existing = monthGroups.get(key);

    if (existing) {
      existing.referrals.push(referral);
      continue;
    }

    monthGroups.set(key, {
      key,
      label: getCompletedMonthLabel(referral.completedDate),
      referrals: [referral],
    });
  }

  const years = new Map<string, CompletedMonthGroup[]>();

  for (const month of monthGroups.values()) {
    const year = month.key.slice(0, 4);
    const existing = years.get(year);

    if (existing) {
      existing.push(month);
      continue;
    }

    years.set(year, [month]);
  }

  return Array.from(years.entries())
    .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
    .map(([year, months]) => ({
      year,
      months: months.sort((a, b) => b.key.localeCompare(a.key)),
    }));
}
