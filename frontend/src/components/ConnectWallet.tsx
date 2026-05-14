"use client";

import { useAccount, useConnect, useDisconnect, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS } from "@/lib/config";
import { USDC_DECIMALS } from "@/lib/constants";
import MockUSDCABI from "@/lib/abi/MockUSDC.json";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const { data: usdcBalance } = useReadContract({
    address: CONTRACTS.mockUsdc as `0x${string}`,
    abi: MockUSDCABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  const displayBalance = usdcBalance != null
    ? `$${Number(formatUnits(BigInt(usdcBalance as unknown as string), USDC_DECIMALS)).toLocaleString()}`
    : "";

  return (
    <div className="flex items-center gap-2">
      {displayBalance && (
        <span className="text-sm text-gray-600 font-medium">
          {displayBalance}
        </span>
      )}
      <button
        onClick={() => disconnect()}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    </div>
  );
}
