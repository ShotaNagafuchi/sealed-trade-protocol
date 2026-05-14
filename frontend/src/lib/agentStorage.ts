import type { AgentConfig } from "./negotiation";

interface StoredAgentSetup {
  apiKey: string;
  config: AgentConfig;
}

function storageKey(tradeId: string, role: "seller" | "buyer") {
  return `agent-setup-${role}-${tradeId}`;
}

export function saveAgentSetup(
  tradeId: string,
  role: "seller" | "buyer",
  apiKey: string,
  config: AgentConfig
) {
  if (typeof window === "undefined") return;
  const data: StoredAgentSetup = { apiKey, config };
  sessionStorage.setItem(storageKey(tradeId, role), JSON.stringify(data));
  // Also persist API key globally for convenience
  sessionStorage.setItem("claude-api-key", apiKey);
}

export function loadAgentSetup(
  tradeId: string,
  role: "seller" | "buyer"
): StoredAgentSetup | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(storageKey(tradeId, role));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAgentSetup;
  } catch {
    return null;
  }
}

export function hasAgentSetup(
  tradeId: string,
  role: "seller" | "buyer"
): boolean {
  return loadAgentSetup(tradeId, role) !== null;
}

/**
 * For seller: save setup keyed by a temporary ID before tradeId is known.
 * After listing, call migrateAgentSetup to move it to the real tradeId.
 */
export function savePendingSellerSetup(apiKey: string, config: AgentConfig) {
  if (typeof window === "undefined") return;
  const data: StoredAgentSetup = { apiKey, config };
  sessionStorage.setItem("agent-setup-pending-seller", JSON.stringify(data));
  sessionStorage.setItem("claude-api-key", apiKey);
}

export function migratePendingSellerSetup(tradeId: string) {
  if (typeof window === "undefined") return;
  const raw = sessionStorage.getItem("agent-setup-pending-seller");
  if (!raw) return;
  sessionStorage.setItem(storageKey(tradeId, "seller"), raw);
  sessionStorage.removeItem("agent-setup-pending-seller");
}
