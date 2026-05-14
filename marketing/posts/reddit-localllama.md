# r/LocalLLaMA

**Sub norms (May 2026):** ~686k members. Cares about: running
models locally, sovereignty over weights, small/efficient models,
real benchmarks, agent failure modes. Hates: API-only services,
hype, "we wrap GPT-4 in an agent." Will engage seriously with
TEE-as-isolation if the LLM is treated as a first-class component.

**Bitcoin framing:** absent.

**Timing:** Weekdays, 09:00–12:00 ET. Sub is global but US-leaning.

---

## Title

```
Putting two LLMs in a sealed enclave so they can negotiate without leaking your
terms (A2A protocol foundation, open source, paper inside)
```

Alternate:

```
LLM-in-TEE as a negotiator: paper + reference settlement layer for confidential
agent-to-agent commerce
```

---

## Body

> The May 2026 discourse on this sub has been heavily about agent
> failure modes when agents touch real systems — money, contracts,
> production data. One failure mode that doesn't get enough
> attention: when two agents negotiate on behalf of their
> principals, *both agents' contexts leak to the other side*. Every
> message is a signal. The agent that concedes faster has revealed
> a tighter constraint. The agent that holds out longer has
> revealed slack. This is just how negotiation works for humans too
> — but humans at least know what they're giving up. An LLM agent
> trained on cooperation will reveal almost anything if asked
> politely.
>
> The protocol we're describing tries to address this at the
> infrastructure level rather than at the prompt level:
>
> - Both agents run inside a hardware enclave (TDX or SEV-SNP).
>   Neither agent's context ever exits the enclave.
> - Each principal signs a parameter set — min/max price, hard
>   terms — that bounds the agent's action space. The agent can
>   only commit to an outcome inside its principal's signed
>   envelope.
> - Inter-agent messages are A2A-protocol-compatible, but the
>   transport is internal to the enclave. The outside world sees
>   only the final agree/no-deal outcome.
> - Memory is zeroed on enclave termination. There is no "what did
>   the buyer's agent say in round 3" log to subpoena later.
>
> **Why this might be of interest to r/LocalLLaMA in particular:**
>
> Most "agent commerce" stories assume the agent is a hosted API
> service. That puts the model vendor in the trust path for every
> trade. Confidential computing flips this: the model runs in an
> enclave you (or a neutral host) operate. You can run a local
> open-weights model — Llama, Qwen, DeepSeek, whatever — as your
> negotiator, and the counterparty can verify via remote
> attestation that you didn't swap in a tampered model after
> signing the parameters.
>
> **What's actually built right now:**
>
> - Solidity settlement layer (escrow + 3-stage bonds + insurance
>   pool). 51 tests passing.
> - Paper covering the design and the comparison vs. MPC / FHE /
>   ZKP / trusted broker.
> - Economic simulation in Python.
>
> **What's NOT built yet (be honest):**
>
> - The actual TEE agent runtime. This is the next milestone and
>   it's explicitly the harder half of the project. The smart
>   contract layer was built first to fix the settlement substrate
>   the runtime will plug into.
>
> Apache-2.0. Not audited, do not deploy real money.
>
> Specifically for this sub I'd love feedback on:
>
> 1. **Model choice for negotiation in TEE.** You want determinism
>    bounds, low context overhead, decent reasoning, and ideally
>    something you can attest the weights of. What would you run?
> 2. **Attestation flow for the model itself**, not just the
>    enclave. Has anyone here actually shipped a workflow where a
>    counterparty verifies the *model hash* via remote attestation?
> 3. **Action-space constraint mechanisms.** The signed-parameter
>    envelope is the contract between principal and agent. How
>    would you enforce this beyond a system prompt? Logit masking?
>    Constrained decoding? Function calls only?
>
> [paper link] · [repo link]

---

## Things to lean into on this sub

- ✅ Local / open-weights friendly framing
- ✅ Honest about what's built and what's not
- ✅ Technical questions back to the community
- ✅ Concrete agent failure mode discussion
- ✅ A2A as an existing standard, not something we invented

## Things to avoid

- ❌ "Revolutionary"
- ❌ Bitcoin comparison
- ❌ Anything that sounds like a token / chain pitch
- ❌ Vague "we're solving agent trust" abstractions
