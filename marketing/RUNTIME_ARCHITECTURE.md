# Runtime architecture note — API vs confidential inference

Internal note. Not for public release. Captures the architectural
decision pending around the agent runtime's inference backend, and
its consequences for the protocol's confidentiality property and
the launch messaging.

Date: 2026-05-14.
Status: **open** — production target decided, prototype/dev path
not finalized.

---

## The problem

Current prototype runs the agent logic inside a TEE but calls
**Anthropic's API** for the actual LLM inference. This breaks the
confidentiality property the paper claims.

```
[TEE: orchestration, signed parameters, message routing]
     │
     ├─→ Claude API call ──→ [Anthropic servers, NOT in TEE]
     │                              │
     │                              ▼
     │                       Anthropic observes the negotiation
     │                              │
     └─── response ←────────────────┘
```

The TEE protects: the agent's policy code, the principal's signed
parameters, the message routing between the two agents.

The TEE does **not** protect: the actual content of the
negotiation, because that content is in the prompt sent to
Anthropic, and the response is generated on Anthropic's
infrastructure.

This is the same failure class the paper's comparison table
attributes to *trusted broker* — the broker becomes the leak. The
protocol must run inference inside an attestable enclave for the
confidentiality claim to hold.

PAPER.md §3.5: "Each agent is a language model running inside the
enclave." Anthropic-API-from-inside-the-enclave does not satisfy
this.

## Options in 2026

### Option A — Confidential GPU inference (production path)

- **Provider:** Phala Cloud (NVIDIA H100 / H200 in CC mode).
  OpenAI-compatible API. ~99% of native GPU performance.
- **Models supported:** Llama 3.x, Qwen 3, DeepSeek V3, GPT-OSS,
  and other open-weights families.
- **Attestation:** each inference produces a signed NVIDIA NRAS
  report verifying GPU identity + workload integrity. Composes
  with the CPU TEE (TDX / SEV-SNP) attestation to form a full
  CPU→GPU trust chain. Both go into the `attestationHash` slot
  the SealedTrade contract already exposes.
- **Model identity attestation:** weight-hash attestable. The
  counterparty can verify "you ran Llama-3.3-70B with hash X" not
  just "you ran in an enclave."
- **Confidentiality property:** holds.

### Option B — CPU-only TEE (small-model prototype)

- 7B–13B open-weights model loaded directly into Intel TDX or
  AMD SEV-SNP.
- No GPU acceleration in pure CPU TEE — latency in the
  10–30 tok/s range for 7B; usable for demos, marginal for
  real-time negotiation.
- Useful as a low-cost prototype path before GPU CC budget is
  available.
- **Confidentiality property:** holds (but performance ceiling
  is real).

### Option C — Anthropic API (current implementation)

- No confidential inference tier offered as of May 2026.
- Bedrock-routed Claude is not in confidential mode by default.
- Useful for iterating on agent prompting / negotiation logic
  without hardware setup.
- **Confidentiality property:** does NOT hold. Must be labeled
  `DEMO_MODE` everywhere the runtime surfaces it.

## A2A platform reality (not for us to invent)

A2A is an existing open standard, not a green field:

- **Spec:** JSON-RPC 2.0 over HTTPS, Agent Cards, SSE streaming.
- **Governance:** Linux Foundation, contributed by Google in
  2025, 150+ supporting organizations as of April 2026.
- **SDKs:** Python, Go, Java, TypeScript, .NET (Google ADK 1.0
  GA + community implementations).
- **Native A2A in:** LangGraph, CrewAI, LlamaIndex Agents,
  Semantic Kernel, AutoGen.
- **Production deployments:** Salesforce Agentforce, ServiceNow
  Now Assist, Vertex AI Agent Builder.
- **Academic:** AgentMaster (Stanford / George Mason) combines
  A2A + MCP.

**Implication for Sealed Trade.** We do not invent A2A. We do not
propose a new wire format. Inter-agent messages use the standard
A2A spec (most likely via Google ADK as the reference
implementation, or a thin direct JSON-RPC wrapper).

The contribution is one sentence: *we run the standard A2A
protocol entirely inside a confidential enclave, so A2A messages
between two agents never become observable to either party's
infrastructure.* That's it. Everything else is the existing A2A
standard.

This is a stronger position than "we built a new agent protocol."
Standards-compliance plus a confidentiality property is a cleaner
pitch than novelty plus complexity.

## Recommended architecture

