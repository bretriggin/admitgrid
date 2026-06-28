import { supabase } from "@/lib/supabase";
import type { ActivityFeedItem } from "@/types/notification";

export const NOTIFICATIONS_UPDATED_EVENT = "admitgrid-notifications-updated";

export function dispatchNotificationsUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
  }
}

export type ActivityFeedInput = {
  title: string;
  message: string;
  referralId?: string;
  createdBy?: string;
};

export async function createActivityFeedItem(params: ActivityFeedInput): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").insert({
      title: params.title.trim(),
      message: params.message.trim(),
      referralId: params.referralId ?? null,
      createdBy: params.createdBy ?? "",
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to create activity feed item:", error.message);
      return;
    }

    dispatchNotificationsUpdated();
  } catch (error) {
    console.error("Failed to create activity feed item:", error);
  }
}

/** @deprecated Use createActivityFeedItem */
export const createNotification = createActivityFeedItem;

export async function fetchActivityFeedItems(limit = 50): Promise<ActivityFeedItem[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, referralId, message, createdBy, isRead, createdAt")
    .order("createdAt", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch activity feed: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: (row.title as string) || "Activity update",
    message: row.message as string,
    referralId: (row.referralId as string | null) ?? null,
    createdBy: (row.createdBy as string) ?? "",
    isRead: row.isRead as boolean,
    createdAt: row.createdAt as string,
  }));
}

/** @deprecated Use fetchActivityFeedItems */
export const fetchNotifications = fetchActivityFeedItems;

export async function getUnreadNotificationCount(): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("isRead", false);

  if (error) {
    throw new Error(`Failed to fetch unread activity count: ${error.message}`);
  }

  return count ?? 0;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ isRead: true })
    .eq("id", notificationId);

  if (error) {
    throw new Error(`Failed to mark activity as read: ${error.message}`);
  }

  dispatchNotificationsUpdated();
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ isRead: true })
    .eq("isRead", false);

  if (error) {
    throw new Error(`Failed to mark all activity as read: ${error.message}`);
  }

  dispatchNotificationsUpdated();
}

export function buildNewReferralActivity(patientName: string): ActivityFeedInput {
  return {
    title: "New referral created",
    message: `${patientName} was added to AdmitGrid.`,
  };
}

/** @deprecated Use buildNewReferralActivity */
export function buildNewReferralNotificationMessage(patientName: string): string {
  return buildNewReferralActivity(patientName).message;
}

export function buildAuthDatesActivity(
  patientName: string,
  authDates: string,
): ActivityFeedInput {
  return {
    title: "Authorization dates updated",
    message: `Auth dates for ${patientName}: ${authDates}`,
  };
}

/** @deprecated Use buildAuthDatesActivity */
export function buildAuthDatesNotificationMessage(
  patientName: string,
  authDates: string,
): string {
  return buildAuthDatesActivity(patientName, authDates).message;
}

export function buildClinicalDecisionActivity(
  patientName: string,
  clinical: string,
): ActivityFeedInput | null {
  if (clinical === "Yes") {
    return {
      title: "Clinical approved",
      message: `Clinical decision saved as Yes for ${patientName}.`,
    };
  }

  if (clinical === "No") {
    return {
      title: "Clinical denied",
      message: `Clinical decision saved as No for ${patientName}.`,
    };
  }

  return null;
}

/** @deprecated Use buildClinicalDecisionActivity */
export function buildClinicalDecisionNotificationMessage(
  patientName: string,
  clinical: string,
): string | null {
  return buildClinicalDecisionActivity(patientName, clinical)?.message ?? null;
}

export function buildFinancialApprovalActivity(
  patientName: string,
  financialApproval: string,
): ActivityFeedInput | null {
  if (financialApproval === "Yes") {
    return {
      title: "Financial approved",
      message: `Financial approval saved as Yes for ${patientName}.`,
    };
  }

  if (financialApproval === "No") {
    return {
      title: "Financial denied",
      message: `Financial approval saved as No for ${patientName}.`,
    };
  }

  return null;
}

/** @deprecated Use buildFinancialApprovalActivity */
export function buildFinancialApprovalNotificationMessage(
  patientName: string,
  financialApproval: string,
): string | null {
  return buildFinancialApprovalActivity(patientName, financialApproval)?.message ?? null;
}

export function isPendingAuthDates(value: string): boolean {
  return !value.trim() || value === "Pending CM";
}

export function hasAuthDatesChanged(previousValue: string, nextValue: string): boolean {
  return previousValue.trim() !== nextValue.trim();
}
