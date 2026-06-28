"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdmissionsSidebar,
  type SidebarView,
} from "@/components/AdmissionsSidebar";
import { BomReviewPanel } from "@/components/BomReviewPanel";
import { CaseManagerPanel } from "@/components/CaseManagerPanel";
import { CompleteReferralPanel } from "@/components/CompleteReferralPanel";
import { CompletedReferralsFiltersBar } from "@/components/CompletedReferralsFilters";
import { DonReviewPanel } from "@/components/DonReviewPanel";
import { MarketerReferralPanel } from "@/components/MarketerReferralPanel";
import { MdsReviewPanel } from "@/components/MdsReviewPanel";
import { NewReferralForm } from "@/components/NewReferralForm";
import { ReferralGrid } from "@/components/ReferralGrid";
import { ReferralWorkspace } from "@/components/ReferralWorkspace";
import {
  ALL_FILTER,
  filterCompletedReferrals,
  getCompletedMonthOptions,
  searchCompletedReferralsByPatient,
  type CompletedReferralsFilters,
} from "@/lib/clinicalDenial";
import { sortReferralsByCompletedDateDesc, sortReferralsByCreatedAtDesc } from "@/lib/referralSorting";
import { OPEN_REFERRAL_EVENT } from "@/lib/referralNavigation";
import type { Referral, ReferralOutcome } from "@/types/referral";

type AdmissionsSectionProps = {
  activeReferrals: Referral[];
  completedReferrals: Referral[];
  onReferralsRefresh?: () => void | Promise<void>;
};

function getViewTitle(view: SidebarView): string {
  if (view.type === "active") {
    return "Active Referrals";
  }

  if (view.type === "ready") {
    return "Ready to Admit";
  }

  return "Completed Referrals";
}

function getViewDescription(view: SidebarView, monthLabel?: string): string {
  if (view.type === "active") {
    return "Referrals still being worked through the admission workflow.";
  }

  if (view.type === "ready") {
    return "Patients cleared and ready for admission.";
  }

  return monthLabel
    ? `Referrals completed in ${monthLabel}.`
    : "Referrals completed by month and year. Use filters to narrow results.";
}

const defaultCompletedFilters: CompletedReferralsFilters = {
  outcome: ALL_FILTER,
  denialReason: ALL_FILTER,
  monthKey: ALL_FILTER,
};

function getDefaultOutcome(referral: Referral): ReferralOutcome {
  if (referral.status === "Ready to Admit") {
    return "Admitted";
  }

  if (referral.clinical === "No") {
    return "Clinical Denied";
  }

  if (referral.financialApproval === "No") {
    return "Financial Denied";
  }

  return "Other";
}

