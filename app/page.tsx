import DashboardCard from "@/components/DashboardCard";
import { ReferralGrid } from "@/components/ReferralGrid";
import type { Referral } from "@/types/referral";

const referrals: Referral[] = [
  {
    id: "glen-wilson",
    patient: "Glen Wilson",
    type: "SNF",
    source: "HCA North Cypress",
    clinical: "Approved",
    highCostMeds: "None",
    equipment: "Walker",
    mds: "CVA / I69.354",
    medicalNecessity: "Yes",
    payer: "UHC WellMed",
    benefits: "$0 copay / OOP pending",
    authNumber: "Pending",
    authDates: "Pending",
    cwf: "Uploaded",
    financialApproval: "Pending",
    status: "Waiting on Auth",
  },
  {
    id: "mary-johnson",
    patient: "Mary Johnson",
    type: "LTC",
    source: "Medical City",
    clinical: "Pending",
    highCostMeds: "Review",
    equipment: "Hospital bed",
    mds: "Pending",
    medicalNecessity: "Review",
    payer: "Medicaid Pending",
    benefits: "Pending",
    authNumber: "N/A",
    authDates: "N/A",
    cwf: "N/A",
    financialApproval: "Pending",
    status: "Waiting on DON",
  },
  {
    id: "robert-smith",
    patient: "Robert Smith",
    type: "SNF",
    source: "Baylor Scott & White",
    clinical: "Denied",
    highCostMeds: "IV Dapto",
    equipment: "Wound vac",
    mds: "Infection / Pending ICD",
    medicalNecessity: "Yes",
    payer: "Humana MA",
    benefits: "$295/day copay",
    authNumber: "Not Started",
    authDates: "N/A",
    cwf: "Needed",
    financialApproval: "Hold",
    status: "Clinical Denial",
  },
];

export default function Home() {
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

        <section className="rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="text-xl font-bold">Admissions Decision Grid</h2>
              <p className="text-sm text-slate-500">
                Built around the actual SNF admission decision workflow.
              </p>
            </div>
            <button className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
              + New Referral
            </button>
          </div>

          <ReferralGrid referrals={referrals} />
        </section>
      </div>
    </main>
  );
}
