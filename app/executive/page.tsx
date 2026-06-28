import { AppHeader } from "@/components/AppHeader";
import { ExecutiveDashboard } from "@/components/ExecutiveDashboard";
import { requireExecutiveUserProfile } from "@/lib/auth/session";
import { computeExecutiveDashboardMetrics } from "@/lib/executiveDashboardMetrics";
import { fetchAllReferralActivityLogs } from "@/lib/referralActivityLogServer";
import { getAllReferrals } from "@/lib/referralsServer";

export const dynamic = "force-dynamic";

export default async function ExecutivePage() {
  await requireExecutiveUserProfile();
  const [{ activeReferrals, completedReferrals }, activityLogs] = await Promise.all([
    getAllReferrals(),
    fetchAllReferralActivityLogs().catch((error) => {
      console.error("Error loading referral activity logs:", error);
      return [];
    }),
  ]);

  const metrics = computeExecutiveDashboardMetrics(
    activeReferrals,
    completedReferrals,
    activityLogs,
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <AppHeader activeNav="executive" />
        <ExecutiveDashboard metrics={metrics} />
      </div>
    </main>
  );
}
