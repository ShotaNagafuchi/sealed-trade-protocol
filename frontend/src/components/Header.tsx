"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaucetButton } from "./FaucetButton";
import { ConnectWallet } from "./ConnectWallet";

export function Header() {
  const pathname = usePathname();

  const navLink = (href: string, label: string) => {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`text-sm transition-colors ${
          isActive
            ? "text-gray-900 font-medium"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-3.5">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold tracking-tight text-gray-900">
            Sealed Trade
          </Link>
          <nav className="flex gap-4">
            {navLink("/", "Dashboard")}
            {navLink("/browse", "Browse")}
            {navLink("/trade/new", "List Asset")}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <FaucetButton />
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
