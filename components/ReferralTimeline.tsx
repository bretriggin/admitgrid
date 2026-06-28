"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchReferralActivityLog } from "@/lib/referralActivityLog";
import { REALTIME_ACTIVITY_LOG_UPDATED } from "@/lib/realtime/events";
import { useReferralRealtimeRefresh } from "@/lib/realtime/useReferralRealtimeRefresh";
import type { ReferralActivityLogEntry } from "@/types/referralActivity";

type ReferralTimelineProps = {
  referralId: string;
  refreshKey?: number;
};

function formatTimelineTimestamp(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReferralTimeline({ referralId, refreshKey = 0 }: ReferralTimelineProps) {
  const [entries, setEntries] = useState<ReferralActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTimeline = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const logEntries = await fetchReferralActivityLog(referralId);
      setEntries(logEntries);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "An unexpected error occurred while loading the timeline.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [referralId]);

  useEffect(() => {
    void loadTimeline();
  }, [loadTimeline, refreshKey]);

  useReferralRealtimeRefresh(referralId, loadTimeline, REALTIME_ACTIVITY_LOG_UPDATED);

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-8">
        <p className="text-sm text-slate-500">Loading timeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8">
        <p className="text-sm text-slate-500">No timeline activity recorded yet.</p>
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {entries.map((entry, index) => (
        <li
          key={entry.id}
          className="relative rounded-xl border border-slate-200 bg-white p-4 pl-8"
        >
          <span
            aria-hidden
            className="absolute left-3 top-5 h-2.5 w-2.5 rounded-full bg-blue-700"
          />
          {index < entries.length - 1 ? (
            <span
              aria-hidden
              className="absolute bottom-[-16px] left-[14px] top-7 w-px bg-slate-200"
            />
          ) : null}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">{entry.action}</p>
            <time className="text-xs text-slate-500" dateTime={entry.createdAt}>
              {formatTimelineTimestamp(entry.createdAt)}
            </time>
          </div>
          {entry.details ? (
            <p className="mt-1 text-sm text-slate-600">{entry.details}</p>
          ) : null}
          {entry.createdBy ? (
            <p className="mt-2 text-xs font-semibold text-slate-500">{entry.createdBy}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
