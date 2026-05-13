"use client";

import { use } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { Header } from "@/components/Header";
import { ActionPanel } from "@/components/ActionPanel";
import { BondInfo } from "@/components/BondInfo";
import { useTrade } from "@/hooks/useTrade";
import {
  USDC_DECIMALS,
  TRADE_STATE_LABELS,
  TradeState,
} from "@/lib/constants";

const STATE_COLORS: Record<TradeState, string> = {
  [TradeState.Listed]: "bg-blue-100 text-blue-800",
  [TradeState.Matched]: "bg-yellow-100 text-yellow-800",
  [TradeState.Negotiating]: "bg-purple-100 text-purple-800",
  [TradeState.Agreed]: "bg-orange-100 text-orange-800",
  [TradeState.Settled]: "bg-green-100 text-green-800",
  [TradeState.Cancelled]: "bg-gray-100 text-gray-600",
};

interface PageProps {
  params: Promise<{ tradeId: string }>;
}

export default function TradeDetailPage({ params }: PageProps) {
  const { tradeId } = use(params);
  const { address } = useAccount();
  const tradeIdHex = (
    tradeId.startsWith("0x") ? tradeId : `0x${tradeId}`
  ) as `0x${string}`;
  const { trade, isLoading, refetch } = useTrade(tradeIdHex);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
          </div>
        ) : !trade ||
          trade.tradeId ===
            "0x0000000000000000000000000000000000000000000000000000000000000000" ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Trade not found</p>
            <p className="text-gray-400 text-sm mt-1 font-mono">
              {tradeIdHex.slice(0, 18)}...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold">Trade Detail</h1>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATE_COLORS[trade.state]}`}
                  >
                    {TRADE_STATE_LABELS[trade.state]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-mono">
                  {trade.tradeId.slice(0, 18)}...{trade.tradeId.slice(-8)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  $
                  {Number(
                    formatUnits(trade.maxDealValue, USDC_DECIMALS)
                  ).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">max deal value</div>
                {trade.finalDealValue > 0n && (
                  <div className="text-sm text-emerald-600 font-medium mt-1">
                    Final: $
                    {Number(
                      formatUnits(trade.finalDealValue, USDC_DECIMALS)
                    ).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Info grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4 space-y-2">
                <h3 className="text-sm font-semibold">Participants</h3>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Seller</span>
                    <span className="font-mono text-xs">
                      {trade.seller.slice(0, 6)}...{trade.seller.slice(-4)}
                      {address?.toLowerCase() === trade.seller.toLowerCase() &&
                        " (you)"}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-500">Buyer</span>
                    <span className="font-mono text-xs">
                      {trade.buyer ===
                      "0x0000000000000000000000000000000000000000"
                        ? "—"
                        : `${trade.buyer.slice(0, 6)}...${trade.buyer.slice(-4)}${address?.toLowerCase() === trade.buyer.toLowerCase() ? " (you)" : ""}`}
                    </span>
                  </div>
                </div>
                <div className="text-sm mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deadline</span>
                    <span>
                      {new Date(
                        Number(trade.deadline) * 1000
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bond info for connected user */}
              {address && (
                <BondInfo
                  tradeId={trade.tradeId}
                  party={address as `0x${string}`}
                  dealValue={trade.maxDealValue}
                />
              )}
            </div>

            {/* Hashes */}
            <div className="rounded-lg border border-gray-200 p-4 space-y-2">
              <h3 className="text-sm font-semibold">On-Chain Data</h3>
              <div className="text-xs font-mono text-gray-500 space-y-1">
                <div>
                  Asset Hash: {trade.assetHash.slice(0, 18)}...
                  {trade.assetHash.slice(-8)}
                </div>
                {trade.attestationHash !==
                  "0x0000000000000000000000000000000000000000000000000000000000000000" && (
                  <div>
                    Attestation: {trade.attestationHash.slice(0, 18)}...
                    {trade.attestationHash.slice(-8)}
                  </div>
                )}
                {trade.termsHash !==
                  "0x0000000000000000000000000000000000000000000000000000000000000000" && (
                  <div>
                    Terms Hash: {trade.termsHash.slice(0, 18)}...
                    {trade.termsHash.slice(-8)}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-lg border border-gray-200 p-4">
              <ActionPanel trade={trade} onSuccess={refetch} />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
