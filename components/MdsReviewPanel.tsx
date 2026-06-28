"use client";

import { useEffect, useState } from "react";
import { useActorName } from "@/components/AuthProvider";
import { ReferralDocumentsSection } from "@/components/ReferralDocumentsSection";
import { logReferralActivity, REFERRAL_ACTIVITY_ACTIONS } from "@/lib/referralActivityLog";
import { supabase } from "@/lib/supabase";
import { getReferralWorkflowUpdate } from "@/lib/referralStatus";
import type { Referral } from "@/types/referral";

type MdsReviewPanelProps = {
  referral: Referral;
  onClose?: () => void;
  onReferralUpdated: () => void;
  embedded?: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

const labelClassName = "mb-1 block text-sm text-slate-600";

const medicalNecessityOptions = ["Yes", "No", "Pending More Info", "N/A"] as const;

function MedicalNecessitySelectOptions({ value }: { value: string }) {
  const includesCurrent = medicalNecessityOptions.includes(
    value as (typeof medicalNecessityOptions)[number],
  );

  return (
    <>
      {!includesCurrent && value ? <option value={value}>{value}</option> : null}
      {medicalNecessityOptions.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </>
  );
}

export function MdsReviewPanel({
  referral,
  onClose,
  onReferralUpdated,
  embedded = false,
}: MdsReviewPanelProps) {
  const actorName = useActorName();
  const [mds, setMds] = useState(referral.mds);
  const [medicalNecessity, setMedicalNecessity] = useState(referral.medicalNecessity);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMds(referral.mds);
    setMedicalNecessity(referral.medicalNecessity);
  }, [referral]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!referral.id) {
      setError("Missing referral id. Cannot save MDS review.");
      setIsSubmitting(false);
      return;
    }

    try {
      const updatedReferral: Referral = {
        ...referral,
        mds,
        medicalNecessity,
      };
      const workflow = getReferralWorkflowUpdate(updatedReferral);

      const { data, error: updateError } = await supabase
        .from("referrals")
        .update({
          mds,
          medicalNecessity,
          status: workflow.status,
          currentOwner: workflow.currentOwner,
        })
        .eq("id", referral.id)
        .select();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!data?.length) {
        throw new Error(`No referral found with id: ${referral.id}`);
      }

      await logReferralActivity(
        referral.id,
        REFERRAL_ACTIVITY_ACTIONS.MDS_REVIEW_SAVED,
        `MDS: ${mds}, Medical Necessity: ${medicalNecessity}`,
        actorName,
      );

      onReferralUpdated();
    } catch (submitError) {
      console.error("Error updating MDS review:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "An unexpected error occurred while saving MDS review",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={embedded ? "space-y-4" : "border-b p-5"}>
      {!embedded ? (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">MDS Review</h3>
            <p className="text-sm text-slate-500">{referral.patient}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Close
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="mds" className={labelClassName}>
            MDS
          </label>
          <input
            id="mds"
            type="text"
            value={mds}
            onChange={(event) => setMds(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="medicalNecessity" className={labelClassName}>
            Medical Necessity
          </label>
          <select
            id="medicalNecessity"
            value={medicalNecessity}
            onChange={(event) => setMedicalNecessity(event.target.value)}
            className={inputClassName}
          >
            <MedicalNecessitySelectOptions value={medicalNecessity} />
          </select>
        </div>
      </div>

      {!embedded ? (
        <div className="mt-4 grid gap-4">
          <ReferralDocumentsSection
            referral={referral}
            uploadedBy={actorName}
            onUpdated={onReferralUpdated}
          />
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      <div className="mt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save MDS Review"}
        </button>
      </div>
    </form>
  );
}
