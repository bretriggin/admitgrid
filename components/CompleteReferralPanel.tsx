"use client";

import { useEffect, useState } from "react";
import { useActorName } from "@/components/AuthProvider";
import { REFERRAL_OUTCOMES } from "@/lib/completedReferrals";
import { logReferralActivity, REFERRAL_ACTIVITY_ACTIONS } from "@/lib/referralActivityLog";
import { supabase } from "@/lib/supabase";
import type { Referral, ReferralOutcome } from "@/types/referral";

type CompleteReferralPanelProps = {
  referral: Referral;
  defaultOutcome?: ReferralOutcome;
  onClose: () => void;
  onReferralCompleted: () => void;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

const labelClassName = "mb-1 block text-sm text-slate-600";

export function CompleteReferralPanel({
  referral,
  defaultOutcome = "Admitted",
  onClose,
  onReferralCompleted,
}: CompleteReferralPanelProps) {
  const actorName = useActorName();
  const [outcome, setOutcome] = useState<ReferralOutcome>(defaultOutcome);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOutcome(defaultOutcome);
  }, [defaultOutcome, referral]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!referral.id) {
      setError("Missing referral id. Cannot complete referral.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error: updateError } = await supabase
        .from("referrals")
        .update({
          status: "Completed",
          currentOwner: "None",
          outcome,
          completedDate: new Date().toISOString(),
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
        REFERRAL_ACTIVITY_ACTIONS.REFERRAL_COMPLETED,
        `Outcome: ${outcome}`,
        actorName,
      );

      onReferralCompleted();
    } catch (submitError) {
      console.error("Error completing referral:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "An unexpected error occurred while completing the referral",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-b p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Complete Referral</h3>
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
          <label htmlFor="outcome" className={labelClassName}>
            Outcome
          </label>
          <select
            id="outcome"
            value={outcome}
            onChange={(event) => setOutcome(event.target.value as ReferralOutcome)}
            className={inputClassName}
          >
            {REFERRAL_OUTCOMES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      <div className="mt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Complete Referral"}
        </button>
      </div>
    </form>
  );
}
