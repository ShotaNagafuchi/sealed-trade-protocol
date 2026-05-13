"use client";

import { useReadContract } from "wagmi";
import { CONTRACTS } from "@/lib/config";
import { TradeState } from "@/lib/constants";
import SealedTradeABI from "@/lib/abi/SealedTrade.json";

export interface Trade {
  tradeId: `0x${string}`;
  assetHash: `0x${string}`;
  seller: `0x${string}`;
  buyer: `0x${string}`;
  maxDealValue: bigint;
  finalDealValue: bigint;
  deadline: bigint;
  state: TradeState;
  attestationHash: `0x${string}`;
  termsHash: `0x${string}`;
}

export function useTrade(tradeId: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.sealedTrade as `0x${string}`,
    abi: SealedTradeABI,
    functionName: "trades",
    args: tradeId ? [tradeId] : undefined,
    query: { enabled: !!tradeId },
  });

  const trade: Trade | undefined = data
    ? {
        tradeId: (data as unknown[])[0] as `0x${string}`,
        assetHash: (data as unknown[])[1] as `0x${string}`,
        seller: (data as unknown[])[2] as `0x${string}`,
        buyer: (data as unknown[])[3] as `0x${string}`,
        maxDealValue: (data as unknown[])[4] as bigint,
        finalDealValue: (data as unknown[])[5] as bigint,
        deadline: (data as unknown[])[6] as bigint,
        state: Number((data as unknown[])[7]) as TradeState,
        attestationHash: (data as unknown[])[8] as `0x${string}`,
        termsHash: (data as unknown[])[9] as `0x${string}`,
      }
    : undefined;

  return { trade, isLoading, refetch };
}
