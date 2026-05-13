"use client";

import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS } from "@/lib/config";
import { USDC_DECIMALS, BondStage, BOND_STAGE_LABELS } from "@/lib/constants";
import BondVaultABI from "@/lib/abi/BondVault.json";

interface BondInfoProps {
  tradeId: `0x${string}`;
  party: `0x${string}`;
  dealValue: bigint;
}

export function BondInfo({ tradeId, party, dealValue }: BondInfoProps) {
  const { data: bondData } = useReadContract({
    address: CONTRACTS.bondVault as `0x${string}`,
    abi: BondVaultABI,
    functionName: "bonds",
    args: [tradeId, party],
  });

  const amount = bondData ? (bondData as unknown[])[0] as bigint : 0n;
  const stage = bondData ? Number((bondData as unknown[])[1]) as BondStage : BondStage.None;
  const slashed = bondData ? (bondData as unknown[])[2] as boolean : false;

  const stages = [BondStage.Discovery, BondStage.Negotiation, BondStage.Execution];
  const currentIndex = stages.indexOf(stage);

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold mb-3">Bond Status</h3>

      {/* Progress bar */}
      <div className="flex gap-1 mb-3">
        {stages.map((s, i) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${
              i <= currentIndex
                ? slashed
                  ? "bg-red-500"
                  : "bg-emerald-500"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Stage</span>
          <span className="font-medium">{BOND_STAGE_LABELS[stage]}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Locked</span>
          <span className="font-medium">
            ${Number(formatUnits(amount, USDC_DECIMALS)).toLocaleString()}
          </span>
        </div>
        {slashed && (
          <div className="text-red-600 text-xs font-medium mt-1">
            Bond slashed
          </div>
        )}
      </div>
    </div>
  );
}
