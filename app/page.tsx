import DashboardCard from "@/components/DashboardCard";
import { AdmissionsSection } from "@/components/AdmissionsSection";
import { supabase } from "@/lib/supabase";
import type { Referral } from "@/types/referral";

export const dynamic = "force-dynamic";

async function getReferrals(): Promise<Referral[]> {
  try {
    const { data, error } = await supabase.from("referrals").select(`
      id,
      patient,
      type,
      source,
      clinical,
      highCostMeds,
      equipment,
      mds,
      medicalNecessity,
      payer,
      benefits,
      authNumber,
      authDates,
      cwf,
      financialApproval,
      status
    `);

    if (error) {
      throw new Error(`Failed to fetch referrals: ${error.message}`);
    }

    return (data ?? []) as Referral[];
  } catch (error) {
    console.error("Error loading referrals:", error);
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred while fetching referrals");
  }
}

export default async function Home() {
  const referrals = await getReferrals();

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            SNF Admissions Command Center
          </p>
          <h1 className="text-4xl font-bold">AdmitGrid</h1>
          <p className="mt-2 text-slate-600">
            Intake, clinical approval, MDS, benefits, authorization, CWF, and financial clearance in one grid.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <DashboardCard label="Today's Referrals" value="18" />
          <DashboardCard label="Ready to Admit" value="6" tone="green" />
          <DashboardCard label="Waiting on DON" value="2" tone="yellow" />
          <DashboardCard label="Waiting on Auth" value="3" tone="yellow" />
        </section>

        <AdmissionsSection referrals={referrals} />
      </div>
    </main>
  );
}
