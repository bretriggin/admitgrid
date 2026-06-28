import DashboardCard from "@/components/DashboardCard";
import { AdmissionsBoard } from "@/components/AdmissionsBoard";
import { AppHeader } from "@/components/AppHeader";
import { groupDocumentsByReferralId } from "@/lib/clinicalDocuments";
import { fetchReferralDocuments } from "@/lib/clinicalDocumentsServer";
import { withWorkflowFields } from "@/lib/referralWorkflow";
import {
  getActiveReferrals,
  getCompletedReferrals,
} from "@/lib/referralsServer";
import {
  sortReferralsByCompletedDateDesc,
  sortReferralsByCreatedAtDesc,
} from "@/lib/referralSorting";
import type { Referral } from "@/types/referral";
import type { ReferralDocument } from "@/types/referralDocument";

export const dynamic = "force-dynamic";

function attachDocuments(
  referrals: Referral[],
  documentsByReferralId: Map<string, ReferralDocument[]>,
): Referral[] {
  return referrals.map((referral) => ({
    ...referral,
    documents: referral.id ? documentsByReferralId.get(referral.id) ?? [] : [],
  }));
}

export default async function Home() {
  const [activeReferralsRaw, completedReferralsRaw, documents] = await Promise.all([
    getActiveReferrals(),
    getCompletedReferrals(),
    fetchReferralDocuments().catch((error) => {
      console.error("Error loading referral documents:", error);
      return [];
    }),
  ]);

  const documentsByReferralId = groupDocumentsByReferralId(documents);

  const activeReferrals = sortReferralsByCreatedAtDesc(
    attachDocuments(activeReferralsRaw.map(withWorkflowFields), documentsByReferralId),
  );
  const completedReferrals = sortReferralsByCompletedDateDesc(
    attachDocuments(completedReferralsRaw.map(withWorkflowFields), documentsByReferralId),
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <AppHeader activeNav="board" />

        <section className="grid gap-4 md:grid-cols-4">
          <DashboardCard label="Today's Referrals" value="18" />
          <DashboardCard label="Ready to Admit" value="6" tone="green" />
          <DashboardCard label="Waiting on DON" value="2" tone="yellow" />
          <DashboardCard label="Waiting on Auth" value="3" tone="yellow" />
        </section>

        <AdmissionsBoard
          initialActiveReferrals={activeReferrals}
          initialCompletedReferrals={completedReferrals}
        />
      </div>
    </main>
  );
}
