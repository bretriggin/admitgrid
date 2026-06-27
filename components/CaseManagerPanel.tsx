"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Referral } from "@/types/referral";

type CaseManagerPanelProps = {
  referral: Referral;
  onClose: () => void;
  onReferralUpdated: () => void;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

const labelClassName = "mb-1 block text-sm text-slate-600";

export function CaseManagerPanel({
  referral,
  onClose,
  onReferralUpdated,
}: CaseManagerPanelProps) {
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
      const { data, error: updateError } = await supabase
        .from("referrals")
        .update({
          payer,
          benefits,
          authNumber,
          authDates,
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
    <form onSubmit={handleSubmit} className="border-b p-5">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="payer" className={labelClassName}>
            Payer
          </label>
          <input
            id="payer"
            type="text"
            value={payer}
            onChange={(event) => setPayer(event.target.value)}
            className={inputClassName}
          />
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
