"use client";

import { useActorName } from "@/components/AuthProvider";
import { ReferralDocumentsSection } from "@/components/ReferralDocumentsSection";
import { dispatchDocumentsUpdated } from "@/lib/realtime/events";
import type { Referral } from "@/types/referral";

type ReferralDocumentsModalProps = {
  referral: Referral;
  onClose: () => void;
};

export function ReferralDocumentsModal({ referral, onClose }: ReferralDocumentsModalProps) {
  const uploadedBy = useActorName();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h3 className="text-lg font-bold">Referral Documents</h3>
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

        <div className="max-h-[calc(85vh-88px)] overflow-y-auto p-5">
          <ReferralDocumentsSection
            referral={referral}
            uploadedBy={uploadedBy}
            showLabel={false}
            onUpdated={() => {
              if (referral.id) {
                dispatchDocumentsUpdated({ referralId: referral.id });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
