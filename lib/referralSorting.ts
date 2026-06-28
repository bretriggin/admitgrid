import type { Referral } from "@/types/referral";

function getCreatedAtTime(referral: Referral): number {
  if (!referral.created_at) {
    return 0;
  }

  return new Date(referral.created_at).getTime();
}

function getCompletedDateTime(referral: Referral): number {
  if (!referral.completedDate) {
    return 0;
  }

  return new Date(referral.completedDate).getTime();
}

function compareCreatedAtDesc(referralA: Referral, referralB: Referral): number {
  const timeDifference = getCreatedAtTime(referralB) - getCreatedAtTime(referralA);

  if (timeDifference !== 0) {
    return timeDifference;
  }

  return (referralB.id ?? "").localeCompare(referralA.id ?? "");
}

function compareCompletedDateDesc(referralA: Referral, referralB: Referral): number {
  const timeDifference = getCompletedDateTime(referralB) - getCompletedDateTime(referralA);

  if (timeDifference !== 0) {
    return timeDifference;
  }

  return (referralB.id ?? "").localeCompare(referralA.id ?? "");
}

export function sortReferralsByCreatedAtDesc(referrals: Referral[]): Referral[] {
  return [...referrals].sort(compareCreatedAtDesc);
}

export function sortReferralsByCompletedDateDesc(referrals: Referral[]): Referral[] {
  return [...referrals].sort(compareCompletedDateDesc);
}
