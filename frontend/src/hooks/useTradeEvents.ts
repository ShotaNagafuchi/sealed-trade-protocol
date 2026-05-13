"use client";

import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { CONTRACTS } from "@/lib/config";
import SealedTradeABI from "@/lib/abi/SealedTrade.json";

export interface TradeEvent {
  tradeId: `0x${string}`;
  role: "seller" | "buyer";
}

export function useTradeEvents() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [trades, setTrades] = useState<TradeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !publicClient) return;

    let cancelled = false;

    async function fetchEvents() {
      setIsLoading(true);
      try {
        const sealedTrade = CONTRACTS.sealedTrade as `0x${string}`;

        const [listedLogs, matchedLogs] = await Promise.all([
          publicClient!.getLogs({
            address: sealedTrade,
            event: {
              type: "event",
              name: "TradeListed",
              inputs: [
                { name: "tradeId", type: "bytes32", indexed: true },
                { name: "seller", type: "address", indexed: true },
                { name: "assetHash", type: "bytes32", indexed: false },
                { name: "maxDealValue", type: "uint256", indexed: false },
              ],
            },
            args: { seller: address },
            fromBlock: 0n,
          }),
          publicClient!.getLogs({
            address: sealedTrade,
            event: {
              type: "event",
              name: "TradeMatched",
              inputs: [
                { name: "tradeId", type: "bytes32", indexed: true },
                { name: "buyer", type: "address", indexed: true },
              ],
            },
            args: { buyer: address },
            fromBlock: 0n,
          }),
        ]);

        if (cancelled) return;

        const tradeMap = new Map<string, TradeEvent>();

        for (const log of listedLogs) {
          const tradeId = log.args.tradeId as `0x${string}`;
          tradeMap.set(tradeId, { tradeId, role: "seller" });
        }

        for (const log of matchedLogs) {
          const tradeId = log.args.tradeId as `0x${string}`;
          if (!tradeMap.has(tradeId)) {
            tradeMap.set(tradeId, { tradeId, role: "buyer" });
          }
        }

        setTrades(Array.from(tradeMap.values()));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchEvents();
    return () => {
      cancelled = true;
    };
  }, [address, publicClient]);

  return { trades, isLoading };
}
