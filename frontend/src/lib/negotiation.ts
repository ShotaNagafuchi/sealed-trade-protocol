export interface NegotiationMessage {
  id: string;
  round: number;
  role: "seller" | "buyer";
  action: "propose" | "counter" | "accept" | "reject";
  proposedPrice: number;
  terms: string;
  reasoning: string;
  timestamp: number;
}

export interface AgentConfig {
  role: "seller" | "buyer";
  minPrice?: number;
  maxPrice?: number;
  preferredTerms?: string;
  priorities?: string[];
  constraints?: string[];
}

export type NegotiationStatus =
  | "idle"
  | "running"
  | "agreed"
  | "failed"
  | "timeout";

export interface AgreementResult {
  finalPrice: number;
  terms: string;
  messages: NegotiationMessage[];
}

export const MAX_ROUNDS = 10;
export const POLL_INTERVAL_MS = 3000;
