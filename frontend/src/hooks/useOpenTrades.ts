"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { CONTRACTS, DEPLOY_BLOCK } from "@/lib/config";

export interface OpenTrade {
  tradeId: `0x${string}`;
  seller: `0x${string}`;
  maxDealValue: bigint;
}

export function useOpenTrades() {
  const publicClient = usePublicClient();
  const [trades, setTrades] = useState<OpenTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!publicClient) return;

    let cancelled = false;

    async function fetchAll() {
      setIsLoading(true);
      try {
        const logs = await publicClient!.getLogs({
          address: CONTRACTS.sealedTrade as `0x${string}`,
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
          fromBlock: DEPLOY_BLOCK,
        });

        if (cancelled) return;

        setTrades(
          logs.map((log) => ({
            tradeId: log.args.tradeId as `0x${string}`,
            seller: log.args.seller as `0x${string}`,
            maxDealValue: log.args.maxDealValue as bigint,
          }))
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [publicClient]);

  return { trades, isLoading };
}