export function AdmissionsSection({
  activeReferrals,
  completedReferrals,
  onReferralsRefresh,
}: AdmissionsSectionProps) {
  const [selectedView, setSelectedView] = useState<SidebarView>({ type: "active" });
  const [showForm, setShowForm] = useState(false);
  const [selectedMarketerReferral, setSelectedMarketerReferral] = useState<Referral | null>(null);
  const [selectedDonReferral, setSelectedDonReferral] = useState<Referral | null>(null);
  const [selectedMdsReferral, setSelectedMdsReferral] = useState<Referral | null>(null);
  const [selectedCaseManagerReferral, setSelectedCaseManagerReferral] =
    useState<Referral | null>(null);
  const [selectedBomReferral, setSelectedBomReferral] = useState<Referral | null>(null);
  const [selectedCompleteReferral, setSelectedCompleteReferral] = useState<Referral | null>(null);
  const [workspaceReferralId, setWorkspaceReferralId] = useState<string | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<"full" | "chat-only">("chat-only");
  const [completedFilters, setCompletedFilters] =
    useState<CompletedReferralsFilters>(defaultCompletedFilters);
  const [completedSearchQuery, setCompletedSearchQuery] = useState("");

  const allReferrals = useMemo(
    () => [...activeReferrals, ...completedReferrals],
    [activeReferrals, completedReferrals],
  );

  function syncReferralSelection(current: Referral | null): Referral | null {
    if (!current?.id) {
      return current;
    }

    return allReferrals.find((referral) => referral.id === current.id) ?? current;
  }

  useEffect(() => {
    setSelectedMarketerReferral((current) => syncReferralSelection(current));
    setSelectedDonReferral((current) => syncReferralSelection(current));
    setSelectedMdsReferral((current) => syncReferralSelection(current));
    setSelectedCaseManagerReferral((current) => syncReferralSelection(current));
    setSelectedBomReferral((current) => syncReferralSelection(current));
    setSelectedCompleteReferral((current) => syncReferralSelection(current));
  }, [allReferrals]);

  const refreshReferrals = useCallback(async () => {
    await onReferralsRefresh?.();
  }, [onReferralsRefresh]);

  const sortedActiveReferrals = useMemo(
    () => sortReferralsByCreatedAtDesc(activeReferrals),
    [activeReferrals],
  );

  const readyReferrals = useMemo(
    () =>
      sortReferralsByCreatedAtDesc(
        sortedActiveReferrals.filter((referral) => referral.status === "Ready to Admit"),
      ),
    [sortedActiveReferrals],
  );

  const completedMonthOptions = useMemo(
    () => getCompletedMonthOptions(completedReferrals),
    [completedReferrals],
  );

  const isCompletedSearchActive = completedSearchQuery.trim().length > 0;

  const isCompletedView =
    selectedView.type === "completed" || isCompletedSearchActive;

  const displayedReferrals = useMemo(() => {
    if (selectedView.type === "active" && !isCompletedSearchActive) {
      return sortedActiveReferrals;
    }

    if (selectedView.type === "ready" && !isCompletedSearchActive) {
      return readyReferrals;
    }

    let list = completedReferrals;

    if (isCompletedSearchActive) {
      list = searchCompletedReferralsByPatient(list, completedSearchQuery);
      return sortReferralsByCompletedDateDesc(
        filterCompletedReferrals(list, completedFilters, { ignoreMonth: true }),
      );
    }

    return sortReferralsByCompletedDateDesc(
      filterCompletedReferrals(list, completedFilters),
    );
  }, [
    sortedActiveReferrals,
    readyReferrals,
    selectedView,
    completedReferrals,
    completedFilters,
    completedSearchQuery,
    isCompletedSearchActive,
  ]);

  const selectedMonthLabel = useMemo(() => {
    if (!isCompletedView || isCompletedSearchActive) {
      return undefined;
    }

    if (completedFilters.monthKey === ALL_FILTER) {
      return undefined;
    }

    return completedMonthOptions.find((month) => month.key === completedFilters.monthKey)?.label;
  }, [
    isCompletedView,
    isCompletedSearchActive,
    completedFilters.monthKey,
    completedMonthOptions,
  ]);

  const isActiveView =
    !isCompletedView &&
    (selectedView.type === "active" || selectedView.type === "ready");

  const workspaceReferral = useMemo(() => {
    if (!workspaceReferralId) {
      return null;
    }

    return (
      [...activeReferrals, ...completedReferrals].find(
        (referral) => referral.id === workspaceReferralId,
      ) ?? null
    );
  }, [workspaceReferralId, activeReferrals, completedReferrals]);

  function handleReferralCreated() {
    setShowForm(false);
    void refreshReferrals();
  }

  function handleMarketerReferralUpdated() {
    setSelectedMarketerReferral(null);
    void refreshReferrals();
  }

  function handleDonReferralUpdated() {
    setSelectedDonReferral(null);
    void refreshReferrals();
  }

  function handleMdsReferralUpdated() {
    setSelectedMdsReferral(null);
    void refreshReferrals();
  }

  function handleCaseManagerReferralUpdated() {
    setSelectedCaseManagerReferral(null);
    void refreshReferrals();
  }

  function handleBomReferralUpdated() {
    setSelectedBomReferral(null);
    void refreshReferrals();
  }

  function handleReferralCompleted() {
    setSelectedCompleteReferral(null);
    setSelectedMarketerReferral(null);
    setSelectedDonReferral(null);
    setSelectedMdsReferral(null);
    setSelectedCaseManagerReferral(null);
    setSelectedBomReferral(null);
    void refreshReferrals();
  }

  function closeReviewPanels() {
    setSelectedMarketerReferral(null);
    setSelectedDonReferral(null);
    setSelectedMdsReferral(null);
    setSelectedCaseManagerReferral(null);
    setSelectedBomReferral(null);
    setSelectedCompleteReferral(null);
  }

  function closeWorkspace() {
    setWorkspaceReferralId(null);
    setWorkspaceMode("chat-only");
  }

  function handleWorkspaceUpdated() {
    void refreshReferrals();
  }

  function openWorkspace(referral: Referral) {
    if (!referral.id) {
      return;
    }

    setShowForm(false);
    closeReviewPanels();
    setWorkspaceMode("chat-only");
    setWorkspaceReferralId(referral.id);
  }

  const openReferralFromActivityFeed = useCallback(
    (referralId: string) => {
      const referral =
        [...activeReferrals, ...completedReferrals].find((entry) => entry.id === referralId) ??
        null;

      if (!referral?.id) {
        return;
      }

      const isCompleted = completedReferrals.some((entry) => entry.id === referralId);

      setShowForm(false);
      closeReviewPanels();
      setCompletedSearchQuery("");
      setSelectedView(
        isCompleted ? { type: "completed", monthKey: ALL_FILTER } : { type: "active" },
      );
      setWorkspaceMode("full");
      setWorkspaceReferralId(referral.id);
    },
    [activeReferrals, completedReferrals],
  );

  useEffect(() => {
    function handleOpenReferral(event: Event) {
      const referralId = (event as CustomEvent<{ referralId?: string }>).detail?.referralId;

      if (!referralId) {
        return;
      }

      openReferralFromActivityFeed(referralId);
    }

    window.addEventListener(OPEN_REFERRAL_EVENT, handleOpenReferral);
    return () => window.removeEventListener(OPEN_REFERRAL_EVENT, handleOpenReferral);
  }, [openReferralFromActivityFeed]);

  function openMarketerReview(referral: Referral) {
    setShowForm(false);
    closeWorkspace();
    closeReviewPanels();
    setSelectedMarketerReferral(referral);
  }

  function openDonReview(referral: Referral) {
    setShowForm(false);
    closeWorkspace();
    closeReviewPanels();
    setSelectedDonReferral(referral);
  }

  function openMdsReview(referral: Referral) {
    setShowForm(false);
    closeWorkspace();
    closeReviewPanels();
    setSelectedMdsReferral(referral);
  }

  function openCaseManagerReview(referral: Referral) {
    setShowForm(false);
    closeWorkspace();
    closeReviewPanels();
    setSelectedCaseManagerReferral(referral);
  }

  function openBomReview(referral: Referral) {
    setShowForm(false);
    closeWorkspace();
    closeReviewPanels();
    setSelectedBomReferral(referral);
  }

  function openCompleteReferral(referral: Referral) {
    setShowForm(false);
    closeWorkspace();
    closeReviewPanels();
    setSelectedCompleteReferral(referral);
  }

  function handleCompletedSearchChange(query: string) {
    setCompletedSearchQuery(query);

    if (query.trim()) {
      setSelectedView({ type: "completed", monthKey: ALL_FILTER });
    }
  }

  function handleSelectView(view: SidebarView) {
    setSelectedView(view);
    setShowForm(false);
    closeReviewPanels();
    closeWorkspace();

    if (view.type === "active" || view.type === "ready") {
      setCompletedSearchQuery("");
    }

    if (view.type === "completed") {
      setCompletedFilters({
        outcome: ALL_FILTER,
        denialReason: ALL_FILTER,
        monthKey: view.monthKey,
      });
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex min-h-[640px]">
        <AdmissionsSidebar
          activeCount={activeReferrals.length}
          readyCount={readyReferrals.length}
          completedReferrals={completedReferrals}
          completedSearchQuery={completedSearchQuery}
          onCompletedSearchChange={handleCompletedSearchChange}
          selectedView={selectedView}
          onSelectView={handleSelectView}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="text-xl font-bold">
                {isCompletedSearchActive ? "Completed Referrals" : getViewTitle(selectedView)}
              </h2>
              <p className="text-sm text-slate-500">
                {isCompletedSearchActive
                  ? `Showing completed referrals matching "${completedSearchQuery.trim()}".`
                  : getViewDescription(selectedView, selectedMonthLabel)}
              </p>
            </div>
            {isActiveView ? (
              <button
                type="button"
                onClick={() => setShowForm((current) => !current)}
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
              >
                + New Referral
              </button>
            ) : null}
          </div>

          {isActiveView && showForm ? (
            <NewReferralForm onReferralCreated={handleReferralCreated} />
          ) : null}

          {isActiveView && selectedMarketerReferral ? (
            <MarketerReferralPanel
              referral={selectedMarketerReferral}
              onClose={() => setSelectedMarketerReferral(null)}
              onReferralUpdated={handleMarketerReferralUpdated}
            />
          ) : null}

          {isActiveView && selectedDonReferral ? (
            <DonReviewPanel
              referral={selectedDonReferral}
              onClose={() => setSelectedDonReferral(null)}
              onReferralUpdated={handleDonReferralUpdated}
            />
          ) : null}

          {isActiveView && selectedMdsReferral ? (
            <MdsReviewPanel
              referral={selectedMdsReferral}
              onClose={() => setSelectedMdsReferral(null)}
              onReferralUpdated={handleMdsReferralUpdated}
            />
          ) : null}

          {isActiveView && selectedCaseManagerReferral ? (
            <CaseManagerPanel
              referral={selectedCaseManagerReferral}
              onClose={() => setSelectedCaseManagerReferral(null)}
              onReferralUpdated={handleCaseManagerReferralUpdated}
            />
          ) : null}

          {isActiveView && selectedBomReferral ? (
            <BomReviewPanel
              referral={selectedBomReferral}
              onClose={() => setSelectedBomReferral(null)}
              onReferralUpdated={handleBomReferralUpdated}
            />
          ) : null}

          {isActiveView && selectedCompleteReferral ? (
            <CompleteReferralPanel
              referral={selectedCompleteReferral}
              defaultOutcome={getDefaultOutcome(selectedCompleteReferral)}
              onClose={() => setSelectedCompleteReferral(null)}
              onReferralCompleted={handleReferralCompleted}
            />
          ) : null}

          {isCompletedView ? (
            <CompletedReferralsFiltersBar
              filters={completedFilters}
              monthOptions={completedMonthOptions}
              onChange={setCompletedFilters}
            />
          ) : null}

          {displayedReferrals.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">
              {isCompletedSearchActive
                ? "No completed referrals found."
                : isCompletedView
                  ? "No completed referrals match the selected filters."
                  : selectedView.type === "ready"
                    ? "No patients are ready to admit."
                    : "No active referrals yet."}
            </p>
          ) : (
            <ReferralGrid
              referrals={displayedReferrals}
              onOpenWorkspace={openWorkspace}
              onMarketerReview={isActiveView ? openMarketerReview : undefined}
              onDonReview={isActiveView ? openDonReview : undefined}
              onMdsReview={isActiveView ? openMdsReview : undefined}
              onCaseManagerReview={isActiveView ? openCaseManagerReview : undefined}
              onBomReview={isActiveView ? openBomReview : undefined}
              onCompleteReferral={isActiveView ? openCompleteReferral : undefined}
              showOutcome={!isActiveView}
            />
          )}
        </div>
      </div>

      {workspaceReferral ? (
        <ReferralWorkspace
          referral={workspaceReferral}
          mode={workspaceMode}
          initialTab="discussion"
          onClose={closeWorkspace}
          onReferralUpdated={handleWorkspaceUpdated}
        />
      ) : null}
    </section>
  );
}
