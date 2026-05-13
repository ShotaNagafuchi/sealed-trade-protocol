"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseUnits, keccak256, toBytes, formatUnits } from "viem";
import { Header } from "@/components/Header";
import { CONTRACTS } from "@/lib/config";
import { USDC_DECIMALS, BondStage } from "@/lib/constants";
import SealedTradeABI from "@/lib/abi/SealedTrade.json";
import BondVaultABI from "@/lib/abi/BondVault.json";
import MockUSDCABI from "@/lib/abi/MockUSDC.json";

export default function ListAssetPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const [description, setDescription] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [daysUntilDeadline, setDaysUntilDeadline] = useState("7");
  const [step, setStep] = useState<"approve" | "list">("approve");

  const dealValue = maxValue ? parseUnits(maxValue, USDC_DECIMALS) : 0n;

  const { data: bondAmount } = useReadContract({
    address: CONTRACTS.bondVault as `0x${string}`,
    abi: BondVaultABI,
    functionName: "getBondAmount",
    args: [BondStage.Discovery, dealValue],
    query: { enabled: dealValue > 0n },
  });

  const busy = isPending || isConfirming;

  const handleApprove = () => {
    writeContract({
      address: CONTRACTS.mockUsdc as `0x${string}`,
      abi: MockUSDCABI,
      functionName: "approve",
      args: [CONTRACTS.bondVault as `0x${string}`, dealValue],
    });
    setStep("list");
  };

  const handleList = () => {
    const assetHash = keccak256(toBytes(description));
    const deadline = BigInt(
      Math.floor(Date.now() / 1000) + Number(daysUntilDeadline) * 86400
    );

    writeContract({
      address: CONTRACTS.sealedTrade as `0x${string}`,
      abi: SealedTradeABI,
      functionName: "listAsset",
      args: [assetHash, dealValue, deadline],
    });

    // After TX confirms, redirect to dashboard
    setTimeout(() => router.push("/"), 3000);
  };

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">List an Asset</h1>

        {!isConnected ? (
          <p className="text-gray-500">Connect your wallet to list an asset.</p>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="label">Asset Description</label>
              <input
                type="text"
                placeholder="e.g., Patent US-2026-001: AI Negotiation Method"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
              />
              <p className="text-xs text-gray-400 mt-1">
                This will be hashed (keccak256) before submission
              </p>
            </div>

            <div>
              <label className="label">Maximum Deal Value (USD)</label>
              <input
                type="number"
                placeholder="10000"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
                className="input"
              />
              {bondAmount != null && (
                <p className="text-xs text-gray-500 mt-1">
                  Discovery bond: $
                  {Number(
                    formatUnits(BigInt(bondAmount as unknown as string), USDC_DECIMALS)
                  ).toLocaleString()}{" "}
                  USDC (1%)
                </p>
              )}
            </div>

            <div>
              <label className="label">Deadline (days from now)</label>
              <input
                type="number"
                placeholder="7"
                value={daysUntilDeadline}
                onChange={(e) => setDaysUntilDeadline(e.target.value)}
                className="input"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleApprove}
                disabled={busy || !description || !maxValue}
                className="btn-secondary flex-1"
              >
                {step === "approve" ? "1. Approve USDC" : "Approved"}
              </button>
              <button
                onClick={handleList}
                disabled={busy || step === "approve" || !description || !maxValue}
                className="btn-primary flex-1"
              >
                2. List Asset
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
