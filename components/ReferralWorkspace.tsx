"use client";

import { useEffect, useState } from "react";
import { BomReviewPanel } from "@/components/BomReviewPanel";
import { CaseManagerPanel } from "@/components/CaseManagerPanel";
import { DonReviewPanel } from "@/components/DonReviewPanel";
import { MdsReviewPanel } from "@/components/MdsReviewPanel";
import { ReferralChat } from "@/components/ReferralChat";
import { ReferralDocumentsSection } from "@/components/ReferralDocumentsSection";
import { ReferralStatusBadge } from "@/components/ReferralStatusBadge";
import { ReferralTimeline } from "@/components/ReferralTimeline";
import StatusBadge from "@/components/StatusBadge";
import { useActorName } from "@/components/AuthProvider";
import { getReferralStatusDisplayLabel } from "@/lib/referralStatusDisplay";
import type { Referral } from "@/types/referral";

type WorkspaceTab =
  | "overview"
  | "documents"
  | "clinical"
  | "mds"
  | "case-manager"
  | "business-office"
  | "timeline"
  | "discussion";

type ReferralWorkspaceProps = {
  referral: Referral;
  onClose: () => void;
  onReferralUpdated: () => void;
  mode?: "full" | "chat-only";
  initialTab?: WorkspaceTab;
};

const baseTabs: { id: WorkspaceTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "documents", label: "Documents" },
  { id: "clinical", label: "Clinical" },
  { id: "mds", label: "MDS" },
  { id: "case-manager", label: "Case Manager" },
  { id: "business-office", label: "Business Office" },
  { id: "discussion", label: "Referral Discussion" },
];

const timelineTab: { id: WorkspaceTab; label: string } = {
  id: "timeline",
  label: "Timeline",
};

function getWorkspaceTabs(isCompleted: boolean) {
  if (!isCompleted) {
    return baseTabs;
  }

  return [
    baseTabs[0],
    baseTabs[1],
    timelineTab,
    ...baseTabs.slice(2),
  ];
}

const overviewLabelClassName = "text-sm text-slate-500";
const overviewValueClassName = "text-sm font-medium text-slate-900";

function formatDisplayDate(value?: string): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function OverviewTab({ referral }: { referral: Referral }) {
  const fields = [
    { label: "Patient", value: referral.patient },
    { label: "Status", value: getReferralStatusDisplayLabel(referral), isStatus: true },
    { label: "Type", value: referral.type, isType: true },
    { label: "Source", value: referral.source || "—" },
    { label: "Outcome", value: referral.outcome || "—", isOutcome: true },
    { label: "Created Date", value: formatDisplayDate(referral.created_at) },
    {
      label: "Completed Date",
      value: referral.completedDate ? formatDisplayDate(referral.completedDate) : "—",
    },
  ];

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <dt className={overviewLabelClassName}>{field.label}</dt>
          <dd className="mt-1">
            {"isStatus" in field && field.isStatus ? (
              <ReferralStatusBadge label={field.value} />
            ) : "isType" in field && field.isType ? (
              <StatusBadge value={field.value} />
            ) : "isOutcome" in field &&
              field.isOutcome &&
              (field.value === "Clinical Denied" || field.value === "Financial Denied") ? (
              <ReferralStatusBadge label={field.value} />
            ) : field.value !== "—" && "isOutcome" in field && field.isOutcome ? (
              <StatusBadge value={field.value} />
            ) : (
              <span className={overviewValueClassName}>{field.value}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ReferralWorkspace({
  referral,
  onClose,
  onReferralUpdated,
  mode = "full",
  initialTab,
}: ReferralWorkspaceProps) {
  const actorName = useActorName();
  const isChatOnly = mode === "chat-only";
  const isCompleted = referral.status === "Completed";
  const tabs = getWorkspaceTabs(isCompleted);
  const resolvedInitialTab = initialTab ?? (isChatOnly ? "discussion" : "overview");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(resolvedInitialTab);
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);

  function handleReferralUpdated() {
    if (isCompleted) {
      setTimelineRefreshKey((current) => current + 1);
    }

    onReferralUpdated();
  }

  useEffect(() => {
    if (isChatOnly) {
      setActiveTab("discussion");
      return;
    }

    if (!isCompleted && resolvedInitialTab === "timeline") {
      setActiveTab("overview");
      return;
    }

    setActiveTab(resolvedInitialTab);
  }, [resolvedInitialTab, referral.id, isCompleted, isChatOnly]);

  useEffect(() => {
    if (isChatOnly) {
      return;
    }

    if (!isCompleted && activeTab === "timeline") {
      setActiveTab("overview");
    }
  }, [isCompleted, activeTab, isChatOnly]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40"
      onClick={onClose}
      role="presentation"
    >
      <aside
        className="flex h-full w-[45%] min-w-[420px] flex-col bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
        aria-label={`Referral workspace for ${referral.patient}`}
      >
        <header className="border-b p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-3">
              <h2 className="truncate text-xl font-bold text-slate-900">{referral.patient}</h2>
              {isChatOnly ? (
                <p className="text-sm text-slate-500">Referral Discussion</p>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <ReferralStatusBadge label={getReferralStatusDisplayLabel(referral)} />
                  <StatusBadge value={referral.type} />
                  <span className="text-sm text-slate-600">{referral.source || "—"}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </header>

        {!isChatOnly ? (
          <nav className="border-b bg-slate-50 px-5">
            <div className="flex gap-1 overflow-x-auto py-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-blue-700 text-white"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>
        ) : null}

        <div className={`flex-1 ${isChatOnly ? "flex min-h-0 flex-col p-5" : "overflow-y-auto p-5"}`}>
          {isChatOnly && referral.id ? (
            <ReferralChat referralId={referral.id} createdBy={actorName} />
          ) : null}

          {!isChatOnly && activeTab === "overview" ? <OverviewTab referral={referral} /> : null}

          {!isChatOnly && activeTab === "documents" ? (
            <ReferralDocumentsSection
              referral={referral}
              uploadedBy={actorName}
              showLabel={false}
              onUpdated={handleReferralUpdated}
            />
          ) : null}

          {!isChatOnly && activeTab === "clinical" ? (
            <DonReviewPanel
              referral={referral}
              onReferralUpdated={handleReferralUpdated}
              embedded
            />
          ) : null}

          {!isChatOnly && activeTab === "mds" ? (
            <MdsReviewPanel referral={referral} onReferralUpdated={handleReferralUpdated} embedded />
          ) : null}

          {!isChatOnly && activeTab === "case-manager" ? (
            <CaseManagerPanel
              referral={referral}
              onReferralUpdated={handleReferralUpdated}
              embedded
            />
          ) : null}

          {!isChatOnly && activeTab === "business-office" ? (
            <BomReviewPanel
              referral={referral}
              onReferralUpdated={handleReferralUpdated}
              embedded
            />
          ) : null}

          {!isChatOnly && activeTab === "timeline" && isCompleted && referral.id ? (
            <ReferralTimeline referralId={referral.id} refreshKey={timelineRefreshKey} />
          ) : null}

          {!isChatOnly && activeTab === "discussion" && referral.id ? (
            <ReferralChat referralId={referral.id} createdBy={actorName} />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export type { WorkspaceTab };
export type ReferralWorkspaceMode = "full" | "chat-only";
