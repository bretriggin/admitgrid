"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Referral } from "@/types/referral";

type BomReviewPanelProps = {
  referral: Referral;
  onClose: () => void;
  onReferralUpdated: () => void;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

const labelClassName = "mb-1 block text-sm text-slate-600";

export function BomReviewPanel({
  referral,
  onClose,
  onReferralUpdated,
}: BomReviewPanelProps) {
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
      const { data, error: updateError } = await supabase
        .from("referrals")
        .update({
          cwf,
          financialApproval,
        })
        .eq("id", referral.id)
        .select();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!data?.length) {
        throw new Error(`No referral found with id: ${referral.id}`);
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
    <form onSubmit={handleSubmit} className="border-b p-5">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="cwf" className={labelClassName}>
            CWF
          </label>
          <input
            id="cwf"
            type="text"
            value={cwf}
            onChange={(event) => setCwf(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="financialApproval" className={labelClassName}>
            Financial Approval
          </label>
          <input
            id="financialApproval"
            type="text"
            value={financialApproval}
            onChange={(event) => setFinancialApproval(event.target.value)}
            className={inputClassName}
          />
        </div>
      </div>

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
