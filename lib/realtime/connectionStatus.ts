export type RealtimeConnectionStatus = "connected" | "reconnecting" | "offline";

export function mapChannelStatus(status: string): RealtimeConnectionStatus {
  if (status === "SUBSCRIBED") {
    return "connected";
  }

  if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
    return "reconnecting";
  }

  return "offline";
}

export function getBrowserConnectionStatus(isOnline: boolean): RealtimeConnectionStatus {
  return isOnline ? "reconnecting" : "offline";
}
