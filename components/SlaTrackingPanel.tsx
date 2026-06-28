import {
  formatSlaGoal,
  getSlaStatusLabel,
  type SlaStatus,
} from "@/lib/slaConfig";
import type { SlaDepartmentMetric } from "@/lib/executiveDashboardMetrics";

const statusStyles: Record<SlaStatus, { badge: string; dot: string }> = {
  green: {
    badge: "bg-green-100 text-green-800",
    dot: "bg-green-600",
  },
  yellow: {
    badge: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-500",
  },
  red: {
    badge: "bg-red-100 text-red-800",
    dot: "bg-red-600",
  },
  none: {
    badge: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
};

function SlaStatusIndicator({ status }: { status: SlaStatus }) {
  const styles = statusStyles[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
    >
      <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
      {getSlaStatusLabel(status)}
    </span>
  );
}

export function SlaDepartmentCard({ metric }: { metric: SlaDepartmentMetric }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{metric.department}</h3>
        <SlaStatusIndicator status={metric.status} />
      </div>

      <dl className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-sm text-slate-500">Goal</dt>
          <dd className="text-sm font-medium text-slate-900">
            {formatSlaGoal(metric.goalMinutes)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-sm text-slate-500">Actual Average</dt>
          <dd className="text-sm font-semibold text-slate-900">{metric.actualAverage}</dd>
        </div>
      </dl>
    </div>
  );
}

export function OverallReferralTimeCard({
  actualAverage,
}: {
  actualAverage: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">Overall Average Referral Time</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{actualAverage}</p>
      <p className="mt-2 text-sm text-slate-500">
        Total business time from referral creation to completion.
      </p>
    </div>
  );
}
