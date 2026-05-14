"use client";

import Link from "next/link";
import { formatUnits } from "viem";
import { useTrade } from "@/hooks/useTrade";
import { useListing } from "@/hooks/useListing";
import { USDC_DECIMALS, TRADE_STATE_LABELS, TradeState } from "@/lib/constants";
import { getCategoryLabel } from "@/lib/categories";

const STATE_COLORS: Record<TradeState, string> = {
  [TradeState.Listed]: "bg-blue-100 text-blue-800",
  [TradeState.Matched]: "bg-yellow-100 text-yellow-800",
  [TradeState.Negotiating]: "bg-purple-100 text-purple-800",
  [TradeState.Agreed]: "bg-orange-100 text-orange-800",
  [TradeState.Settled]: "bg-green-100 text-green-800",
  [TradeState.Cancelled]: "bg-gray-100 text-gray-600",
};

interface TradeCardProps {
  tradeId: `0x${string}`;
  role: "seller" | "buyer";
}

export function TradeCard({ tradeId, role }: TradeCardProps) {
  const { trade, isLoading } = useTrade(tradeId);
  const { listing } = useListing(tradeId);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    );
  }

  if (!trade) return null;

  const dealValue = formatUnits(trade.maxDealValue, USDC_DECIMALS);
  const deadline = new Date(Number(trade.deadline) * 1000);
  const isExpired = deadline < new Date();

  return (
    <Link
      href={`/trade/${tradeId}`}
      className="block rounded-xl border border-gray-200 p-5 hover:border-gray-400 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATE_COLORS[trade.state]}`}
          >
            {TRADE_STATE_LABELS[trade.state]}
          </span>
          {listing && (
            <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {getCategoryLabel(listing.category)}
            </span>
          )}
        </div>
        <span className="text-lg font-semibold">
          ${Number(dealValue).toLocaleString()}
        </span>
      </div>

      {listing ? (
        <h3 className="font-medium text-gray-900 line-clamp-1 mb-1">
          {listing.title}
        </h3>
      ) : (
        <div className="text-xs text-gray-500 font-mono truncate mb-1">
          {tradeId.slice(0, 10)}...{tradeId.slice(-8)}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase font-medium">
          {role}
        </span>
        <span className="text-xs text-gray-400">
          {isExpired ? (
            <span className="text-red-500">Expired</span>
          ) : (
            <>Deadline: {deadline.toLocaleDateString()}</>
          )}
        </span>
      </div>

      {listing && listing.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {listing.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-block rounded bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
