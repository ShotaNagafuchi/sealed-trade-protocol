"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type {
  NegotiationMessage,
  AgentConfig,
  NegotiationStatus,
  AgreementResult,
} from "@/lib/negotiation";
import { MAX_ROUNDS, POLL_INTERVAL_MS } from "@/lib/negotiation";
import { buildSystemPrompt, buildConversationMessages } from "@/lib/agentPrompt";

interface UseNegotiationParams {
  tradeId: string;
  maxDealValue: number;
  deadline: string;
}

export function useNegotiation({
  tradeId,
  maxDealValue,
  deadline,
}: UseNegotiationParams) {
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [status, setStatus] = useState<NegotiationStatus>("idle");
  const [agreement, setAgreement] = useState<AgreementResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const configRef = useRef<AgentConfig | null>(null);
  const apiKeyRef = useRef<string>("");
  const lastTimestampRef = useRef<number>(0);
  const processingRef = useRef(false);

  const tradeContext = { tradeId, maxDealValue, deadline };

  const promptClaude = useCallback(
    async (history: NegotiationMessage[]): Promise<NegotiationMessage | null> => {
      const config = configRef.current!;
      const systemPrompt = buildSystemPrompt(config, tradeContext);
      const conversationMessages = buildConversationMessages(history, config.role);

      // If no history yet, add a kickoff user message
      const msgs =
        conversationMessages.length === 0
          ? [{ role: "user" as const, content: "Begin the negotiation. Make your opening proposal." }]
          : conversationMessages;

      const res = await fetch(`/api/negotiate/${tradeId}/prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeyRef.current,
          systemPrompt,
          messages: msgs,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Claude API error");
      }

      const data = await res.json();
      const text = data.content?.[0]?.text;
      if (!text) throw new Error("Empty Claude response");

      // Parse JSON from response (handle potential markdown wrapping)
      const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(jsonStr);

      return {
        id: crypto.randomUUID(),
        round: 0, // server assigns
        role: config.role,
        action: parsed.action,
        proposedPrice: parsed.proposedPrice,
        terms: parsed.terms,
        reasoning: parsed.reasoning,
        timestamp: 0, // server assigns
      };
    },
    [tradeId, tradeContext]
  );

  const postMessage = useCallback(
    async (msg: NegotiationMessage) => {
      const res = await fetch(`/api/negotiate/${tradeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg),
      });
      if (!res.ok) throw new Error("Failed to post message");
    },
    [tradeId]
  );

  const pollAndRespond = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      const res = await fetch(
        `/api/negotiate/${tradeId}?after=${lastTimestampRef.current}`
      );
      const { messages: newMessages } = await res.json();

      if (!newMessages || newMessages.length === 0) return;

      // Update local state
      const allRes = await fetch(`/api/negotiate/${tradeId}`);
      const { messages: allMessages } = await allRes.json();
      setMessages(allMessages);
      lastTimestampRef.current = Math.max(
        ...allMessages.map((m: NegotiationMessage) => m.timestamp)
      );

      // Check if the latest message is from the counterparty
      const latest = allMessages[allMessages.length - 1] as NegotiationMessage;
      const myRole = configRef.current!.role;

      if (latest.role === myRole) return; // Our own message, skip

      // Check for terminal states
      if (latest.action === "accept") {
        // Counterparty accepted — find what they accepted
        const lastOurs = [...allMessages]
          .reverse()
          .find((m: NegotiationMessage) => m.role === myRole);
        setAgreement({
          finalPrice: lastOurs?.proposedPrice ?? latest.proposedPrice,
          terms: lastOurs?.terms ?? latest.terms,
          messages: allMessages,
        });
        setStatus("agreed");
        stopPolling();
        return;
      }

      if (latest.action === "reject") {
        setStatus("failed");
        setError("Counterparty rejected the negotiation.");
        stopPolling();
        return;
      }

      // Check round limit
      if (allMessages.length >= MAX_ROUNDS * 2) {
        setStatus("timeout");
        setError("Maximum rounds reached without agreement.");
        stopPolling();
        return;
      }

      // Generate our response
      setIsThinking(true);
      let response = await promptClaude(allMessages);

      if (!response) {
        // Retry once
        response = await promptClaude(allMessages);
        if (!response) {
          setStatus("failed");
          setError("Agent failed to generate a response.");
          stopPolling();
          return;
        }
      }

      await postMessage(response);

      // If we accepted, we're done
      if (response.action === "accept") {
        setAgreement({
          finalPrice: latest.proposedPrice,
          terms: latest.terms,
          messages: [...allMessages, response],
        });
        setStatus("agreed");
        stopPolling();
        return;
      }

      if (response.action === "reject") {
        setStatus("failed");
        setError("Your agent rejected the negotiation.");
        stopPolling();
        return;
      }

      // Refresh messages
      const refreshRes = await fetch(`/api/negotiate/${tradeId}`);
      const { messages: refreshed } = await refreshRes.json();
      setMessages(refreshed);
      lastTimestampRef.current = Math.max(
        ...refreshed.map((m: NegotiationMessage) => m.timestamp)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Negotiation error");
    } finally {
      setIsThinking(false);
      processingRef.current = false;
    }
  }, [tradeId, promptClaude, postMessage]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startNegotiation = useCallback(
    async (apiKey: string, config: AgentConfig) => {
      apiKeyRef.current = apiKey;
      configRef.current = config;
      setStatus("running");
      setError(null);
      setMessages([]);
      setAgreement(null);

      // Seller goes first
      if (config.role === "seller") {
        try {
          setIsThinking(true);
          const opening = await promptClaude([]);
          if (opening) {
            await postMessage(opening);
            const res = await fetch(`/api/negotiate/${tradeId}`);
            const { messages: all } = await res.json();
            setMessages(all);
            lastTimestampRef.current = Math.max(
              ...all.map((m: NegotiationMessage) => m.timestamp)
            );
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to start");
          setStatus("failed");
          return;
        } finally {
          setIsThinking(false);
        }
      }

      // Start polling
      intervalRef.current = setInterval(pollAndRespond, POLL_INTERVAL_MS);
    },
    [promptClaude, postMessage, pollAndRespond, tradeId]
  );

  const stopNegotiation = useCallback(() => {
    stopPolling();
    setStatus("idle");
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    messages,
    status,
    agreement,
    error,
    isThinking,
    startNegotiation,
    stopNegotiation,
  };
}
