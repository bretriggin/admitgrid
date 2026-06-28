"use client";

import { useEffect, useState } from "react";
import { useActorName } from "@/components/AuthProvider";
import { ReferralDocumentsSection } from "@/components/ReferralDocumentsSection";
import { supabase } from "@/lib/supabase";
import type { Referral, ReferralType } from "@/types/referral";

type MarketerReferralPanelProps = {
  referral: Referral;
  onClose: () => void;
  onReferralUpdated: () => void;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

const labelClassName = "mb-1 block text-sm text-slate-600";

const typeOptions: ReferralType[] = ["SNF", "LTC", "Respite", "Hospice"];

export function MarketerReferralPanel({
  referral,
  onClose,
  onReferralUpdated,
}: MarketerReferralPanelProps) {
  const actorName = useActorName();
  const [patient, setPatient] = useState(referral.patient);
  const [type, setType] = useState<ReferralType>(referral.type);
  const [source, setSource] = useState(referral.source);
  const [marketerNotes, setMarketerNotes] = useState(referral.marketerNotes ?? "");
  const [referralPriority, setReferralPriority] = useState(referral.referralPriority ?? "");
  const [referralDate, setReferralDate] = useState(referral.referralDate ?? "");
  const [hospital, setHospital] = useState(referral.hospital ?? "");
  const [referringCaseManager, setReferringCaseManager] = useState(
    referral.referringCaseManager ?? "",
  );
  const [referringPhysician, setReferringPhysician] = useState(
    referral.referringPhysician ?? "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPatient(referral.patient);
    setType(referral.type);
    setSource(referral.source);
    setMarketerNotes(referral.marketerNotes ?? "");
    setReferralPriority(referral.referralPriority ?? "");
    setReferralDate(referral.referralDate ?? "");
    setHospital(referral.hospital ?? "");
    setReferringCaseManager(referral.referringCaseManager ?? "");
    setReferringPhysician(referral.referringPhysician ?? "");
  }, [referral]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!referral.id) {
      setError("Missing referral id. Cannot save marketer referral.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error: updateError } = await supabase
        .from("referrals")
        .update({
          patient,
          type,
          source,
          marketerNotes,
          referralPriority,
          referralDate,
          hospital,
          referringCaseManager,
          referringPhysician,
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
      console.error("Error updating marketer referral:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "An unexpected error occurred while saving marketer referral",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-b p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Marketer Referral</h3>
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
          <label htmlFor="patient" className={labelClassName}>
            Patient
          </label>
          <input
            id="patient"
            type="text"
            required
            value={patient}
            onChange={(event) => setPatient(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="type" className={labelClassName}>
            Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(event) => setType(event.target.value as ReferralType)}
            className={inputClassName}
          >
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="source" className={labelClassName}>
            Source
          </label>
          <input
            id="source"
            type="text"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="referralStatus" className={labelClassName}>
            Referral Status
          </label>
          <input
            id="referralStatus"
            type="text"
            value={referral.status}
            readOnly
            className={`${inputClassName} bg-slate-50 text-slate-600`}
          />
        </div>

        <div>
          <label htmlFor="currentOwner" className={labelClassName}>
            Current Owner
          </label>
          <input
            id="currentOwner"
            type="text"
            value={referral.currentOwner ?? ""}
            readOnly
            className={`${inputClassName} bg-slate-50 text-slate-600`}
          />
        </div>

        <div>
          <label htmlFor="referralPriority" className={labelClassName}>
            Referral Priority
          </label>
          <input
            id="referralPriority"
            type="text"
            value={referralPriority}
            onChange={(event) => setReferralPriority(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="referralDate" className={labelClassName}>
            Referral Date
          </label>
          <input
            id="referralDate"
            type="date"
            value={referralDate}
            onChange={(event) => setReferralDate(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="hospital" className={labelClassName}>
            Hospital
          </label>
          <input
            id="hospital"
            type="text"
            value={hospital}
            onChange={(event) => setHospital(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="referringCaseManager" className={labelClassName}>
            Referring Case Manager
          </label>
          <input
            id="referringCaseManager"
            type="text"
            value={referringCaseManager}
            onChange={(event) => setReferringCaseManager(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="referringPhysician" className={labelClassName}>
            Referring Physician
          </label>
          <input
            id="referringPhysician"
            type="text"
            value={referringPhysician}
            onChange={(event) => setReferringPhysician(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label htmlFor="marketerNotes" className={labelClassName}>
            Marketer Notes
          </label>
          <textarea
            id="marketerNotes"
            rows={4}
            value={marketerNotes}
            onChange={(event) => setMarketerNotes(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <ReferralDocumentsSection
            referral={referral}
            uploadedBy={actorName}
            onUpdated={onReferralUpdated}
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
          {isSubmitting ? "Saving..." : "Save Marketer Referral"}
        </button>
      </div>
    </form>
  );
}
