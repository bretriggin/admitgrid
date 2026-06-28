"use client";

import {
  ALL_FILTER,
  CLINICAL_DENIAL_REASONS,
  type CompletedReferralsFilters,
} from "@/lib/clinicalDenial";
import { REFERRAL_OUTCOMES } from "@/lib/completedReferrals";

type CompletedReferralsFiltersProps = {
  filters: CompletedReferralsFilters;
  monthOptions: { key: string; label: string }[];
  onChange: (filters: CompletedReferralsFilters) => void;
};

const selectClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

const labelClassName = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

export function CompletedReferralsFiltersBar({
  filters,
  monthOptions,
  onChange,
}: CompletedReferralsFiltersProps) {
  return (
    <div className="border-b bg-slate-50 p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="completed-outcome-filter" className={labelClassName}>
            Outcome
          </label>
          <select
            id="completed-outcome-filter"
            value={filters.outcome}
            onChange={(event) =>
              onChange({ ...filters, outcome: event.target.value })
            }
            className={selectClassName}
          >
            <option value={ALL_FILTER}>All Outcomes</option>
            {REFERRAL_OUTCOMES.map((outcome) => (
              <option key={outcome} value={outcome}>
                {outcome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="completed-denial-filter" className={labelClassName}>
            Denial Reason
          </label>
          <select
            id="completed-denial-filter"
            value={filters.denialReason}
            onChange={(event) =>
              onChange({ ...filters, denialReason: event.target.value })
            }
            className={selectClassName}
          >
            <option value={ALL_FILTER}>All Denial Reasons</option>
            {CLINICAL_DENIAL_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="completed-month-filter" className={labelClassName}>
            Month
          </label>
          <select
            id="completed-month-filter"
            value={filters.monthKey}
            onChange={(event) =>
              onChange({ ...filters, monthKey: event.target.value })
            }
            className={selectClassName}
          >
            <option value={ALL_FILTER}>All Months</option>
            {monthOptions.map((month) => (
              <option key={month.key} value={month.key}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
