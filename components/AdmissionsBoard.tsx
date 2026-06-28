"use client";

import { useCallback, useEffect, useState } from "react";
import { AdmissionsSection } from "@/components/AdmissionsSection";
import { fetchReferralsSnapshot } from "@/lib/referralsClient";
import {
  REALTIME_DOCUMENTS_UPDATED,
  REALTIME_REFERRALS_UPDATED,
} from "@/lib/realtime/events";
import type { Referral } from "@/types/referral";

type AdmissionsBoardProps = {
  initialActiveReferrals: Referral[];
  initialCompletedReferrals: Referral[];
};

export function AdmissionsBoard({
  initialActiveReferrals,
  initialCompletedReferrals,
}: AdmissionsBoardProps) {
  const [activeReferrals, setActiveReferrals] = useState(initialActiveReferrals);
  const [completedReferrals, setCompletedReferrals] = useState(initialCompletedReferrals);

  const refreshReferrals = useCallback(async () => {
    try {
      const snapshot = await fetchReferralsSnapshot();
      setActiveReferrals(snapshot.activeReferrals);
      setCompletedReferrals(snapshot.completedReferrals);
    } catch (error) {
      console.error("Error refreshing referrals:", error);
    }
  }, []);

  useEffect(() => {
    setActiveReferrals(initialActiveReferrals);
    setCompletedReferrals(initialCompletedReferrals);
  }, [initialActiveReferrals, initialCompletedReferrals]);

  useEffect(() => {
    function handleRealtimeRefresh() {
      void refreshReferrals();
    }

    window.addEventListener(REALTIME_REFERRALS_UPDATED, handleRealtimeRefresh);
    window.addEventListener(REALTIME_DOCUMENTS_UPDATED, handleRealtimeRefresh);

    return () => {
      window.removeEventListener(REALTIME_REFERRALS_UPDATED, handleRealtimeRefresh);
      window.removeEventListener(REALTIME_DOCUMENTS_UPDATED, handleRealtimeRefresh);
    };
  }, [refreshReferrals]);

  return (
    <AdmissionsSection
      activeReferrals={activeReferrals}
      completedReferrals={completedReferrals}
      onReferralsRefresh={refreshReferrals}
    />
  );
}
