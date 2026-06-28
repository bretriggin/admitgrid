"use client";

import { useRealtimeConnection } from "@/components/RealtimeProvider";
import type { RealtimeConnectionStatus } from "@/lib/realtime/connectionStatus";

const statusLabels: Record<RealtimeConnectionStatus, string> = {
  connected: "Connected",
  reconnecting: "Reconnecting",
  offline: "Offline",
};

const statusStyles: Record<RealtimeConnectionStatus, string> = {
  connected: "bg-green-50 text-green-800 ring-green-200",
  reconnecting: "bg-amber-50 text-amber-800 ring-amber-200",
  offline: "bg-slate-100 text-slate-600 ring-slate-200",
};

const statusDots: Record<RealtimeConnectionStatus, string> = {
  connected: "bg-green-500",
  reconnecting: "bg-amber-500",
  offline: "bg-slate-400",
};

export function RealtimeConnectionIndicator() {
  const connectionStatus = useRealtimeConnection();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusStyles[connectionStatus]}`}
      aria-live="polite"
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${statusDots[connectionStatus]}`}
      />
      {statusLabels[connectionStatus]}
    </span>
  );
}
