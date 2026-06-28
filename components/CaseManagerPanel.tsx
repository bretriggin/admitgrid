"use client";

import { useEffect, useState } from "react";
import { useActorName } from "@/components/AuthProvider";
import { ReferralDocumentsSection } from "@/components/ReferralDocumentsSection";
import { logReferralActivity, REFERRAL_ACTIVITY_ACTIONS } from "@/lib/referralActivityLog";
import {
  buildAuthDatesActivity,
  createActivityFeedItem,
  hasAuthDatesChanged,
  isPendingAuthDates,
} from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { getReferralWorkflowUpdate } from "@/lib/referralStatus";
import type { Referral } from "@/types/referral";

type CaseManagerPanelProps = {
  referral: Referral;
  onClose?: () => void;
  onReferralUpdated: () => void;
  embedded?: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

const labelClassName = "mb-1 block text-sm text-slate-600";

const payerOptions = [
  "Traditional Medicare",
  "UHC",
  "WellMed",
  "Humana",
  "Aetna",
  "BCBS",
  "Cigna",
  "Molina",
  "Superior",
  "MCD",
  "MCD Pending",
  "Private Pay",
  "Hospice",
  "Other",
] as const;

function PayerSelectOptions({ value }: { value: string }) {
  const includesCurrent = payerOptions.includes(value as (typeof payerOptions)[number]);

  return (
    <>
      {!includesCurrent && value ? <option value={value}>{value}</option> : null}
      {payerOptions.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </>
  );
}

export function CaseManagerPanel({
  referral,
  onClose,
  onReferralUpdated,
  embedded = false,
}: CaseManagerPanelProps) {
  const actorName = useActorName();
  const [payer, setPayer] = useState(referral.payer);
  const [benefits, setBenefits] = useState(referral.benefits);
  const [authNumber, setAuthNumber] = useState(referral.authNumber);
  const [authDates, setAuthDates] = useState(referral.authDates);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPayer(referral.payer);
    setBenefits(referral.benefits);
    setAuthNumber(referral.authNumber);
    setAuthDates(referral.authDates);
  }, [referral]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!referral.id) {
      setError("Missing referral id. Cannot save benefits and authorization.");
      setIsSubmitting(false);
      return;
    }

    try {
      const updatedReferral: Referral = {
        ...referral,
        payer,
        benefits,
        authNumber,
        authDates,
      };
      const workflow = getReferralWorkflowUpdate(updatedReferral);

      const { data, error: updateError } = await supabase
        .from("referrals")
        .update({
          payer,
          benefits,
          authNumber,
          authDates,
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
        REFERRAL_ACTIVITY_ACTIONS.CASE_MANAGER_REVIEW_SAVED,
        `Payer: ${payer}, Benefits: ${benefits}, Auth Number: ${authNumber}, Auth Dates: ${authDates}`,
        actorName,
      );

      if (
        hasAuthDatesChanged(referral.authDates, authDates) &&
        !isPendingAuthDates(authDates)
      ) {
        await createActivityFeedItem({
          referralId: referral.id,
          createdBy: actorName,
          ...buildAuthDatesActivity(referral.patient, authDates),
        });
      }

      onReferralUpdated();
    } catch (submitError) {
      console.error("Error updating case manager review:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "An unexpected error occurred while saving benefits and authorization",
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
            <h3 className="text-lg font-bold">Case Manager Review</h3>
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
          <label htmlFor="payer" className={labelClassName}>
            Payer
          </label>
          <select
            id="payer"
            value={payer}
            onChange={(event) => setPayer(event.target.value)}
            className={inputClassName}
          >
            <PayerSelectOptions value={payer} />
          </select>
        </div>

        <div>
          <label htmlFor="benefits" className={labelClassName}>
            Benefits
          </label>
          <input
            id="benefits"
            type="text"
            value={benefits}
            onChange={(event) => setBenefits(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="authNumber" className={labelClassName}>
            Auth Number
          </label>
          <input
            id="authNumber"
            type="text"
            value={authNumber}
            onChange={(event) => setAuthNumber(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="authDates" className={labelClassName}>
            Auth Dates
          </label>
          <input
            id="authDates"
            type="text"
            value={authDates}
            onChange={(event) => setAuthDates(event.target.value)}
            className={inputClassName}
          />
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
          {isSubmitting ? "Saving..." : "Save Benefits & Authorization"}
        </button>
      </div>
    </form>
  );
}
