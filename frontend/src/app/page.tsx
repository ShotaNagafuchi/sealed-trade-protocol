"use client";

import { useAccount } from "wagmi";
import { Header } from "@/components/Header";
import { TradeCard } from "@/components/TradeCard";
import { useTradeEvents } from "@/hooks/useTradeEvents";
import Link from "next/link";

export default function Dashboard() {
  const { isConnected } = useAccount();
  const { trades, isLoading } = useTradeEvents();

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Trades</h1>
          <Link href="/trade/new" className="btn-primary">
            + List Asset
          </Link>
        </div>

        {!isConnected ? (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500 text-lg">
              Connect your wallet to see your trades
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Use the button in the top right corner
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 p-5 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500 text-lg">No trades yet</p>
            <p className="text-gray-400 text-sm mt-2">
              List an asset to get started, or express interest on an existing
              trade
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {trades.map((t) => (
              <TradeCard key={t.tradeId} tradeId={t.tradeId} role={t.role} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
