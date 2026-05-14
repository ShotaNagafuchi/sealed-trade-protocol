"use client";

import { useState } from "react";
import type { AgentConfig } from "@/lib/negotiation";

interface AgentConfigPanelProps {
  role: "seller" | "buyer";
  maxDealValue: number;
  onStart: (apiKey: string, config: AgentConfig) => void;
}

const SAMPLE_SELLER: AgentConfig = {
  role: "seller",
  minPrice: 7000,
  preferredTerms: "non-exclusive, worldwide, 5 years",
  priorities: ["price", "term length"],
  constraints: ["minimum 5000 USD", "no exclusive deals"],
};

const SAMPLE_BUYER: AgentConfig = {
  role: "buyer",
  maxPrice: 9000,
  preferredTerms: "exclusive, US only, 3 years",
  priorities: ["exclusivity", "price"],
  constraints: ["maximum 10000 USD"],
};

export function AgentConfigPanel({
  role,
  maxDealValue,
  onStart,
}: AgentConfigPanelProps) {
  const [apiKey, setApiKey] = useState(
    () => (typeof window !== "undefined" ? sessionStorage.getItem("claude-api-key") : "") ?? ""
  );
  const [configText, setConfigText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sample = role === "seller" ? SAMPLE_SELLER : SAMPLE_BUYER;

  const handleLoadSample = () => {
    setConfigText(JSON.stringify(sample, null, 2));
  };

  const handleStart = () => {
    setError(null);

    if (!apiKey.trim()) {
      setError("Claude API key is required");
      return;
    }

    let config: AgentConfig;
    try {
      config = JSON.parse(configText);
    } catch {
      setError("Invalid JSON. Check the format and try again.");
      return;
    }

    config.role = role;

    // Save API key to localStorage
    sessionStorage.setItem("claude-api-key", apiKey);

    onStart(apiKey, config);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">AI Agent Negotiation</h3>
      <p className="text-sm text-gray-500">
        Configure your AI agent to negotiate on your behalf. You are the{" "}
        <span className="font-medium text-gray-700">{role}</span>.
      </p>

      <div>
        <label className="label">Claude API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          className="input"
        />
        <p className="text-xs text-gray-400 mt-1">
          Your key is stored locally and sent per-request only. Never stored on the server.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label mb-0">Agent Configuration (JSON)</label>
          <button
            onClick={handleLoadSample}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Load sample
          </button>
        </div>
        <textarea
          value={configText}
          onChange={(e) => setConfigText(e.target.value)}
          rows={8}
          className="input font-mono text-xs"
          placeholder={JSON.stringify(sample, null, 2)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        onClick={handleStart}
        disabled={!apiKey.trim() || !configText.trim()}
        className="btn-primary w-full"
      >
        Start Agent
      </button>
    </div>
  );
}