```
PRODUCTION RUNTIME
  Messaging:    A2A spec (Google ADK or thin JSON-RPC wrapper)
  Inference:    Phala Cloud H200 GPU TEE (Option A)
  Model:        open-weights, weight-hash attestable
                — Llama 3.x / Qwen 3 / DeepSeek V3
  Attestation:  NVIDIA NRAS (GPU) + TDX or SEV-SNP (CPU)
                → both hashes recorded in the contract's
                  attestationHash slot
  Property:     confidentiality holds

DEVELOPMENT / DEMO RUNTIME
  Messaging:    same A2A spec
  Inference:    Anthropic API (Option C)
  Mode flag:    DEMO_MODE = true, surfaced in CLI banner +
                README + any UI
  Property:     confidentiality DOES NOT hold — for logic
                iteration only
```

## Open decision

Three viable paths for the immediate next step. Pick one:

1. **Migrate to Option A directly.** Use Phala Cloud for the
   first end-to-end agent runtime in the repo. Skip Option B
   entirely. Higher upfront cost (GPU CC pricing, integration
   work), but no rework later.
2. **Prototype with Option B first.** Build a working agent
   runtime against a CPU TEE with a 7–13B model, get the
   confidentiality story end-to-end demonstrable, then upgrade
   to Option A for performance. Slower to demo at scale but
   keeps the dev loop tight and avoids vendor lock-in early.
3. **Keep Option C as DEMO_MODE permanently** as a public-facing
   dev mode, and ship Option A as the production mode. Two code
   paths to maintain but explicit about the tradeoff.

Lean: **Option 3.** It matches how a lot of confidential-AI
projects actually ship — a dev mode that works on commodity APIs
for iteration, a production mode that uses TEE-attested inference
for actual confidentiality, with the mode flag impossible to hide
from users. Costs little in dev time, lets people try the demo
without GPU TEE budget, and makes the "confidentiality holds only
in production mode" property loud rather than hidden.

## Consequences for marketing drafts

If we adopt Option 3 (or anything that includes Option A as the
production target), every public draft should:

1. **State the A2A standards posture explicitly.** Something
   like: *"Uses the A2A protocol standard (Linux Foundation,
   2025) for inter-agent messaging. We don't invent the wire
   format — our contribution is running it inside a confidential
   enclave."*
2. **Name the confidential inference path concretely.**
   *"Production runtime uses NVIDIA H100/H200 in confidential
   computing mode (e.g., Phala Cloud) with weight-hash-attestable
   open-weights models. A development mode using Anthropic API is
   available for iteration but does not satisfy the
   confidentiality property and is labeled DEMO_MODE."*
3. **Drop any phrasing that implies "Claude inside a TEE"
   satisfies the protocol.** It doesn't. The honest framing is
   "open-weights models inside a TEE; API mode is a dev tool."
4. **In r/LocalLLaMA specifically, the model-choice discussion
   becomes concrete.** Llama 3.x for reasoning at moderate
   latency, Qwen 3 for multilingual including JA, DeepSeek V3
   for the higher-end reasoning ceiling. Each is weight-hash
   attestable and runs in H200 CC mode.

Marketing drafts to update once the decision is locked:

- `posts/hackernews.md` — add a one-line "A2A standard + Phala-class
  confidential inference" in the body.
- `posts/reddit-machinelearning.md` — add the inference-backend
  paragraph to the "what is in the released repo" section.
- `posts/reddit-localllama.md` — answer the model-choice question
  with concrete names; mention Phala Cloud / NVIDIA NRAS.
- `posts/reddit-ai-agents.md` — clarify "we use standard A2A,
  not a new protocol."
- `posts/x-thread.md` — tweet 6 currently says "Put both agents
  into the same hardware-isolated enclave (Intel TDX, AMD
  SEV-SNP)." Add GPU CC: "+ NVIDIA H100/H200 in CC mode for the
  inference workload."

The paper (PAPER.md / PAPER_ja.md) also probably needs a small
update in §3.5 to reflect this — open-weights models in
GPU TEE, with API mode as an explicit dev-only configuration
rather than the implicit assumption.

## Action items if Option 3 is chosen

1. Add `DEMO_MODE` flag to the runtime prototype, surface it in
   all UX surfaces.
2. Scope Phala Cloud account + a minimum end-to-end run on H200
   CC mode with one open-weights model.
3. Update PAPER.md §3.5 to name the inference architecture
   explicitly (open-weights in GPU TEE; API as a labeled dev
   mode).
4. Update the five marketing drafts listed above.
5. Add a `RUNTIME_README.md` (or section in the main README) once
   the runtime is in the repo, explaining the DEMO vs production
   mode distinction in the README's setup section, not buried.
