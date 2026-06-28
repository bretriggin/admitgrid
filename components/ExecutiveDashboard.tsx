import DashboardCard from "@/components/DashboardCard";
import { BreakdownPanel } from "@/components/BreakdownPanel";
import { OverallReferralTimeCard, SlaDepartmentCard } from "@/components/SlaTrackingPanel";
import type { ExecutiveDashboardMetrics } from "@/lib/executiveDashboardMetrics";

type ExecutiveDashboardProps = {
  metrics: ExecutiveDashboardMetrics;
};

export function ExecutiveDashboard({ metrics }: ExecutiveDashboardProps) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Executive View
          </p>
          <h2 className="text-xl font-bold">Referral Overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Current pipeline and monthly completion metrics from the referrals table.
          </p>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          <DashboardCard
            label="Active Referrals"
            value={String(metrics.activeReferrals)}
            tone="blue"
          />
          <DashboardCard
            label="Ready to Admit"
            value={String(metrics.readyToAdmit)}
            tone="green"
          />
          <DashboardCard
            label="Completed This Month"
            value={String(metrics.completedThisMonth)}
          />
          <DashboardCard
            label="Admissions This Month"
            value={String(metrics.admissionsThisMonth)}
            tone="green"
          />
          <DashboardCard
            label="Clinical Denials"
            value={String(metrics.clinicalDenials)}
            tone="red"
          />
          <DashboardCard
            label="Financial Denials"
            value={String(metrics.financialDenials)}
            tone="red"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-xl font-bold">SLA Tracking</h2>
          <p className="mt-1 text-sm text-slate-500">
            Department review performance against configurable SLA goals from activity logs.
          </p>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          {metrics.slaMetrics.map((metric) => (
            <SlaDepartmentCard key={metric.department} metric={metric} />
          ))}
        </div>

        <div className="border-t p-5">
          <OverallReferralTimeCard
            actualAverage={metrics.overallAverageReferralTime.actualAverage}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <BreakdownPanel
          title="Referral Sources"
          description="Distribution of referral sources across active and completed referrals."
          items={metrics.referralSources}
          emptyMessage="No referral sources recorded yet."
        />
        <BreakdownPanel
          title="Outcome Breakdown"
          description="Completed referral outcomes across all time."
          items={metrics.outcomeBreakdown}
          emptyMessage="No completed referral outcomes yet."
          barClassName="bg-green-600"
        />
      </div>

      <BreakdownPanel
        title="Clinical Denial Reasons"
        description="Reasons recorded for clinically denied referrals."
        items={metrics.clinicalDenialReasons}
        emptyMessage="No clinical denial reasons recorded yet."
        barClassName="bg-red-600"
      />
    </div>
  );
}
