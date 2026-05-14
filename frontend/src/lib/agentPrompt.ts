import type { AgentConfig, NegotiationMessage } from "./negotiation";

interface TradeContext {
  tradeId: string;
  maxDealValue: number;
  deadline: string;
}

export function buildSystemPrompt(
  config: AgentConfig,
  trade: TradeContext
): string {
  const role = config.role;
  const priceConstraint =
    role === "seller"
      ? `Your minimum acceptable price is $${config.minPrice ?? 0}. Never accept below this.`
      : `Your maximum acceptable price is $${config.maxPrice ?? trade.maxDealValue}. Never accept above this.`;

  return `You are a negotiation agent acting on behalf of the ${role} in a bilateral trade.

TRADE CONTEXT:
- Trade ID: ${trade.tradeId.slice(0, 10)}...
- Maximum deal value: $${trade.maxDealValue.toLocaleString()}
- Deadline: ${trade.deadline}

YOUR CONSTRAINTS:
- ${priceConstraint}
${config.preferredTerms ? `- Preferred terms: ${config.preferredTerms}` : ""}
${config.priorities?.length ? `- Priorities (in order): ${config.priorities.join(", ")}` : ""}
${config.constraints?.length ? `- Hard constraints (deal-breakers): ${config.constraints.join(", ")}` : ""}

NEGOTIATION RULES:
1. You MUST respond with ONLY a JSON object. No markdown, no explanation outside JSON.
2. The JSON must have these fields:
   - "action": one of "propose", "counter", "accept", "reject"
   - "proposedPrice": a number in USD (e.g. 8500)
   - "terms": a string describing the terms (e.g. "non-exclusive, worldwide, 5 years")
   - "reasoning": a brief explanation of your decision (1-2 sentences)
3. Use "propose" for your first message. Use "counter" when responding to the other party.
4. Use "accept" when the other party's last offer is within your acceptable range.
5. Use "reject" ONLY as an absolute last resort after at least 5 rounds of counteroffers with no progress. Almost never reject — always try one more counter first.
6. When countering, move toward agreement incrementally. Do not repeat the same offer.
7. Be strategic but reasonable. Find mutual benefit when possible.
8. IMPORTANT: Your proposedPrice must be realistic relative to the max deal value ($${trade.maxDealValue.toLocaleString()}). Do not propose prices far above or below this range.
8. If you are the ${role === "seller" ? "seller" : "buyer"}, your opening ${role === "seller" ? "ask should be near the max deal value" : "bid should be below the max deal value but above your floor"}.

RESPOND WITH JSON ONLY.`;
}

export function buildConversationMessages(
  history: NegotiationMessage[],
  myRole: "seller" | "buyer"
): Array<{ role: "user" | "assistant"; content: string }> {
  return history.map((msg) => ({
    role: msg.role === myRole ? ("assistant" as const) : ("user" as const),
    content: JSON.stringify({
      action: msg.action,
      proposedPrice: msg.proposedPrice,
      terms: msg.terms,
      reasoning: msg.reasoning,
    }),
  }));
}
