"use client";

import { useRef, useState } from "react";
import { useActorName } from "@/components/AuthProvider";
import { isPdfFile, uploadReferralDocument } from "@/lib/clinicalDocuments";
import { logReferralActivity, REFERRAL_ACTIVITY_ACTIONS } from "@/lib/referralActivityLog";
import {
  buildNewReferralActivity,
  createActivityFeedItem,
} from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import type { ReferralType } from "@/types/referral";
import {
  REFERRAL_DOCUMENT_TYPES,
  type ReferralDocumentType,
} from "@/types/referralDocument";

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
  currentOwner: "Marketer",
};

type NewReferralFormProps = {
  onReferralCreated: () => void;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

const labelClassName = "mb-1 block text-sm text-slate-600";

const secondaryButtonClassName =
  "rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60";

export function NewReferralForm({ onReferralCreated }: NewReferralFormProps) {
  const actorName = useActorName();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [documentType, setDocumentType] = useState<ReferralDocumentType | "">("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(defaultFormState);
    setDocumentType("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!isPdfFile(file)) {
      setError("Only PDF files are allowed.");
      setSelectedFile(null);
      event.target.value = "";
      return;
    }

    setError(null);
    setSelectedFile(file);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (selectedFile && !documentType) {
      setError("Select a document type when uploading a PDF.");
      setIsSubmitting(false);
      return;
    }

    if (selectedFile && !isPdfFile(selectedFile)) {
      setError("Only PDF files are allowed.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data: referral, error: insertError } = await supabase
        .from("referrals")
        .insert([
          {
            ...form,
            ...defaultReferralValues,
          },
        ])
        .select("id")
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      if (!referral?.id) {
        throw new Error("Referral was created but no referral id was returned.");
      }

      await logReferralActivity(
        referral.id,
        REFERRAL_ACTIVITY_ACTIONS.REFERRAL_CREATED,
        `Patient: ${form.patient}, Type: ${form.type}, Source: ${form.source || "—"}`,
        actorName,
      );

      await createActivityFeedItem({
        referralId: referral.id,
        createdBy: actorName,
        ...buildNewReferralActivity(form.patient),
      });

      if (selectedFile && documentType) {
        try {
          await uploadReferralDocument(
            referral.id,
            selectedFile,
            documentType,
            actorName,
          );
        } catch (uploadError) {
          console.error("Error uploading referral document:", uploadError);
          resetForm();
          onReferralCreated();
          setError(
            uploadError instanceof Error
              ? `Referral saved, but document upload failed: ${uploadError.message}`
              : "Referral saved, but document upload failed.",
          );
          return;
        }
      }

      resetForm();
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
            <option value="Respite">Respite</option>
            <option value="Hospice">Hospice</option>
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

        <div>
          <label htmlFor="documentType" className={labelClassName}>
            Document Type
          </label>
          <select
            id="documentType"
            value={documentType}
            onChange={(event) =>
              setDocumentType(event.target.value as ReferralDocumentType | "")
            }
            className={inputClassName}
          >
            <option value="">Select document type...</option>
            {REFERRAL_DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="referralDocument" className={labelClassName}>
            PDF Upload
          </label>
          <input
            ref={fileInputRef}
            id="referralDocument"
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFileSelected}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={openFilePicker}
              disabled={isSubmitting}
              className={secondaryButtonClassName}
            >
              Choose PDF
            </button>
            <p className="text-sm text-slate-500">
              {selectedFile ? selectedFile.name : "Optional PDF upload"}
            </p>
          </div>
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
