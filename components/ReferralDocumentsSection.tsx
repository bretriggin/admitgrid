"use client";

import { useState } from "react";
import { ReferralDocumentsList } from "@/components/ReferralDocumentsList";
import { uploadReferralDocument } from "@/lib/clinicalDocuments";
import type { Referral } from "@/types/referral";
import type { ReferralDocumentType } from "@/types/referralDocument";

type ReferralDocumentsSectionProps = {
  referral: Referral;
  uploadedBy: string;
  onUpdated?: () => void;
  showLabel?: boolean;
};

const labelClassName = "mb-1 block text-sm text-slate-600";

export function ReferralDocumentsSection({
  referral,
  uploadedBy,
  onUpdated,
  showLabel = true,
}: ReferralDocumentsSectionProps) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(file: File, documentType: ReferralDocumentType) {
    if (!referral.id) {
      throw new Error("Missing referral id. Cannot upload document.");
    }

    setIsUploading(true);

    try {
      await uploadReferralDocument(referral.id, file, documentType, uploadedBy);
      onUpdated?.();
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      {showLabel ? <label className={labelClassName}>Referral Documents</label> : null}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <ReferralDocumentsList
          documents={referral.documents ?? []}
          uploadedBy={uploadedBy}
          isUploading={isUploading}
          onUpload={handleUpload}
        />
      </div>
    </div>
  );
}
