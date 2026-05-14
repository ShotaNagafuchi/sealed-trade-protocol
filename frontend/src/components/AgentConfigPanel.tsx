"use client";

import { useState } from "react";
import type { AgentConfig } from "@/lib/negotiation";

interface AgentConfigPanelProps {
  role: "seller" | "buyer";
  maxDealValue: number;
  /** Called when user clicks "Start Agent" (negotiation mode) */
  onStart?: (apiKey: string, config: AgentConfig) => void;
  /** Called when user clicks "Save Config" (pre-config mode) */
  onSave?: (apiKey: string, config: AgentConfig) => void;
  /** Label for the action button */
  mode?: "start" | "save";
  /** Compact layout for embedding in forms */
  compact?: boolean;
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
  onSave,
  mode = "start",
  compact = false,
}: AgentConfigPanelProps) {
  const [apiKey, setApiKey] = useState(
    () =>
      (typeof window !== "undefined"
        ? sessionStorage.getItem("claude-api-key")
        : "") ?? ""
  );
  const [configText, setConfigText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const sample = role === "seller" ? SAMPLE_SELLER : SAMPLE_BUYER;

  const handleLoadSample = () => {
    const s = { ...sample };
    if (role === "seller") {
      s.minPrice = Math.round(maxDealValue * 0.7);
    } else {
      s.maxPrice = Math.round(maxDealValue * 0.9);
    }
    setConfigText(JSON.stringify(s, null, 2));
  };

  const handleAction = () => {
    setError(null);
    setSaved(false);

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
    sessionStorage.setItem("claude-api-key", apiKey);

    if (mode === "save" && onSave) {
      onSave(apiKey, config);
      setSaved(true);
    } else if (onStart) {
      onStart(apiKey, config);
    }
  };

  const buttonLabel =
    mode === "save" ? (saved ? "Saved" : "Save Agent Config") : "Start Agent";

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {!compact && (
        <>
          <h3 className="font-semibold">AI Agent Configuration</h3>
          <p className="text-sm text-gray-500">
            Configure your AI agent to negotiate on your behalf as{" "}
            <span className="font-medium text-gray-700">{role}</span>.
            {mode === "save" && " This will be used when negotiation begins."}
          </p>
        </>
      )}

      <div>
        <label className="label">Claude API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setSaved(false);
          }}
          placeholder="sk-ant-..."
          className="input"
        />
        <p className="text-xs text-gray-400 mt-1">
          Stored in your browser only. Never sent to our server.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label mb-0">
            Agent Config (JSON)
          </label>
          <button
            onClick={handleLoadSample}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Load sample
          </button>
        </div>
        <textarea
          value={configText}
          onChange={(e) => {
            setConfigText(e.target.value);
            setSaved(false);
          }}
          rows={compact ? 5 : 8}
          className="input font-mono text-xs"
          placeholder={JSON.stringify(sample, null, 2)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleAction}
        disabled={!apiKey.trim() || !configText.trim() || (mode === "save" && saved)}
        className={`${mode === "save" && saved ? "btn-secondary" : "btn-primary"} w-full`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
