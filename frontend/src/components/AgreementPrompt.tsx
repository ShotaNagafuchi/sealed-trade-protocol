"use client";

import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSignTypedData,
} from "wagmi";
import { parseUnits, keccak256, toBytes } from "viem";
import type { AgreementResult } from "@/lib/negotiation";
import type { Trade } from "@/hooks/useTrade";
import { CONTRACTS, ACTIVE_CHAIN } from "@/lib/config";
import { USDC_DECIMALS } from "@/lib/constants";
import SealedTradeABI from "@/lib/abi/SealedTrade.json";

interface AgreementPromptProps {
  agreement: AgreementResult;
  trade: Trade;
  onSuccess: () => void;
}

export function AgreementPrompt({
  agreement,
  trade,
  onSuccess,
}: AgreementPromptProps) {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const [signed, setSigned] = useState(false);

  const isBuyer = address?.toLowerCase() === trade.buyer.toLowerCase();
  const sealedTradeAddr = CONTRACTS.sealedTrade as `0x${string}`;
  const storageKey = `sig-${trade.tradeId}`;

  if (isSuccess) {
    setTimeout(onSuccess, 1000);
  }

  const handleSign = async () => {
    const finalDealValue = parseUnits(
      agreement.finalPrice.toString(),
      USDC_DECIMALS
    );
    const termsHash = keccak256(toBytes(agreement.terms));

    const signature = await signTypedDataAsync({
      domain: {
        name: "SealedTrade",
        version: "1",
        chainId: ACTIVE_CHAIN.id,
        verifyingContract: sealedTradeAddr,
      },
      types: {
        Agreement: [
          { name: "tradeId", type: "bytes32" },
          { name: "finalDealValue", type: "uint256" },
          { name: "termsHash", type: "bytes32" },
        ],
      },
      primaryType: "Agreement",
      message: {
        tradeId: trade.tradeId,
        finalDealValue,
        termsHash,
      },
    });

    const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
    stored[isBuyer ? "buyerSig" : "sellerSig"] = signature;
    stored.finalDealValue = finalDealValue.toString();
    stored.termsHash = termsHash;
    stored.terms = agreement.terms;
    localStorage.setItem(storageKey, JSON.stringify(stored));
    setSigned(true);
  };

  const handleSubmit = () => {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (!stored.buyerSig || !stored.sellerSig) {
      alert(
        "Both signatures are needed. The counterparty must also sign."
      );
      return;
    }

    writeContract({
      address: sealedTradeAddr,
      abi: SealedTradeABI,
      functionName: "commitAgreement",
      args: [
        trade.tradeId,
        BigInt(stored.finalDealValue),
        stored.termsHash as `0x${string}`,
        keccak256(toBytes("agent-negotiation-attestation")),
        stored.buyerSig as `0x${string}`,
        stored.sellerSig as `0x${string}`,
      ],
    });
  };

  const stored =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem(storageKey) || "{}")
      : {};

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4">
        <h3 className="font-semibold text-emerald-800 mb-2">
          Agreement Reached
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-emerald-600">Agreed Price</span>
            <div className="text-xl font-bold text-emerald-900">
              ${agreement.finalPrice.toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-emerald-600">Terms</span>
            <div className="text-emerald-900 font-medium">
              {agreement.terms}
            </div>
          </div>
        </div>
        <p className="text-xs text-emerald-600 mt-3">
          Negotiated in {agreement.messages.length} messages
        </p>
      </div>

      <div className="flex gap-2">
        {!signed ? (
          <button onClick={handleSign} className="btn-primary flex-1">
            Sign Agreement
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isPending || isConfirming}
            className="btn-primary flex-1"
          >
            {isPending
              ? "Confirming..."
              : isConfirming
                ? "Submitting..."
                : "Submit Agreement"}
          </button>
        )}
      </div>

      <div className="text-xs text-gray-400 space-y-0.5">
        <div>Buyer sig: {stored.buyerSig ? "Ready" : "Pending"}</div>
        <div>Seller sig: {stored.sellerSig ? "Ready" : "Pending"}</div>
      </div>
    </div>
  );
}
