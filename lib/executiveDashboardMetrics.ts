import { REFERRAL_ACTIVITY_ACTIONS } from "@/lib/referralActivityLog";
import { withWorkflowFields } from "@/lib/referralsServer";
import {
  DEFAULT_SLA_CONFIG,
  getSlaStatus,
  SLA_DEPARTMENTS,
  type SlaDepartment,
  type SlaStatus,
} from "@/lib/slaConfig";
import type { Referral } from "@/types/referral";
import type { ReferralActivityLogEntry } from "@/types/referralActivity";

export type BreakdownItem = {
  label: string;
  count: number;
  percentage: number;
};

export type SlaDepartmentMetric = {
  department: SlaDepartment;
  goalMinutes: number;
  actualAverageMinutes: number | null;
  actualAverage: string;
  status: SlaStatus;
};

export type OverallReferralTimeMetric = {
  actualAverage: string;
  actualAverageMinutes: number | null;
};

export type ExecutiveDashboardMetrics = {
  activeReferrals: number;
  readyToAdmit: number;
  completedThisMonth: number;
  admissionsThisMonth: number;
  clinicalDenials: number;
  financialDenials: number;
  slaMetrics: SlaDepartmentMetric[];
  overallAverageReferralTime: OverallReferralTimeMetric;
  referralSources: BreakdownItem[];
  outcomeBreakdown: BreakdownItem[];
  clinicalDenialReasons: BreakdownItem[];
};

function getFirstActionTimestamp(
  entries: ReferralActivityLogEntry[],
  action: string,
): number | null {
  const entry = entries.find((item) => item.action === action);

  if (!entry) {
    return null;
  }

  return new Date(entry.createdAt).getTime();
}

function groupActivityByReferralId(
  activityLogs: ReferralActivityLogEntry[],
): Map<string, ReferralActivityLogEntry[]> {
  const grouped = new Map<string, ReferralActivityLogEntry[]>();

  for (const entry of activityLogs) {
    const existing = grouped.get(entry.referralId);

    if (existing) {
      existing.push(entry);
      continue;
    }

    grouped.set(entry.referralId, [entry]);
  }

  return grouped;
}

export function formatDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return "—";
  }

  const totalMinutes = Math.round(durationMs / (1000 * 60));

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const totalHours = durationMs / (1000 * 60 * 60);

  if (totalHours < 24) {
    return `${totalHours.toFixed(1)} hrs`;
  }

  const totalDays = totalHours / 24;
  return `${totalDays.toFixed(1)} days`;
}

function averageDurationMs(durations: number[]): number | null {
  if (durations.length === 0) {
    return null;
  }

  return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
}

function durationMsToMinutes(durationMs: number): number {
  return Math.round(durationMs / (1000 * 60));
}

function buildSlaMetrics(stageDurations: {
  donReviewDurations: number[];
  mdsReviewDurations: number[];
  caseManagerReviewDurations: number[];
  businessOfficeReviewDurations: number[];
}): SlaDepartmentMetric[] {
  const durationByDepartment: Record<SlaDepartment, number[]> = {
    DON: stageDurations.donReviewDurations,
    MDS: stageDurations.mdsReviewDurations,
    "Case Manager": stageDurations.caseManagerReviewDurations,
    "Business Office": stageDurations.businessOfficeReviewDurations,
  };

  return SLA_DEPARTMENTS.map((department) => {
    const averageMs = averageDurationMs(durationByDepartment[department]);
    const actualAverageMinutes = averageMs === null ? null : durationMsToMinutes(averageMs);

    return {
      department,
      goalMinutes: DEFAULT_SLA_CONFIG.departmentGoalsMinutes[department],
      actualAverageMinutes,
      actualAverage: averageMs === null ? "—" : formatDuration(averageMs),
      status: getSlaStatus(actualAverageMinutes),
    };
  });
}

function isInCurrentMonth(dateValue?: string): boolean {
  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  );
}

function computeBreakdown(values: string[], emptyLabel = "Unknown"): BreakdownItem[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    const label = value.trim() || emptyLabel;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const total = values.length;

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((left, right) => right.count - left.count);
}

