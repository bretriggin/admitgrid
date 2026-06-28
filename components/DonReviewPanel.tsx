"use client";

import { useEffect, useState } from "react";
import { useActorName } from "@/components/AuthProvider";
import { ReferralDocumentsSection } from "@/components/ReferralDocumentsSection";
import { CLINICAL_DENIAL_REASONS } from "@/lib/clinicalDenial";
import { logReferralActivity, REFERRAL_ACTIVITY_ACTIONS } from "@/lib/referralActivityLog";
import {
  buildClinicalDecisionActivity,
  createActivityFeedItem,
} from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { getReferralWorkflowUpdate } from "@/lib/referralStatus";
import type { ClinicalDenialReason, Referral } from "@/types/referral";

type DonReviewPanelProps = {
  referral: Referral;
  onClose?: () => void;
  onReferralUpdated: () => void;
  embedded?: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

const labelClassName = "mb-1 block text-sm text-slate-600";

const clinicalOptions = ["Yes", "No", "Pending More Info"] as const;

function ClinicalSelectOptions({ value }: { value: string }) {
  const includesCurrent = clinicalOptions.includes(value as (typeof clinicalOptions)[number]);

  return (
    <>
      {!includesCurrent && value ? <option value={value}>{value}</option> : null}
      {clinicalOptions.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </>
  );
}

function DenialReasonSelectOptions({ value }: { value: string }) {
  const includesCurrent = CLINICAL_DENIAL_REASONS.includes(value as ClinicalDenialReason);

  return (
    <>
      <option value="">Select denial reason...</option>
      {!includesCurrent && value ? <option value={value}>{value}</option> : null}
      {CLINICAL_DENIAL_REASONS.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </>
  );
}

export function DonReviewPanel({
  referral,
  onClose,
  onReferralUpdated,
  embedded = false,
}: DonReviewPanelProps) {
  const actorName = useActorName();
  const [clinical, setClinical] = useState(referral.clinical);
  const [denialReason, setDenialReason] = useState(referral.clinicalDenialReason ?? "");
  const [denialNotes, setDenialNotes] = useState(referral.clinicalDenialNotes ?? "");
  const [highCostMeds, setHighCostMeds] = useState(referral.highCostMeds);
  const [equipment, setEquipment] = useState(referral.equipment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setClinical(referral.clinical);
    setDenialReason(referral.clinicalDenialReason ?? "");
    setDenialNotes(referral.clinicalDenialNotes ?? "");
    setHighCostMeds(referral.highCostMeds);
    setEquipment(referral.equipment);
  }, [referral]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!referral.id) {
      setError("Missing referral id. Cannot save DON review.");
      return;
    }

    if (clinical === "No" && !denialReason.trim()) {
      setError("Denial reason is required when Clinical is No.");
      return;
    }

    if (clinical === "No" && denialReason === "Other" && !denialNotes.trim()) {
      setError("Additional notes are required when Denial Reason is Other.");
      return;
    }

    setIsSubmitting(true);

    try {
      const isClinicalDenial = clinical === "No";
      const trimmedDenialReason = denialReason.trim();
      const trimmedDenialNotes = denialNotes.trim();

      const updatedReferral: Referral = {
        ...referral,
        clinical,
        clinicalDenialReason: isClinicalDenial ? trimmedDenialReason : "",
        clinicalDenialNotes: isClinicalDenial ? trimmedDenialNotes : "",
        highCostMeds,
        equipment,
      };

      const updatePayload = isClinicalDenial
        ? {
            clinical,
            clinicalDenialReason: trimmedDenialReason,
            clinicalDenialNotes: trimmedDenialNotes,
            highCostMeds,
            equipment,
            status: "Completed",
            currentOwner: "None",
            outcome: "Clinical Denied",
            completedDate: new Date().toISOString(),
          }
        : (() => {
            const workflow = getReferralWorkflowUpdate(updatedReferral);

            return {
              clinical,
              clinicalDenialReason: "",
              clinicalDenialNotes: "",
              highCostMeds,
              equipment,
              status: workflow.status,
              currentOwner: workflow.currentOwner,
            };
          })();

      const { data, error: updateError } = await supabase
        .from("referrals")
        .update(updatePayload)
        .eq("id", referral.id)
        .select();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!data?.length) {
        throw new Error(`No referral found with id: ${referral.id}`);
      }

      const donDetails = isClinicalDenial
        ? `Clinical: No, Denial Reason: ${trimmedDenialReason}, High Cost Meds: ${highCostMeds}, Equipment: ${equipment}`
        : `Clinical: ${clinical}, High Cost Meds: ${highCostMeds}, Equipment: ${equipment}`;

      await logReferralActivity(
        referral.id,
        REFERRAL_ACTIVITY_ACTIONS.DON_REVIEW_SAVED,
        donDetails,
        actorName,
      );

      if (isClinicalDenial) {
        await logReferralActivity(
          referral.id,
          REFERRAL_ACTIVITY_ACTIONS.REFERRAL_COMPLETED,
          `Outcome: Clinical Denied, Reason: ${trimmedDenialReason}`,
          actorName,
        );
      }

      if (clinical !== referral.clinical) {
        const activity = buildClinicalDecisionActivity(referral.patient, clinical);

        if (activity) {
          await createActivityFeedItem({
            referralId: referral.id,
            createdBy: actorName,
            ...activity,
          });
        }
      }

      onReferralUpdated();
    } catch (submitError) {
      console.error("Error updating DON review:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "An unexpected error occurred while saving DON review",
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
            <h3 className="text-lg font-bold">DON Review</h3>
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
          <label htmlFor="clinical" className={labelClassName}>
            Clinical
          </label>
          <select
            id="clinical"
            value={clinical}
            onChange={(event) => setClinical(event.target.value)}
            className={inputClassName}
          >
            <ClinicalSelectOptions value={clinical} />
          </select>
        </div>

        <div>
          <label htmlFor="highCostMeds" className={labelClassName}>
            High Cost Meds
          </label>
          <input
            id="highCostMeds"
            type="text"
            value={highCostMeds}
            onChange={(event) => setHighCostMeds(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="equipment" className={labelClassName}>
            Equipment
          </label>
          <input
            id="equipment"
            type="text"
            value={equipment}
            onChange={(event) => setEquipment(event.target.value)}
            className={inputClassName}
          />
        </div>

        {clinical === "No" ? (
          <>
            <div>
              <label htmlFor="denialReason" className={labelClassName}>
                Denial Reason
              </label>
              <select
                id="denialReason"
                value={denialReason}
                onChange={(event) => setDenialReason(event.target.value)}
                className={inputClassName}
                required
              >
                <DenialReasonSelectOptions value={denialReason} />
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-2">
              <label htmlFor="denialNotes" className={labelClassName}>
                Additional Notes
                {denialReason === "Other" ? (
                  <span className="font-normal text-slate-500"> (required)</span>
                ) : null}
              </label>
              <textarea
                id="denialNotes"
                value={denialNotes}
                onChange={(event) => setDenialNotes(event.target.value)}
                rows={3}
                required={denialReason === "Other"}
                className={inputClassName}
              />
            </div>
          </>
        ) : null}
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
          {isSubmitting ? "Saving..." : "Save DON Review"}
        </button>
      </div>
    </form>
  );
}
