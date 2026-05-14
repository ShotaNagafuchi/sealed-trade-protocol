"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  usePublicClient,
  useSignMessage,
} from "wagmi";
import { parseUnits, keccak256, toBytes, formatUnits, decodeEventLog } from "viem";
import { Header } from "@/components/Header";
import { CONTRACTS, DEPLOY_BLOCK } from "@/lib/config";
import { USDC_DECIMALS, BondStage } from "@/lib/constants";
import { CATEGORIES } from "@/lib/categories";
import { AgentConfigPanel } from "@/components/AgentConfigPanel";
import { savePendingSellerSetup, migratePendingSellerSetup } from "@/lib/agentStorage";
import type { AgentConfig } from "@/lib/negotiation";
import SealedTradeABI from "@/lib/abi/SealedTrade.json";
import BondVaultABI from "@/lib/abi/BondVault.json";
import MockUSDCABI from "@/lib/abi/MockUSDC.json";

export default function ListAssetPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, data: receipt } = useWaitForTransactionReceipt({ hash });
  const { signMessageAsync } = useSignMessage();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [tagsInput, setTagsInput] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [daysUntilDeadline, setDaysUntilDeadline] = useState("7");
  const [step, setStep] = useState<"approve" | "list" | "saving">("approve");
  const [error, setError] = useState("");
  const [agentConfigured, setAgentConfigured] = useState(false);

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

  const handleList = async () => {
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

    setStep("saving");
  };

  // After TX confirms, save metadata to DB
  const saveMetadata = async () => {
    if (!receipt || !address || !publicClient) return;
    setError("");

    try {
      // Extract tradeId from TradeListed event in the receipt
      const tradeListedLog = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi: SealedTradeABI,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === "TradeListed";
        } catch {
          return false;
        }
      });

      if (!tradeListedLog) {
        setError("Could not find TradeListed event in transaction receipt");
        return;
      }

      const decoded = decodeEventLog({
        abi: SealedTradeABI,
        data: tradeListedLog.data,
        topics: tradeListedLog.topics,
      });

      const tradeId = (decoded.args as unknown as { tradeId: string }).tradeId;

      // Migrate pending seller agent setup to the real tradeId
      migratePendingSellerSetup(tradeId);

      const assetHash = keccak256(toBytes(description));
      const deadlineDate = new Date(
        Date.now() + Number(daysUntilDeadline) * 86400 * 1000
      );

      // Sign auth message
      const timestamp = Date.now();
      const message = `Sealed Trade: create listing as ${address} at ${timestamp}`;
      const signature = await signMessageAsync({ message });

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Signature": signature,
          "X-Message": message,
        },
        body: JSON.stringify({
          tradeId,
          assetHash,
          title,
          description,
          category,
          tags,
          maxDealValue: dealValue.toString(),
          deadline: deadlineDate.toISOString(),
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to save listing metadata");
        return;
      }

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save metadata");
    }
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
              <label className="label">Title</label>
              <input
                type="text"
                placeholder="e.g., AI Negotiation Method Patent"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                maxLength={200}
              />
            </div>

            <div>
              <label className="label">Asset Description</label>
              <textarea
                placeholder="Detailed description of the asset..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input min-h-[80px]"
                rows={3}
              />
              <p className="text-xs text-gray-400 mt-1">
                This will be hashed (keccak256) before on-chain submission
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Tags</label>
                <input
                  type="text"
                  placeholder="e.g., urgent, exclusive"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="input"
                />
                <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
              </div>
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
                    formatUnits(
                      BigInt(bondAmount as unknown as string),
                      USDC_DECIMALS
                    )
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

            {/* Agent Configuration (optional, recommended) */}
            <div className="border-t border-gray-200 pt-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">AI Agent Setup</h2>
                {agentConfigured && (
                  <span className="text-xs text-emerald-600 font-medium">Configured</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Pre-configure your negotiation agent. When a buyer matches and
                negotiation begins, your agent will start automatically.
              </p>
              <AgentConfigPanel
                role="seller"
                maxDealValue={maxValue ? Number(maxValue) : 10000}
                mode="save"
                compact
                onSave={(apiKey, config) => {
                  savePendingSellerSetup(apiKey, config);
                  setAgentConfigured(true);
                }}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {step === "saving" && receipt ? (
              <button
                onClick={saveMetadata}
                className="btn-primary w-full"
              >
                Save Listing Details
              </button>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleApprove}
                  disabled={busy || !title || !description || !maxValue}
                  className="btn-secondary flex-1"
                >
                  {step === "approve" ? "1. Approve USDC" : "Approved"}
                </button>
                <button
                  onClick={handleList}
                  disabled={
                    busy ||
                    step === "approve" ||
                    !title ||
                    !description ||
                    !maxValue
                  }
                  className="btn-primary flex-1"
                >
                  2. List Asset
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
