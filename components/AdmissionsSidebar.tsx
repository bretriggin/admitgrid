"use client";

import { useMemo } from "react";
import {
  groupCompletedByYearMonth,
  type CompletedYearGroup,
} from "@/lib/completedReferrals";
import { ALL_FILTER } from "@/lib/clinicalDenial";
import type { Referral } from "@/types/referral";

export type SidebarView =
  | { type: "active" }
  | { type: "ready" }
  | { type: "completed"; monthKey: string };

type AdmissionsSidebarProps = {
  activeCount: number;
  readyCount: number;
  completedReferrals: Referral[];
  completedSearchQuery: string;
  onCompletedSearchChange: (query: string) => void;
  selectedView: SidebarView;
  onSelectView: (view: SidebarView) => void;
};

const navButtonClassName = (isSelected: boolean) =>
  `w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${
    isSelected ? "bg-blue-700 text-white" : "text-slate-700 hover:bg-slate-50"
  }`;

const folderButtonClassName = (isSelected: boolean) =>
  `w-full rounded-lg px-3 py-2 text-left text-sm ${
    isSelected ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-600 hover:bg-slate-50"
  }`;

const searchInputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

export function AdmissionsSidebar({
  activeCount,
  readyCount,
  completedReferrals,
  completedSearchQuery,
  onCompletedSearchChange,
  selectedView,
  onSelectView,
}: AdmissionsSidebarProps) {
  const yearGroups = useMemo(
    () => groupCompletedByYearMonth(completedReferrals),
    [completedReferrals],
  );

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-slate-50 p-4">
      <nav className="space-y-6">
        <div className="space-y-2">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Referrals
          </p>
          <button
            type="button"
            onClick={() => onSelectView({ type: "active" })}
            className={navButtonClassName(selectedView.type === "active")}
          >
            Active Referrals ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => onSelectView({ type: "ready" })}
            className={navButtonClassName(selectedView.type === "ready")}
          >
            Ready to Admit ({readyCount})
          </button>
        </div>

        <div className="space-y-2">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Completed Referrals
          </p>

          <div className="px-3">
            <input
              type="search"
              value={completedSearchQuery}
              onChange={(event) => onCompletedSearchChange(event.target.value)}
              placeholder="Search completed referrals by patient name..."
              className={searchInputClassName}
            />
          </div>

          {yearGroups.length === 0 ? (
            <p className="px-3 text-sm text-slate-500">No completed referrals yet.</p>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onSelectView({ type: "completed", monthKey: ALL_FILTER })}
                className={folderButtonClassName(
                  selectedView.type === "completed" && selectedView.monthKey === ALL_FILTER,
                )}
              >
                All Months ({completedReferrals.length})
              </button>
              {yearGroups.map((yearGroup) => (
                <YearFolder
                  key={yearGroup.year}
                  yearGroup={yearGroup}
                  selectedView={selectedView}
                  onSelectView={onSelectView}
                />
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}

function YearFolder({
  yearGroup,
  selectedView,
  onSelectView,
}: {
  yearGroup: CompletedYearGroup;
  selectedView: SidebarView;
  onSelectView: (view: SidebarView) => void;
}) {
  return (
    <div>
      <p className="px-3 text-sm font-bold text-slate-800">{yearGroup.year}</p>
      <div className="mt-1 space-y-1 pl-3">
        {yearGroup.months.map((month) => {
          const isSelected =
            selectedView.type === "completed" && selectedView.monthKey === month.key;

          return (
            <button
              key={month.key}
              type="button"
              onClick={() => onSelectView({ type: "completed", monthKey: month.key })}
              className={folderButtonClassName(isSelected)}
            >
              {month.label} ({month.referrals.length})
            </button>
          );
        })}
      </div>
    </div>
  );
}
