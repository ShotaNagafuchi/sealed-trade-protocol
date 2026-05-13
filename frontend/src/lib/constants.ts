export const USDC_DECIMALS = 6;

export const FEE_BPS = 30; // 0.3%

export enum BondStage {
  None = 0,
  Discovery = 1,
  Negotiation = 2,
  Execution = 3,
}

export enum TradeState {
  Listed = 0,
  Matched = 1,
  Negotiating = 2,
  Agreed = 3,
  Settled = 4,
  Cancelled = 5,
}

export const TRADE_STATE_LABELS: Record<TradeState, string> = {
  [TradeState.Listed]: "Listed",
  [TradeState.Matched]: "Matched",
  [TradeState.Negotiating]: "Negotiating",
  [TradeState.Agreed]: "Agreed",
  [TradeState.Settled]: "Settled",
  [TradeState.Cancelled]: "Cancelled",
};

export const BOND_STAGE_LABELS: Record<BondStage, string> = {
  [BondStage.None]: "None",
  [BondStage.Discovery]: "Discovery (1%)",
  [BondStage.Negotiation]: "Negotiation (3%)",
  [BondStage.Execution]: "Execution (10%)",
};

// Faucet mint amount: 10,000 USDC
export const FAUCET_AMOUNT = 10_000n * 10n ** 6n;
