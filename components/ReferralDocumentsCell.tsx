"use client";

import { sortDocumentsNewestFirst } from "@/lib/clinicalDocuments";
import type { Referral } from "@/types/referral";

type ReferralDocumentsCellProps = {
  referral: Referral;
  onOpen: (referral: Referral) => void;
};

function formatUploadDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function WarningIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4 shrink-0"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
      />
    </svg>
  );
}

export function ReferralDocumentsCell({ referral, onOpen }: ReferralDocumentsCellProps) {
  const documents = sortDocumentsNewestFirst(referral.documents ?? []);
  const documentCount = documents.length;

  if (documentCount === 0) {
    return (
      <div className="flex items-center gap-1.5 text-slate-400">
        <WarningIcon />
        <span className="text-xs font-medium">Missing</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(referral)}
      aria-label={`Open ${documentCount} referral document${documentCount === 1 ? "" : "s"}`}
      className="group relative inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm font-semibold text-blue-700 hover:bg-slate-100"
    >
      <span aria-hidden className="text-base leading-none">
        📄
      </span>
      <span>{documentCount}</span>

      <div
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden min-w-[220px] rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lg group-hover:block group-focus-visible:block"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Documents
        </p>
        <ul className="space-y-1.5">
          {documents.map((document) => (
            <li key={document.id} className="text-xs leading-snug text-slate-700">
              <span className="font-semibold text-slate-900">{document.documentType}</span>
              <span className="block text-slate-500">{formatUploadDate(document.uploadedAt)}</span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}
