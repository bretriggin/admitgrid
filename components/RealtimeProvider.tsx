"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "@/components/AuthProvider";
import {
  getBrowserConnectionStatus,
  mapChannelStatus,
  type RealtimeConnectionStatus,
} from "@/lib/realtime/connectionStatus";
import {
  dispatchActivityFeedUpdated,
  dispatchActivityLogUpdated,
  dispatchDocumentsUpdated,
  dispatchMessagesUpdated,
  dispatchReferralsUpdated,
  extractReferralIdFromPayload,
  REALTIME_TABLES,
} from "@/lib/realtime/events";
import { supabase } from "@/lib/supabase";
import { isApprovedActiveProfile } from "@/types/userProfile";

type RealtimeContextValue = {
  connectionStatus: RealtimeConnectionStatus;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

const REALTIME_CHANNEL_NAME = "admitgrid-board";

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { profile, isLoading } = useAuth();
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeConnectionStatus>("offline");
  const [isBrowserOnline, setIsBrowserOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const shouldSubscribe = Boolean(profile && isApprovedActiveProfile(profile));

  useEffect(() => {
    function handleOnline() {
      setIsBrowserOnline(true);
    }

    function handleOffline() {
      setIsBrowserOnline(false);
      setConnectionStatus("offline");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isLoading || !shouldSubscribe) {
      setConnectionStatus("offline");
      return;
    }

    if (!isBrowserOnline) {
      setConnectionStatus("offline");
      return;
    }

    let channel: RealtimeChannel | null = null;
    let isActive = true;

    function handleTableChange(
      table: (typeof REALTIME_TABLES)[number],
      payload: { new?: Record<string, unknown>; old?: Record<string, unknown> },
    ) {
      const referralId = extractReferralIdFromPayload(table, payload);
      const detail = referralId ? { referralId } : undefined;

      switch (table) {
        case "referrals":
          dispatchReferralsUpdated(detail);
          break;
        case "referral_documents":
          dispatchDocumentsUpdated(detail);
          break;
        case "referral_messages":
          dispatchMessagesUpdated(detail);
          break;
        case "notifications":
          dispatchActivityFeedUpdated();
          break;
        case "referral_activity_log":
          dispatchActivityLogUpdated(detail);
          dispatchReferralsUpdated(detail);
          break;
        default:
          break;
      }
    }

    channel = supabase.channel(REALTIME_CHANNEL_NAME);

    for (const table of REALTIME_TABLES) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        (payload) => {
          handleTableChange(table, payload as typeof payload);
        },
      );
    }

    channel.subscribe((status) => {
      if (!isActive) {
        return;
      }

      if (!isBrowserOnline) {
        setConnectionStatus("offline");
        return;
      }

      setConnectionStatus(mapChannelStatus(status));
    });

    setConnectionStatus(getBrowserConnectionStatus(isBrowserOnline));

    return () => {
      isActive = false;

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [isBrowserOnline, isLoading, shouldSubscribe]);

  const value = useMemo(
    () => ({
      connectionStatus,
    }),
    [connectionStatus],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeConnection(): RealtimeConnectionStatus {
  const context = useContext(RealtimeContext);

  if (!context) {
    return "offline";
  }

  return context.connectionStatus;
}
