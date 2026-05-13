"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "@/lib/config";
import { FAUCET_AMOUNT } from "@/lib/constants";
import MockUSDCABI from "@/lib/abi/MockUSDC.json";

export function FaucetButton() {
  const { address, isConnected } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  if (!isConnected) return null;

  const handleMint = () => {
    writeContract({
      address: CONTRACTS.mockUsdc as `0x${string}`,
      abi: MockUSDCABI,
      functionName: "mint",
      args: [address, FAUCET_AMOUNT],
    });
  };

  return (
    <button
      onClick={handleMint}
      disabled={isPending || isConfirming}
      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
    >
      {isPending
        ? "Confirming..."
        : isConfirming
          ? "Minting..."
          : "Get 10K USDC"}
    </button>
  );
}
