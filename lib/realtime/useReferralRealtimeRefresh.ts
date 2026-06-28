"use client";

import { useEffect } from "react";
import {
  REALTIME_ACTIVITY_FEED_UPDATED,
  REALTIME_ACTIVITY_LOG_UPDATED,
  REALTIME_DOCUMENTS_UPDATED,
  REALTIME_MESSAGES_UPDATED,
  type RealtimeReferralEventDetail,
} from "@/lib/realtime/events";

export function useReferralRealtimeRefresh(
  referralId: string | undefined,
  onRefresh: () => void,
  eventName:
    | typeof REALTIME_MESSAGES_UPDATED
    | typeof REALTIME_DOCUMENTS_UPDATED
    | typeof REALTIME_ACTIVITY_LOG_UPDATED,
) {
  useEffect(() => {
    if (!referralId) {
      return;
    }

    function handleRefresh(event: Event) {
      const detail = (event as CustomEvent<RealtimeReferralEventDetail>).detail;

      if (detail?.referralId && detail.referralId !== referralId) {
        return;
      }

      onRefresh();
    }

    window.addEventListener(eventName, handleRefresh);
    return () => window.removeEventListener(eventName, handleRefresh);
  }, [eventName, onRefresh, referralId]);
}

export function useActivityFeedRealtimeRefresh(onRefresh: () => void) {
  useEffect(() => {
    function handleRefresh() {
      onRefresh();
    }

    window.addEventListener(REALTIME_ACTIVITY_FEED_UPDATED, handleRefresh);
    return () => window.removeEventListener(REALTIME_ACTIVITY_FEED_UPDATED, handleRefresh);
  }, [onRefresh]);
}
