"use client";

import type { Referral } from "@/types/referral";
import StatusBadge from "./StatusBadge";

export function ReferralGrid({
  referrals,
  onRowClick,
  onMdsReview,
  onCaseManagerReview,
  onBomReview,
}: {
  referrals: Referral[];
  onRowClick?: (referral: Referral) => void;
  onMdsReview?: (referral: Referral) => void;
  onCaseManagerReview?: (referral: Referral) => void;
  onBomReview?: (referral: Referral) => void;
}) {
  const columns = [
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
    "Status",
  ] as const;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1500px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {columns.map((column) => (
              <th key={column} className="p-4">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {referrals.map((referral) => (
            <tr
              key={referral.id ?? referral.patient}
              className="cursor-pointer border-t hover:bg-slate-50"
              onClick={() => onRowClick?.(referral)}
            >
              <td className="p-4 font-semibold">{referral.patient}</td>
              <td className="p-4">
                <StatusBadge value={referral.type} />
              </td>
              <td className="p-4">{referral.source}</td>
              <td className="p-4">
                <StatusBadge value={referral.clinical} />
              </td>
              <td className="p-4">{referral.highCostMeds}</td>
              <td className="p-4">{referral.equipment}</td>
              <td
                className="p-4"
                onClick={(event) => {
                  event.stopPropagation();
                  onMdsReview?.(referral);
                }}
              >
                {referral.mds}
              </td>
              <td
                className="p-4"
                onClick={(event) => {
                  event.stopPropagation();
                  onMdsReview?.(referral);
                }}
              >
                <StatusBadge value={referral.medicalNecessity} />
              </td>
              <td
                className="p-4"
                onClick={(event) => {
                  event.stopPropagation();
                  onCaseManagerReview?.(referral);
                }}
              >
                {referral.payer}
              </td>
              <td
                className="p-4"
                onClick={(event) => {
                  event.stopPropagation();
                  onCaseManagerReview?.(referral);
                }}
              >
                {referral.benefits}
              </td>
              <td
                className="p-4"
                onClick={(event) => {
                  event.stopPropagation();
                  onCaseManagerReview?.(referral);
                }}
              >
                {referral.authNumber}
              </td>
              <td
                className="p-4"
                onClick={(event) => {
                  event.stopPropagation();
                  onCaseManagerReview?.(referral);
                }}
              >
                {referral.authDates}
              </td>
              <td
                className="p-4"
                onClick={(event) => {
                  event.stopPropagation();
                  onBomReview?.(referral);
                }}
              >
                <StatusBadge value={referral.cwf} />
              </td>
              <td
                className="p-4"
                onClick={(event) => {
                  event.stopPropagation();
                  onBomReview?.(referral);
                }}
              >
                <StatusBadge value={referral.financialApproval} />
              </td>
              <td className="p-4">
                <StatusBadge value={referral.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
