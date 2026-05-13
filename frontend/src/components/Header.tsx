"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { FaucetButton } from "./FaucetButton";

export function Header() {
  return (
    <header className="border-b border-gray-200 px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Sealed Trade
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/trade/new"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              List Asset
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <FaucetButton />
          <ConnectButton showBalance={true} chainStatus="icon" />
        </div>
      </div>
    </header>
  );
}
