"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Referral } from "@/types/referral";

type DonReviewPanelProps = {
  referral: Referral;
  onClose: () => void;
  onReferralUpdated: () => void;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

const labelClassName = "mb-1 block text-sm text-slate-600";

export function DonReviewPanel({
  referral,
  onClose,
  onReferralUpdated,
}: DonReviewPanelProps) {
  const [clinical, setClinical] = useState(referral.clinical);
  const [highCostMeds, setHighCostMeds] = useState(referral.highCostMeds);
  const [equipment, setEquipment] = useState(referral.equipment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setClinical(referral.clinical);
    setHighCostMeds(referral.highCostMeds);
    setEquipment(referral.equipment);
  }, [referral]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!referral.id) {
      setError("Missing referral id. Cannot save DON review.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error: updateError } = await supabase
        .from("referrals")
        .update({
          clinical,
          highCostMeds,
          equipment,
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
    <form onSubmit={handleSubmit} className="border-b p-5">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="clinical" className={labelClassName}>
            Clinical
          </label>
          <input
            id="clinical"
            type="text"
            value={clinical}
            onChange={(event) => setClinical(event.target.value)}
            className={inputClassName}
          />
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
      </div>

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
