"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchReferralMessages, sendReferralMessage } from "@/lib/referralMessages";
import {
  REALTIME_MESSAGES_UPDATED,
} from "@/lib/realtime/events";
import { useReferralRealtimeRefresh } from "@/lib/realtime/useReferralRealtimeRefresh";
import type { ReferralMessage } from "@/types/referralMessage";

type ReferralChatProps = {
  referralId: string;
  createdBy: string;
};

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

function formatMessageTimestamp(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReferralChat({ referralId, createdBy }: ReferralChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ReferralMessage[]>([]);
  const [draftMessage, setDraftMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const items = await fetchReferralMessages(referralId);
      setMessages(items);
    } catch (loadError) {
      console.error("Error loading referral discussion:", loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "An unexpected error occurred while loading the discussion.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [referralId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useReferralRealtimeRefresh(referralId, loadMessages, REALTIME_MESSAGES_UPDATED);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draftMessage.trim() || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await sendReferralMessage({
        referralId,
        message: draftMessage,
        createdBy,
      });
      setDraftMessage("");
      await loadMessages();
    } catch (sendError) {
      console.error("Error sending referral message:", sendError);
      setError(
        sendError instanceof Error
          ? sendError.message
          : "An unexpected error occurred while sending the message.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-slate-50">
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading discussion...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-500">
            No messages yet. Start the referral discussion below.
          </p>
        ) : (
          <ul className="space-y-3">
            {messages.map((message) => (
              <li
                key={message.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-sm text-slate-900">{message.message}</p>
                <p className="mt-2 text-xs font-semibold text-slate-600">{message.createdBy}</p>
                <time className="mt-1 block text-xs text-slate-500" dateTime={message.createdAt}>
                  {formatMessageTimestamp(message.createdAt)}
                </time>
              </li>
            ))}
            <div ref={messagesEndRef} />
          </ul>
        )}
      </div>

      <form onSubmit={(event) => void handleSend(event)} className="border-t border-slate-200 p-4">
        <label htmlFor="referral-discussion-message" className="sr-only">
          Write a message for this referral discussion
        </label>
        <textarea
          id="referral-discussion-message"
          rows={3}
          value={draftMessage}
          onChange={(event) => setDraftMessage(event.target.value)}
          placeholder="Write a message for this referral discussion..."
          className={inputClassName}
        />

        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Sending as {createdBy}</p>
          <button
            type="submit"
            disabled={isSending || !draftMessage.trim()}
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
