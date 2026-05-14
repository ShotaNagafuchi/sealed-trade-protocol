"use client";

import { useAccount } from "wagmi";
import { Header } from "@/components/Header";
import { TradeCard } from "@/components/TradeCard";
import { useTradeEvents } from "@/hooks/useTradeEvents";
import { useOpenTrades } from "@/hooks/useOpenTrades";
import Link from "next/link";

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { trades: myTrades, isLoading: myLoading } = useTradeEvents();
  const { trades: openTrades, isLoading: openLoading } = useOpenTrades();

  // Filter open trades to exclude user's own trades
  const myTradeIds = new Set(myTrades.map((t) => t.tradeId));
  const otherTrades = openTrades.filter(
    (t) =>
      !myTradeIds.has(t.tradeId) &&
      t.seller.toLowerCase() !== address?.toLowerCase()
  );

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Sealed Trade Protocol
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-gray-600 leading-relaxed">
            Bilateral trade with sealed negotiation. AI agents negotiate inside
            hardware-isolated enclaves — only the outcome crosses the boundary.
          </p>
          <div className="mt-6 flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 font-medium ring-1 ring-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Sepolia Testnet
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">
              0.3% fee &middot; 3-stage bonds &middot; EIP-712 signatures
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        {/* Open Trades — always visible, even without wallet */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">
            Open Trades
            {openTrades.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                {openTrades.length} listed
              </span>
            )}
          </h2>

          {openLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 p-5 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : openTrades.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <p className="text-gray-500">No open trades yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Be the first to list an asset
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {openTrades.map((t) => (
                <TradeCard
                  key={t.tradeId}
                  tradeId={t.tradeId}
                  role={
                    t.seller.toLowerCase() === address?.toLowerCase()
                      ? "seller"
                      : "buyer"
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* My Trades — requires wallet */}
        {isConnected && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">My Trades</h2>
              <Link href="/trade/new" className="btn-primary">
                + List Asset
              </Link>
            </div>

            {myLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-200 p-5 animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : myTrades.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <p className="text-gray-500">
                  You have no active trades
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  List an asset or express interest on an open trade above
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {myTrades.map((t) => (
                  <TradeCard
                    key={t.tradeId}
                    tradeId={t.tradeId}
                    role={t.role}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Wallet connect prompt */}
        {!isConnected && (
          <section className="mb-10">
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                </svg>
              </div>
              <p className="text-gray-700 text-lg font-medium">
                Connect your wallet to trade
              </p>
              <p className="text-gray-400 text-sm mt-1.5">
                List assets, express interest, and settle trades on Sepolia testnet
              </p>
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="border-t border-gray-100 pt-10">
          <h2 className="text-lg font-semibold mb-6">How it works</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "List & Match",
                desc: "Seller lists an asset with a max deal value. Buyer expresses interest. Both post discovery bonds (1%).",
              },
              {
                step: "2",
                title: "Sealed Negotiation",
                desc: "AI agents negotiate inside a TEE enclave. Neither party observes the process. Bonds escalate to 3%, then 10%.",
              },
              {
                step: "3",
                title: "Settlement",
                desc: "Agreed price transfers from buyer to seller minus 0.3% fee. Bonds are released. Fully on-chain.",
              },
            ].map((item) => (
              <div key={item.step} className="relative pl-10">
                <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                  {item.step}
                </div>
                <h3 className="font-medium text-gray-900">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
