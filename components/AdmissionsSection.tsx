"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BomReviewPanel } from "@/components/BomReviewPanel";
import { CaseManagerPanel } from "@/components/CaseManagerPanel";
import { DonReviewPanel } from "@/components/DonReviewPanel";
import { MdsReviewPanel } from "@/components/MdsReviewPanel";
import { NewReferralForm } from "@/components/NewReferralForm";
import { ReferralGrid } from "@/components/ReferralGrid";
import type { Referral } from "@/types/referral";

type AdmissionsSectionProps = {
  referrals: Referral[];
};

export function AdmissionsSection({ referrals }: AdmissionsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedDonReferral, setSelectedDonReferral] = useState<Referral | null>(null);
  const [selectedMdsReferral, setSelectedMdsReferral] = useState<Referral | null>(null);
  const [selectedCaseManagerReferral, setSelectedCaseManagerReferral] =
    useState<Referral | null>(null);
  const [selectedBomReferral, setSelectedBomReferral] = useState<Referral | null>(null);
  const router = useRouter();

  function handleReferralCreated() {
    setShowForm(false);
    router.refresh();
  }

  function handleDonReferralUpdated() {
    setSelectedDonReferral(null);
    router.refresh();
  }

  function handleMdsReferralUpdated() {
    setSelectedMdsReferral(null);
    router.refresh();
  }

  function handleCaseManagerReferralUpdated() {
    setSelectedCaseManagerReferral(null);
    router.refresh();
  }

  function handleBomReferralUpdated() {
    setSelectedBomReferral(null);
    router.refresh();
  }

  function openDonReview(referral: Referral) {
    setShowForm(false);
    setSelectedMdsReferral(null);
    setSelectedCaseManagerReferral(null);
    setSelectedBomReferral(null);
    setSelectedDonReferral(referral);
  }

  function openMdsReview(referral: Referral) {
    setShowForm(false);
    setSelectedDonReferral(null);
    setSelectedCaseManagerReferral(null);
    setSelectedBomReferral(null);
    setSelectedMdsReferral(referral);
  }

  function openCaseManagerReview(referral: Referral) {
    setShowForm(false);
    setSelectedDonReferral(null);
    setSelectedMdsReferral(null);
    setSelectedBomReferral(null);
    setSelectedCaseManagerReferral(referral);
  }

  function openBomReview(referral: Referral) {
    setShowForm(false);
    setSelectedDonReferral(null);
    setSelectedMdsReferral(null);
    setSelectedCaseManagerReferral(null);
    setSelectedBomReferral(referral);
  }

  return (
    <section className="rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b p-5">
        <div>
          <h2 className="text-xl font-bold">Admissions Decision Grid</h2>
          <p className="text-sm text-slate-500">
            Built around the actual SNF admission decision workflow.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
        >
          + New Referral
        </button>
      </div>

      {showForm ? <NewReferralForm onReferralCreated={handleReferralCreated} /> : null}

      {selectedDonReferral ? (
        <DonReviewPanel
          referral={selectedDonReferral}
          onClose={() => setSelectedDonReferral(null)}
          onReferralUpdated={handleDonReferralUpdated}
        />
      ) : null}

      {selectedMdsReferral ? (
        <MdsReviewPanel
          referral={selectedMdsReferral}
          onClose={() => setSelectedMdsReferral(null)}
          onReferralUpdated={handleMdsReferralUpdated}
        />
      ) : null}

      {selectedCaseManagerReferral ? (
        <CaseManagerPanel
          referral={selectedCaseManagerReferral}
          onClose={() => setSelectedCaseManagerReferral(null)}
          onReferralUpdated={handleCaseManagerReferralUpdated}
        />
      ) : null}

      {selectedBomReferral ? (
        <BomReviewPanel
          referral={selectedBomReferral}
          onClose={() => setSelectedBomReferral(null)}
          onReferralUpdated={handleBomReferralUpdated}
        />
      ) : null}

      {referrals.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">No referrals yet.</p>
      ) : (
        <ReferralGrid
          referrals={referrals}
          onRowClick={openDonReview}
          onMdsReview={openMdsReview}
          onCaseManagerReview={openCaseManagerReview}
          onBomReview={openBomReview}
        />
      )}
    </section>
  );
}
