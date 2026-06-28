"use client";

import { useRef, useState } from "react";
import {
  downloadClinicalPacket,
  getClinicalPacketSignedUrl,
  isPdfFile,
  sortDocumentsNewestFirst,
} from "@/lib/clinicalDocuments";
import {
  REFERRAL_DOCUMENT_TYPES,
  type ReferralDocument,
  type ReferralDocumentType,
} from "@/types/referralDocument";

type ReferralDocumentsListProps = {
  documents: ReferralDocument[];
  uploadedBy: string;
  isUploading?: boolean;
  onUpload?: (file: File, documentType: ReferralDocumentType) => Promise<void>;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

const secondaryButtonClassName =
  "rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-60";

const primaryButtonClassName =
  "rounded-xl bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60";

export function ReferralDocumentsList({
  documents,
  uploadedBy,
  isUploading = false,
  onUpload,
}: ReferralDocumentsListProps) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<ReferralDocumentType | "">("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [workingDocumentId, setWorkingDocumentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedDocuments = sortDocumentsNewestFirst(documents);

  async function handleView(document: ReferralDocument) {
    setWorkingDocumentId(document.id);
    setError(null);

    try {
      const signedUrl = await getClinicalPacketSignedUrl(document.filePath);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (viewError) {
      console.error("Error viewing referral document:", viewError);
      setError(
        viewError instanceof Error
          ? viewError.message
          : "An unexpected error occurred while opening the document.",
      );
    } finally {
      setWorkingDocumentId(null);
    }
  }

  async function handleDownload(document: ReferralDocument) {
    setWorkingDocumentId(document.id);
    setError(null);

    try {
      await downloadClinicalPacket(document.filePath, document.fileName);
    } catch (downloadError) {
      console.error("Error downloading referral document:", downloadError);
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "An unexpected error occurred while downloading the document.",
      );
    } finally {
      setWorkingDocumentId(null);
    }
  }

  function openUploadPicker() {
    if (!documentType) {
      setError("Select a document type before uploading.");
      return;
    }

    setError(null);
    uploadInputRef.current?.click();
  }

  async function handleUploadSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !onUpload) {
      return;
    }

    if (!documentType) {
      setError("Select a document type before uploading.");
      return;
    }

    if (!isPdfFile(file)) {
      setError("Only PDF files are allowed.");
      setSelectedFileName("");
      return;
    }

    setSelectedFileName(file.name);
    setError(null);

    try {
      await onUpload(file, documentType);
      setSelectedFileName("");
      setDocumentType("");
    } catch (uploadError) {
      console.error("Error uploading referral document:", uploadError);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "An unexpected error occurred while uploading the document.",
      );
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={uploadInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleUploadSelected}
      />

      {onUpload ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div>
              <label htmlFor="documentType" className="mb-1 block text-sm text-slate-600">
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

            <button
              type="button"
              onClick={openUploadPicker}
              disabled={isUploading || !documentType}
              className={primaryButtonClassName}
            >
              {isUploading ? "Uploading..." : "Upload PDF"}
            </button>
          </div>

          {selectedFileName ? (
            <p className="mt-2 text-xs text-slate-500">Selected file: {selectedFileName}</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">Uploading as {uploadedBy}</p>
        </div>
      ) : null}

      {sortedDocuments.length === 0 ? (
        <p className="text-sm text-slate-500">No documents uploaded.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Document</th>
                <th className="p-3">Type</th>
                <th className="p-3">Uploaded By</th>
                <th className="p-3">Uploaded Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedDocuments.map((document) => {
                const isBusy = workingDocumentId === document.id;

                return (
                  <tr key={document.id} className="border-t border-slate-200">
                    <td className="p-3 font-medium text-slate-900">📄 {document.fileName}</td>
                    <td className="p-3 text-slate-700">{document.documentType}</td>
                    <td className="p-3 text-slate-700">{document.uploadedBy}</td>
                    <td className="p-3 text-slate-700">
                      {new Date(document.uploadedAt).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(document)}
                          disabled={isBusy || isUploading}
                          className={secondaryButtonClassName}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(document)}
                          disabled={isBusy || isUploading}
                          className={secondaryButtonClassName}
                        >
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
