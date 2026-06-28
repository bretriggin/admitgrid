"use client";

import { useEffect, useState } from "react";
import { useActorName } from "@/components/AuthProvider";
import { ReferralDocumentsSection } from "@/components/ReferralDocumentsSection";
import { logReferralActivity, REFERRAL_ACTIVITY_ACTIONS } from "@/lib/referralActivityLog";
import {
  buildFinancialApprovalActivity,
  createActivityFeedItem,
} from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { getReferralWorkflowUpdate } from "@/lib/referralStatus";
import type { Referral } from "@/types/referral";

type BomReviewPanelProps = {
  referral: Referral;
  onClose?: () => void;
  onReferralUpdated: () => void;
  embedded?: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

const labelClassName = "mb-1 block text-sm text-slate-600";

const cwfOptions = ["Yes", "No", "Pending More Info", "N/A"] as const;
const financialApprovalOptions = ["Yes", "No", "Pending More Info"] as const;

function SelectOptions({
  options,
  value,
}: {
  options: readonly string[];
  value: string;
}) {
  const includesCurrent = options.includes(value);

  return (
    <>
      {!includesCurrent && value ? <option value={value}>{value}</option> : null}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </>
  );
}

export function BomReviewPanel({
  referral,
  onClose,
  onReferralUpdated,
  embedded = false,
}: BomReviewPanelProps) {
  const actorName = useActorName();
  const [cwf, setCwf] = useState(referral.cwf);
  const [financialApproval, setFinancialApproval] = useState(referral.financialApproval);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCwf(referral.cwf);
    setFinancialApproval(referral.financialApproval);
  }, [referral]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!referral.id) {
      setError("Missing referral id. Cannot save BOM review.");
      setIsSubmitting(false);
      return;
    }

    try {
      const updatedReferral: Referral = {
        ...referral,
        cwf,
        financialApproval,
      };
      const workflow = getReferralWorkflowUpdate(updatedReferral);

      const { data, error: updateError } = await supabase
        .from("referrals")
        .update({
          cwf,
          financialApproval,
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
        REFERRAL_ACTIVITY_ACTIONS.BOM_REVIEW_SAVED,
        `CWF: ${cwf}, Financial Approval: ${financialApproval}`,
        actorName,
      );

      if (financialApproval !== referral.financialApproval) {
        const activity = buildFinancialApprovalActivity(
          referral.patient,
          financialApproval,
        );

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
      console.error("Error updating BOM review:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "An unexpected error occurred while saving financial approval",
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
            <h3 className="text-lg font-bold">BOM Financial Approval</h3>
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
          <label htmlFor="cwf" className={labelClassName}>
            CWF
          </label>
          <select
            id="cwf"
            value={cwf}
            onChange={(event) => setCwf(event.target.value)}
            className={inputClassName}
          >
            <SelectOptions options={cwfOptions} value={cwf} />
          </select>
        </div>

        <div>
          <label htmlFor="financialApproval" className={labelClassName}>
            Financial Approval
          </label>
          <select
            id="financialApproval"
            value={financialApproval}
            onChange={(event) => setFinancialApproval(event.target.value)}
            className={inputClassName}
          >
            <SelectOptions options={financialApprovalOptions} value={financialApproval} />
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
          {isSubmitting ? "Saving..." : "Save Financial Approval"}
        </button>
      </div>
    </form>
  );
}
