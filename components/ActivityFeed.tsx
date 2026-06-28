"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchActivityFeedItems,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NOTIFICATIONS_UPDATED_EVENT,
} from "@/lib/notifications";
import { useActivityFeedRealtimeRefresh } from "@/lib/realtime/useReferralRealtimeRefresh";
import { dispatchOpenReferral } from "@/lib/referralNavigation";
import type { ActivityFeedItem } from "@/types/notification";

function formatActivityTimestamp(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function BellIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.657a2 2 0 0 1-1.714 1.003h-2.286a2 2 0 0 1-1.714-1.003M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"
      />
    </svg>
  );
}

export function ActivityFeed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activityItems, setActivityItems] = useState<ActivityFeedItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshActivityFeed = useCallback(async () => {
    try {
      const [items, count] = await Promise.all([
        fetchActivityFeedItems(),
        getUnreadNotificationCount(),
      ]);
      setActivityItems(items);
      setUnreadCount(count);
      setError(null);
    } catch (refreshError) {
      console.error("Error loading activity feed:", refreshError);
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to load activity feed.",
      );
    }
  }, []);

  useEffect(() => {
    void refreshActivityFeed();
  }, [refreshActivityFeed]);

  useActivityFeedRealtimeRefresh(refreshActivityFeed);

  useEffect(() => {
    function handleActivityUpdated() {
      void refreshActivityFeed();
    }

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleActivityUpdated);
    return () =>
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleActivityUpdated);
  }, [refreshActivityFeed]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  async function handleToggleOpen() {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);

    if (nextIsOpen) {
      setIsLoading(true);
      await refreshActivityFeed();
      setIsLoading(false);
    }
  }

  async function handleItemClick(item: ActivityFeedItem) {
    try {
      if (!item.isRead) {
        await markNotificationAsRead(item.id);
      }

      if (item.referralId) {
        setIsOpen(false);
        dispatchOpenReferral(item.referralId);
      }

      await refreshActivityFeed();
    } catch (clickError) {
      console.error("Error opening activity item:", clickError);
      setError(
        clickError instanceof Error ? clickError.message : "Unable to open this activity item.",
      );
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead();
      await refreshActivityFeed();
    } catch (markError) {
      console.error("Error marking all activity as read:", markError);
      setError(
        markError instanceof Error
          ? markError.message
          : "Unable to mark all activity as read.",
      );
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => void handleToggleOpen()}
        aria-label="Open activity feed"
        aria-expanded={isOpen}
        className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Activity Feed</h2>
              <p className="text-xs text-slate-500">{unreadCount} unread</p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void handleMarkAllAsRead()}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <p className="p-4 text-sm text-slate-500">Loading activity...</p>
            ) : error ? (
              <p className="p-4 text-sm text-red-700">{error}</p>
            ) : activityItems.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No activity yet.</p>
            ) : (
              <ul>
                {activityItems.map((item) => {
                  const isClickable = Boolean(item.referralId);

                  return (
                    <li
                      key={item.id}
                      className={`border-t border-slate-100 ${
                        item.isRead ? "bg-white" : "bg-blue-50/60"
                      }`}
                    >
                      {isClickable ? (
                        <button
                          type="button"
                          onClick={() => void handleItemClick(item)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50"
                        >
                          <ActivityFeedItemContent item={item} />
                        </button>
                      ) : (
                        <div className="px-4 py-3">
                          <ActivityFeedItemContent item={item} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActivityFeedItemContent({ item }: { item: ActivityFeedItem }) {
  return (
    <>
      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
      <p className="mt-1 text-sm text-slate-700">{item.message}</p>
      <p className="mt-1 text-xs text-slate-500">
        {item.createdBy ? `${item.createdBy} · ` : null}
        {formatActivityTimestamp(item.createdAt)}
      </p>
    </>
  );
}
