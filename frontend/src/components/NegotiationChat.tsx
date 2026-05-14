"use client";

import { useEffect, useRef } from "react";
import type { NegotiationMessage } from "@/lib/negotiation";

const ACTION_BADGES: Record<string, { label: string; color: string }> = {
  propose: { label: "Propose", color: "bg-blue-100 text-blue-700" },
  counter: { label: "Counter", color: "bg-amber-100 text-amber-700" },
  accept: { label: "Accept", color: "bg-emerald-100 text-emerald-700" },
  reject: { label: "Reject", color: "bg-red-100 text-red-700" },
};

interface NegotiationChatProps {
  messages: NegotiationMessage[];
  currentRole: "seller" | "buyer";
  isThinking: boolean;
}

export function NegotiationChat({
  messages,
  currentRole,
  isThinking,
}: NegotiationChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 max-h-96 overflow-y-auto">
      {messages.length === 0 && !isThinking && (
        <p className="text-sm text-gray-400 text-center py-4">
          Waiting for negotiation to begin...
        </p>
      )}

      <div className="space-y-3">
        {messages.map((msg) => {
          const isOurs = msg.role === currentRole;
          const badge = ACTION_BADGES[msg.action];

          return (
            <div
              key={msg.id ?? msg.round}
              className={`flex ${isOurs ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  isOurs
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs opacity-60">
                    Round {msg.round} &middot; {msg.role}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      isOurs
                        ? "bg-white/20 text-white/90"
                        : badge.color
                    }`}
                  >
                    {badge.label}
                  </span>
                </div>
                <div className={`text-lg font-semibold ${isOurs ? "" : "text-gray-900"}`}>
                  ${msg.proposedPrice.toLocaleString()}
                </div>
                <div className={`text-sm mt-1 ${isOurs ? "text-gray-300" : "text-gray-600"}`}>
                  {msg.terms}
                </div>
                <div className={`text-xs mt-2 ${isOurs ? "text-gray-400" : "text-gray-400"} italic`}>
                  {msg.reasoning}
                </div>
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="flex justify-end">
            <div className="bg-gray-900 text-white rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-sm text-gray-400">Agent thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
