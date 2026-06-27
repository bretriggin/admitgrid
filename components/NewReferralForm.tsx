"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ReferralType } from "@/types/referral";

type FormState = {
  patient: string;
  type: ReferralType;
  source: string;
};

const defaultFormState: FormState = {
  patient: "",
  type: "SNF",
  source: "",
};

const defaultReferralValues = {
  clinical: "Pending DON",
  highCostMeds: "Pending DON",
  equipment: "Pending DON",
  mds: "Pending MDS",
  medicalNecessity: "Pending MDS",
  payer: "Pending CM",
  benefits: "Pending CM",
  authNumber: "Pending CM",
  authDates: "Pending CM",
  cwf: "Pending BOM",
  financialApproval: "Pending BOM",
  status: "New Referral",
};

type NewReferralFormProps = {
  onReferralCreated: () => void;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

const labelClassName = "mb-1 block text-sm text-slate-600";

export function NewReferralForm({ onReferralCreated }: NewReferralFormProps) {
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("referrals").insert([
        {
          ...form,
          ...defaultReferralValues,
        },
      ]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      setForm(defaultFormState);
      onReferralCreated();
    } catch (submitError) {
      console.error("Error creating referral:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "An unexpected error occurred while creating the referral",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-b p-5">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="patient" className={labelClassName}>
            Patient
          </label>
          <input
            id="patient"
            type="text"
            required
            value={form.patient}
            onChange={(event) => updateField("patient", event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="type" className={labelClassName}>
            Type
          </label>
          <select
            id="type"
            value={form.type}
            onChange={(event) => updateField("type", event.target.value as ReferralType)}
            className={inputClassName}
          >
            <option value="SNF">SNF</option>
            <option value="LTC">LTC</option>
          </select>
        </div>

        <div>
          <label htmlFor="source" className={labelClassName}>
            Source
          </label>
          <input
            id="source"
            type="text"
            value={form.source}
            onChange={(event) => updateField("source", event.target.value)}
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
          {isSubmitting ? "Saving..." : "Save Referral"}
        </button>
      </div>
    </form>
  );
}
