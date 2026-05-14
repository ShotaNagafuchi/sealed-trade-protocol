"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSignTypedData,
  useReadContract,
} from "wagmi";
import { parseUnits, keccak256, toBytes, encodePacked, formatUnits } from "viem";
import { Trade } from "@/hooks/useTrade";
import { CONTRACTS, ACTIVE_CHAIN } from "@/lib/config";
import { TradeState, USDC_DECIMALS, BondStage } from "@/lib/constants";
import { useNegotiation } from "@/hooks/useNegotiation";
import { AgentConfigPanel } from "./AgentConfigPanel";
import { NegotiationChat } from "./NegotiationChat";
import { AgreementPrompt } from "./AgreementPrompt";
import { loadAgentSetup, saveAgentSetup } from "@/lib/agentStorage";
import SealedTradeABI from "@/lib/abi/SealedTrade.json";
import BondVaultABI from "@/lib/abi/BondVault.json";
import MockUSDCABI from "@/lib/abi/MockUSDC.json";

interface ActionPanelProps {
  trade: Trade;
  onSuccess: () => void;
}

export function ActionPanel({ trade, onSuccess }: ActionPanelProps) {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const { signTypedDataAsync } = useSignTypedData();

  const [finalValue, setFinalValue] = useState("");
  const [terms, setTerms] = useState("");
  const [negotiationMode, setNegotiationMode] = useState<"manual" | "agent">("agent");

  const negotiation = useNegotiation({
    tradeId: trade.tradeId,
    maxDealValue: Number(formatUnits(trade.maxDealValue, USDC_DECIMALS)),
    deadline: new Date(Number(trade.deadline) * 1000).toISOString(),
  });

  const isSeller = address?.toLowerCase() === trade.seller.toLowerCase();
  const isBuyer = address?.toLowerCase() === trade.buyer.toLowerCase();
  const isParty = isSeller || isBuyer;
  const busy = isPending || isConfirming;

  // Refresh parent after confirmation
  if (isSuccess) {
    setTimeout(onSuccess, 1000);
  }

  const sealedTradeAddr = CONTRACTS.sealedTrade as `0x${string}`;
  const bondVaultAddr = CONTRACTS.bondVault as `0x${string}`;
  const usdcAddr = CONTRACTS.mockUsdc as `0x${string}`;

  const approve = (spender: `0x${string}`, amount: bigint) => {
    writeContract({
      address: usdcAddr,
      abi: MockUSDCABI,
      functionName: "approve",
      args: [spender, amount],
    });
  };

  // --- Listed: buyer can express interest + configure agent ---
  if (trade.state === TradeState.Listed && !isSeller) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <h3 className="font-semibold">Express Interest</h3>
          <p className="text-sm text-gray-500">
            Post a discovery bond (1% of deal value) to signal interest.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => approve(bondVaultAddr, trade.maxDealValue)}
              disabled={busy}
              className="btn-secondary"
            >
              1. Approve USDC
            </button>
            <button
              onClick={() =>
                writeContract({
                  address: sealedTradeAddr,
                  abi: SealedTradeABI,
                  functionName: "expressInterest",
                  args: [trade.tradeId],
                })
              }
              disabled={busy}
              className="btn-primary"
            >
              2. Express Interest
            </button>
          </div>
        </div>

        {/* Pre-configure buyer agent */}
        <div className="border-t border-gray-200 pt-4">
          <AgentConfigPanel
            role="buyer"
            maxDealValue={Number(formatUnits(trade.maxDealValue, USDC_DECIMALS))}
            mode="save"
            compact
            onSave={(apiKey, config) =>
              saveAgentSetup(trade.tradeId, "buyer", apiKey, config)
            }
          />
        </div>
      </div>
    );
  }

  // --- Matched: either party begins negotiation ---
  if (trade.state === TradeState.Matched && isParty) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold">Begin Negotiation</h3>
        <p className="text-sm text-gray-500">
          Escalate bonds to 3% and start sealed negotiation inside TEE.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => approve(bondVaultAddr, trade.maxDealValue)}
            disabled={busy}
            className="btn-secondary"
          >
            1. Approve USDC
          </button>
          <button
            onClick={() =>
              writeContract({
                address: sealedTradeAddr,
                abi: SealedTradeABI,
                functionName: "beginNegotiation",
                args: [
                  trade.tradeId,
                  keccak256(toBytes("demo-attestation")),
                ],
              })
            }
            disabled={busy}
            className="btn-primary"
          >
            2. Begin Negotiation
          </button>
        </div>
      </div>
    );
  }

  // --- Negotiating: auto-start agent if pre-configured ---
  const myRole = isSeller ? "seller" as const : "buyer" as const;
  const autoStartKey = `agent-autostarted-${trade.tradeId}-${myRole}`;

  useEffect(() => {
    if (
      trade.state === TradeState.Negotiating &&
      isParty &&
      negotiation.status === "idle"
    ) {
      // Check persistent flag to prevent duplicate auto-starts across refreshes
      if (typeof window !== "undefined" && sessionStorage.getItem(autoStartKey)) return;

      const setup = loadAgentSetup(trade.tradeId, myRole);
      if (setup) {
        sessionStorage.setItem(autoStartKey, "1");
        negotiation.startNegotiation(setup.apiKey, setup.config);
      }
    }
  }, [trade.state, isParty, negotiation.status, trade.tradeId, myRole, autoStartKey]);

  if (trade.state === TradeState.Negotiating && isParty) {
    const storageKey = `sig-${trade.tradeId}`;

    const handleSign = async () => {
      if (!finalValue || !terms) return;

      const finalDealValue = parseUnits(finalValue, USDC_DECIMALS);
      const termsHash = keccak256(toBytes(terms));

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
      stored.terms = terms;
      localStorage.setItem(storageKey, JSON.stringify(stored));
      alert("Signature saved. Share this trade URL with your counterparty.");
    };

    const handleSubmit = () => {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (!stored.buyerSig || !stored.sellerSig) {
        alert("Both buyer and seller signatures are needed. Share the trade URL.");
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
          keccak256(toBytes("demo-attestation-final")),
          stored.buyerSig as `0x${string}`,
          stored.sellerSig as `0x${string}`,
        ],
      });
    };

    const stored = JSON.parse(
      typeof window !== "undefined"
        ? localStorage.getItem(storageKey) || "{}"
        : "{}"
    );

    return (
      <div className="space-y-4">
        {/* Mode tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setNegotiationMode("agent")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              negotiationMode === "agent"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            AI Agent
          </button>
          <button
            onClick={() => setNegotiationMode("manual")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              negotiationMode === "manual"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Manual
          </button>
        </div>

        {negotiationMode === "agent" ? (
          <div className="space-y-4">
            {negotiation.status === "idle" && (
              <AgentConfigPanel
                role={myRole}
                maxDealValue={Number(formatUnits(trade.maxDealValue, USDC_DECIMALS))}
                onStart={(apiKey, config) =>
                  negotiation.startNegotiation(apiKey, config)
                }
              />
            )}

            {negotiation.status === "running" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Negotiation in Progress</h3>
                  <button
                    onClick={negotiation.stopNegotiation}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Stop
                  </button>
                </div>
                <NegotiationChat
                  messages={negotiation.messages}
                  currentRole={myRole}
                  isThinking={negotiation.isThinking}
                />
              </div>
            )}

            {negotiation.status === "agreed" && negotiation.agreement && (
              <AgreementPrompt
                agreement={negotiation.agreement}
                trade={trade}
                onSuccess={onSuccess}
              />
            )}

            {negotiation.status === "failed" && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700 font-medium">
                  Negotiation failed
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {negotiation.error}
                </p>
                <button
                  onClick={() => {
                    sessionStorage.removeItem(autoStartKey);
                    negotiation.stopNegotiation();
                  }}
                  className="btn-secondary mt-3"
                >
                  Try Again
                </button>
              </div>
            )}

            {negotiation.status === "timeout" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-700 font-medium">
                  Negotiation timed out
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Maximum rounds reached without agreement.
                </p>
                <button
                  onClick={() => {
                    sessionStorage.removeItem(autoStartKey);
                    negotiation.stopNegotiation();
                  }}
                  className="btn-secondary mt-3"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Manual mode — existing UI */
          <div className="space-y-3">
            <h3 className="font-semibold">Commit Agreement</h3>
            <p className="text-sm text-gray-500">
              Both parties must sign. Bonds escalate to 10%.
            </p>
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Final deal value (USD)"
                value={finalValue || stored.finalDealValue ? formatUnits(BigInt(stored.finalDealValue || "0"), USDC_DECIMALS) : ""}
                onChange={(e) => setFinalValue(e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Terms (e.g., non-exclusive, 5 years)"
                value={terms || stored.terms || ""}
                onChange={(e) => setTerms(e.target.value)}
                className="input"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => approve(bondVaultAddr, trade.maxDealValue)}
                disabled={busy}
                className="btn-secondary"
              >
                Approve
              </button>
              <button onClick={handleSign} className="btn-secondary">
                Sign Agreement
              </button>
              <button
                onClick={handleSubmit}
                disabled={busy}
                className="btn-primary"
              >
                Submit (Both Sigs)
              </button>
            </div>
            <div className="text-xs text-gray-400 space-y-0.5">
              <div>Buyer sig: {stored.buyerSig ? "Ready" : "Pending"}</div>
              <div>Seller sig: {stored.sellerSig ? "Ready" : "Pending"}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Agreed: settle ---
  if (trade.state === TradeState.Agreed && isParty) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold">Settle Trade</h3>
        <p className="text-sm text-gray-500">
          Transfer {formatUnits(trade.finalDealValue, USDC_DECIMALS)} USDC from
          buyer to seller (minus 0.3% fee). Bonds are released.
        </p>
        <div className="flex gap-2">
          {isBuyer && (
            <button
              onClick={() =>
                approve(sealedTradeAddr, trade.finalDealValue * 2n)
              }
              disabled={busy}
              className="btn-secondary"
            >
              Approve USDC
            </button>
          )}
          <button
            onClick={() =>
              writeContract({
                address: sealedTradeAddr,
                abi: SealedTradeABI,
                functionName: "settle",
                args: [trade.tradeId],
              })
            }
            disabled={busy}
            className="btn-primary"
          >
            Settle
          </button>
        </div>
      </div>
    );
  }

  // --- Cancel (pre-Agreed) ---
  if (
    trade.state < TradeState.Agreed &&
    trade.state !== TradeState.Listed &&
    isParty
  ) {
    return (
      <div className="space-y-3">
        <button
          onClick={() =>
            writeContract({
              address: sealedTradeAddr,
              abi: SealedTradeABI,
              functionName: "cancel",
              args: [trade.tradeId],
            })
          }
          disabled={busy}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Cancel Trade
        </button>
        {trade.state === TradeState.Negotiating && (
          <p className="text-xs text-red-500">
            Warning: Cancelling during negotiation will slash your bond (50%).
          </p>
        )}
      </div>
    );
  }

  // Settled or Cancelled — no actions
  if (trade.state >= TradeState.Settled) {
    return (
      <div className="text-sm text-gray-500">
        This trade is {trade.state === TradeState.Settled ? "settled" : "cancelled"}.
      </div>
    );
  }

  return null;
}
