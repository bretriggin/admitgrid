import { NOTIFICATIONS_UPDATED_EVENT } from "@/lib/notifications";

export const REALTIME_REFERRALS_UPDATED = "admitgrid-realtime-referrals-updated";
export const REALTIME_DOCUMENTS_UPDATED = "admitgrid-realtime-documents-updated";
export const REALTIME_MESSAGES_UPDATED = "admitgrid-realtime-messages-updated";
export const REALTIME_ACTIVITY_LOG_UPDATED = "admitgrid-realtime-activity-log-updated";
export const REALTIME_ACTIVITY_FEED_UPDATED = "admitgrid-realtime-activity-feed-updated";

export type RealtimeReferralEventDetail = {
  referralId?: string | null;
};

function dispatchEvent(name: string, detail?: RealtimeReferralEventDetail): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function dispatchReferralsUpdated(detail?: RealtimeReferralEventDetail): void {
  dispatchEvent(REALTIME_REFERRALS_UPDATED, detail);
}

export function dispatchDocumentsUpdated(detail?: RealtimeReferralEventDetail): void {
  dispatchEvent(REALTIME_DOCUMENTS_UPDATED, detail);
  dispatchReferralsUpdated(detail);
}

export function dispatchMessagesUpdated(detail?: RealtimeReferralEventDetail): void {
  dispatchEvent(REALTIME_MESSAGES_UPDATED, detail);
}

export function dispatchActivityLogUpdated(detail?: RealtimeReferralEventDetail): void {
  dispatchEvent(REALTIME_ACTIVITY_LOG_UPDATED, detail);
}

export function dispatchActivityFeedUpdated(): void {
  dispatchEvent(REALTIME_ACTIVITY_FEED_UPDATED);
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
}

export const REALTIME_TABLES = [
  "referrals",
  "referral_documents",
  "referral_messages",
  "notifications",
  "referral_activity_log",
] as const;

export type RealtimeTable = (typeof REALTIME_TABLES)[number];

export function extractReferralIdFromPayload(
  table: RealtimeTable,
  payload: { new?: Record<string, unknown>; old?: Record<string, unknown> } | undefined,
): string | null {
  const record = payload?.new ?? payload?.old;

  if (!record) {
    return null;
  }

  if (table === "referrals" && typeof record.id === "string") {
    return record.id;
  }

  const referralId = record.referralId;

  if (typeof referralId === "string" && referralId.length > 0) {
    return referralId;
  }

  return null;
}