function computeStageDurations(activityLogs: ReferralActivityLogEntry[]) {
  const activityByReferralId = groupActivityByReferralId(activityLogs);
  const completionDurations: number[] = [];
  const donReviewDurations: number[] = [];
  const mdsReviewDurations: number[] = [];
  const caseManagerReviewDurations: number[] = [];
  const businessOfficeReviewDurations: number[] = [];

  for (const entries of activityByReferralId.values()) {
    const createdAt = getFirstActionTimestamp(entries, REFERRAL_ACTIVITY_ACTIONS.REFERRAL_CREATED);
    const donSavedAt = getFirstActionTimestamp(entries, REFERRAL_ACTIVITY_ACTIONS.DON_REVIEW_SAVED);
    const mdsSavedAt = getFirstActionTimestamp(entries, REFERRAL_ACTIVITY_ACTIONS.MDS_REVIEW_SAVED);
    const caseManagerSavedAt = getFirstActionTimestamp(
      entries,
      REFERRAL_ACTIVITY_ACTIONS.CASE_MANAGER_REVIEW_SAVED,
    );
    const businessOfficeSavedAt = getFirstActionTimestamp(
      entries,
      REFERRAL_ACTIVITY_ACTIONS.BOM_REVIEW_SAVED,
    );
    const completedAt = getFirstActionTimestamp(
      entries,
      REFERRAL_ACTIVITY_ACTIONS.REFERRAL_COMPLETED,
    );

    if (createdAt !== null && donSavedAt !== null) {
      donReviewDurations.push(donSavedAt - createdAt);
    }

    if (donSavedAt !== null && mdsSavedAt !== null) {
      mdsReviewDurations.push(mdsSavedAt - donSavedAt);
    }

    if (mdsSavedAt !== null && caseManagerSavedAt !== null) {
      caseManagerReviewDurations.push(caseManagerSavedAt - mdsSavedAt);
    }

    if (caseManagerSavedAt !== null && businessOfficeSavedAt !== null) {
      businessOfficeReviewDurations.push(businessOfficeSavedAt - caseManagerSavedAt);
    }

    if (createdAt !== null && completedAt !== null) {
      completionDurations.push(completedAt - createdAt);
    }
  }

  return {
    completionDurations,
    donReviewDurations,
    mdsReviewDurations,
    caseManagerReviewDurations,
    businessOfficeReviewDurations,
  };
}

export function computeExecutiveDashboardMetrics(
  activeReferrals: Referral[],
  completedReferrals: Referral[],
  activityLogs: ReferralActivityLogEntry[],
): ExecutiveDashboardMetrics {
  const activeWithWorkflow = activeReferrals.map(withWorkflowFields);
  const allReferrals = [...activeWithWorkflow, ...completedReferrals];

  const completedThisMonth = completedReferrals.filter((referral) =>
    isInCurrentMonth(referral.completedDate),
  );

  const admissionsThisMonth = completedThisMonth.filter(
    (referral) => referral.outcome === "Admitted",
  ).length;

  const clinicalDenials = completedReferrals.filter(
    (referral) => referral.outcome === "Clinical Denied",
  ).length;

  const financialDenials = completedReferrals.filter(
    (referral) => referral.outcome === "Financial Denied",
  ).length;

  const stageDurations = computeStageDurations(activityLogs);
  const overallAverageMs = averageDurationMs(stageDurations.completionDurations);

  const clinicalDenialReferrals = completedReferrals.filter(
    (referral) => referral.outcome === "Clinical Denied",
  );

  return {
    activeReferrals: activeReferrals.length,
    readyToAdmit: activeWithWorkflow.filter((referral) => referral.status === "Ready to Admit")
      .length,
    completedThisMonth: completedThisMonth.length,
    admissionsThisMonth,
    clinicalDenials,
    financialDenials,
    slaMetrics: buildSlaMetrics(stageDurations),
    overallAverageReferralTime: {
      actualAverage: overallAverageMs === null ? "—" : formatDuration(overallAverageMs),
      actualAverageMinutes:
        overallAverageMs === null ? null : durationMsToMinutes(overallAverageMs),
    },
    referralSources: computeBreakdown(allReferrals.map((referral) => referral.source ?? "")),
    outcomeBreakdown: computeBreakdown(
      completedReferrals.map((referral) => referral.outcome ?? "Unknown"),
    ),
    clinicalDenialReasons: computeBreakdown(
      clinicalDenialReferrals.map((referral) => referral.clinicalDenialReason ?? "Unknown"),
    ),
  };
}
