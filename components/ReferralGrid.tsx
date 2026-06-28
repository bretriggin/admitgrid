"use client";

import { getCompletedReasonDisplay } from "@/lib/clinicalDenial";
import { getReferralStatusDisplayLabel } from "@/lib/referralStatusDisplay";
import { ReferralDocumentsCell } from "@/components/ReferralDocumentsCell";
import { ReferralDocumentsModal } from "@/components/ReferralDocumentsModal";
import { ReferralStatusBadge } from "@/components/ReferralStatusBadge";
import type { Referral } from "@/types/referral";
import { useMemo, useState } from "react";
import StatusBadge from "./StatusBadge";

const clickableCellClassName = "cursor-pointer p-4 hover:bg-slate-100";
const completedCellClassName = "p-4";
const documentsCellClassName = "whitespace-nowrap px-3 py-4";

function getRowClassName(referral: Referral, showOutcome: boolean): string {
  if (showOutcome) {
    if (referral.outcome === "Admitted") {
      return "border-t border-l-4 border-l-green-300 border-green-100 bg-green-50 hover:bg-green-100";
    }

    return "border-t border-l-4 border-l-red-300 border-red-100 bg-red-50 hover:bg-red-100";
  }

  return "border-t";
}

export function ReferralGrid({
  referrals,
  onOpenWorkspace,
  onMarketerReview,
  onDonReview,
  onMdsReview,
  onCaseManagerReview,
  onBomReview,
  onCompleteReferral,
  showOutcome = false,
}: {
  referrals: Referral[];
  onOpenWorkspace?: (referral: Referral) => void;
  onMarketerReview?: (referral: Referral) => void;
  onDonReview?: (referral: Referral) => void;
  onMdsReview?: (referral: Referral) => void;
  onCaseManagerReview?: (referral: Referral) => void;
  onBomReview?: (referral: Referral) => void;
  onCompleteReferral?: (referral: Referral) => void;
  showOutcome?: boolean;
}) {
  const showActions = Boolean(onCompleteReferral);
  const cellClassName = showOutcome ? completedCellClassName : clickableCellClassName;
  const [documentsReferral, setDocumentsReferral] = useState<Referral | null>(null);

  const activeDocumentsReferral = useMemo(() => {
    if (!documentsReferral?.id) {
      return null;
    }

    return referrals.find((referral) => referral.id === documentsReferral.id) ?? documentsReferral;
  }, [documentsReferral, referrals]);

  const columns = [
    "Status",
    "Clinical Packet / Referral Documents",
    ...(showOutcome ? (["Outcome", "Reason"] as const) : []),
    "Patient",
    "Type",
    "Source",
    "Clinical",
    "High Cost Meds",
    "Equipment",
    "MDS",
    "Medical Necessity",
    "Payer",
    "Benefits",
    "Auth Number",
    "Auth Dates",
    "CWF",
    "Financial Approval",
    ...(showActions ? (["Actions"] as const) : []),
  ] as const;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1500px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className={
                    column === "Clinical Packet / Referral Documents" ? documentsCellClassName : "p-4"
                  }
                >
                  {column === "Clinical Packet / Referral Documents" ? "Documents" : column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {referrals.map((referral) => {
              const isReadyToAdmit = referral.status === "Ready to Admit";

              return (
                <tr
                  key={referral.id ?? referral.patient}
                  className={getRowClassName(referral, showOutcome)}
                >
                  <td
                    className={cellClassName}
                    onClick={() => onMarketerReview?.(referral)}
                  >
                    <ReferralStatusBadge label={getReferralStatusDisplayLabel(referral)} />
                  </td>
                  <td className={documentsCellClassName}>
                    <ReferralDocumentsCell
                      referral={referral}
                      onOpen={setDocumentsReferral}
                    />
                  </td>
                  {showOutcome ? (
                    <td className={cellClassName}>
                      {referral.outcome ? (
                        referral.outcome === "Clinical Denied" ||
                        referral.outcome === "Financial Denied" ? (
                          <ReferralStatusBadge label={referral.outcome} />
                        ) : (
                          <StatusBadge value={referral.outcome} />
                        )
                      ) : null}
                    </td>
                  ) : null}
                  {showOutcome ? (
                    <td className={cellClassName}>{getCompletedReasonDisplay(referral)}</td>
                  ) : null}
                  <td
                    className={`${cellClassName} ${isReadyToAdmit && !showOutcome ? "font-bold" : ""}`}
                    onClick={() => onOpenWorkspace?.(referral)}
                  >
                    {referral.patient}
                  </td>
                  <td
                    className={cellClassName}
                    onClick={() => onMarketerReview?.(referral)}
                  >
                    <StatusBadge value={referral.type} />
                  </td>
                  <td
                    className={cellClassName}
                    onClick={() => onMarketerReview?.(referral)}
                  >
                    {referral.source}
                  </td>
                  <td
                    className={cellClassName}
                    onClick={() => onDonReview?.(referral)}
                  >
                    <StatusBadge value={referral.clinical} />
                  </td>
                  <td
                    className={cellClassName}
                    onClick={() => onDonReview?.(referral)}
                  >
                    {referral.highCostMeds}
                  </td>
                  <td
                    className={cellClassName}
                    onClick={() => onDonReview?.(referral)}
                  >
                    {referral.equipment}
                  </td>
                  <td
                    className={cellClassName}
                    onClick={() => onMdsReview?.(referral)}
                  >
                    {referral.mds}
                  </td>
                  <td
                    className={cellClassName}
                    onClick={() => onMdsReview?.(referral)}
                  >
                    <StatusBadge value={referral.medicalNecessity} />
                  </td>
                  <td
                    className={cellClassName}
                    onClick={() => onCaseManagerReview?.(referral)}
                  >
                    {referral.payer}
                  </td>
                  <td
                    className={cellClassName}
                    onClick={() => onCaseManagerReview?.(referral)}
                  >
                    {referral.benefits}
                  </td>
                  <td
                    className={cellClassName}
                    onClick={() => onCaseManagerReview?.(referral)}
                  >
                    {referral.authNumber}
                  </td>
                  <td
                    className={cellClassName}
                    onClick={() => onCaseManagerReview?.(referral)}
                  >
                    {referral.authDates}
                  </td>
                  <td
                    className={cellClassName}
                    onClick={() => onBomReview?.(referral)}
                  >
                    <StatusBadge value={referral.cwf} />
                  </td>
                  <td
                    className={cellClassName}
                    onClick={() => onBomReview?.(referral)}
                  >
                    <StatusBadge value={referral.financialApproval} />
                  </td>
                  {showActions ? (
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => onCompleteReferral?.(referral)}
                        className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Complete Referral
                      </button>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeDocumentsReferral ? (
        <ReferralDocumentsModal
          referral={activeDocumentsReferral}
          onClose={() => setDocumentsReferral(null)}
        />
      ) : null}
    </>
  );
}
