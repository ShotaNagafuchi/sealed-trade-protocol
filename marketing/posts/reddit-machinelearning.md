# r/MachineLearning

**Sub norms:** strict. Posts must be flaired correctly. `[R]` for
research / paper. `[P]` for project. `[D]` for discussion. Anything
that looks like a launch / promotion gets removed by mods. Karma
threshold may apply.

**Bitcoin framing:** absent. Academic sub. Reads as crank.

**Flair:** `[R]` (we have a paper) is the right tag.

**Timing:** Tuesday or Wednesday, weekdays 09:00–14:00 ET. Avoid
conference weeks (NeurIPS, ICML, ICLR).

---

## Title (≤300 chars; aim for ~120)

Primary:

```
[R] Information double-use in bilateral negotiation between LLM agents:
a TEE-isolated protocol and reference settlement layer
```

Alternates:

```
[R] Sealing the negotiation channel between two LLM agents: a hardware-isolation
approach to the information double-use problem in bilateral trade

[R] When two agents negotiate, both leak — a TEE-confined A2A protocol for
bilateral trade with on-chain bonded settlement
```

Prefer the primary. It names the problem ("information double-use"),
the method (TEE), and the artifact (protocol + reference impl) in
one line.

---

## Body

> **Paper.** [link to PAPER.md or arXiv preprint]
> **Code.** [github link] · Apache-2.0
>
> ### Problem
>
> In bilateral trade — IP licensing, M&A, private real estate —
> private valuations must be partially communicated to reach an
> agreement (Myerson & Satterthwaite, 1983 [1]). The same
> communication is then exploited by the counterparty to extract
> surplus. We call this *information double-use*: information
> shared to reach a deal is reused to worsen its terms.
>
> When the negotiators are LLM agents acting on behalf of human
> principals, the problem intensifies. Models post-trained for
> cooperative dialogue tend to surface intermediate reasoning that
> a strategic human would suppress. Per-message information leakage
> rises, even when the final commit is bounded by structured
> output.
>
> ### Approach
>
> We confine the agent-to-agent negotiation to a hardware-isolated
> enclave (Intel TDX, AMD SEV-SNP). Each agent is bound by
> cryptographically signed parameters from its principal — an
> upper bound on the commitments it can make. Inter-agent messages
> are A2A-protocol-shaped [2] but never leave the enclave. Only
> the final outcome — agreement or no-deal — is published, and
> enclave memory is destroyed on termination.
>
> We do **not** circumvent Myerson–Satterthwaite. The strategic
> tension simply relocates from negotiation-time to parameter-
> setting-time. A principal who signs a maximum below their true
> reserve is shading their parameters, just as a negotiator might
> shade an opening offer. The claim is narrower: the protocol
> reduces leakage *during the negotiation process itself*, where
> intermediate offers, response timing, and concession patterns
> ordinarily produce extractable signal.
>
> ### Comparison vs. alternative confidentiality roots
>
> | Approach           | Confidentiality root            | Open-ended LLM negotiation? | Interactive latency? | Attestability of model identity? |
> |--------------------|----------------------------------|----------------------------:|--------------------:|--------------------------------:|
> | MPC [3]            | Mathematical (information-theoretic / cryptographic) | No — requires fixed circuit |       No (for LLMs) |                              No |
> | FHE [4]            | Mathematical (LWE)               |              Yes in principle |       No (orders of magnitude too slow) |                              No |
> | ZKP                | Mathematical                     | Verifies correctness, not content |   N/A |                              No |
> | Trusted broker     | Institutional                    |                          Yes |                 Yes |                              No |
> | **TEE (this work)**| Hardware + supply chain          |                          Yes |                 Yes |  Yes, via remote attestation    |
>
> The honest read: TEE swaps mathematical-hardness assumptions for
> hardware-vendor and supply-chain trust. Foreshadow, ÆPIC Leak,
> and CacheOut are acknowledged in §5.1 of the paper. The protocol
> bounds the *economic* consequence of breach via an insurance pool
> funded by fees and slashed bonds — that is a bound on damage, not
> a prevention of breach.
>
> ### Most-comparable recent work
>
> *Omega* (Yang et al., arXiv 2605.03213) [5] is the closest
> system in the literature: a confidential agent runtime on
> AMD SEV-SNP + NVIDIA CC, with attestation-gated tool calls and a
> declarative policy language at the TEE boundary. We see the work
> as complementary: Omega secures intra-agent execution and tool
> invocation; this protocol focuses on the inter-agent negotiation
> channel and the on-chain settlement substrate. The two could
> compose.
>
> Dark pool prior work (Renegade [6], Penumbra [7]) addresses
> information leakage for fungible-asset swaps; bilateral trade
> involves non-fungible, multi-attribute negotiation that price-
> matching doesn't capture.
>
> ### What is in the released repo
>
> - **Settlement layer.** Solidity contracts: trade-lifecycle
>   state machine, 3-stage bonded escrow, fee + insurance-pool
>   accounting, EIP-712 typed signatures with s-malleability
>   protection. 51 unit tests passing, full-lifecycle Anvil demo.
> - **Economic model.** Python simulation of the bond schedule
>   and fee math with unit tests.
> - **Paper.** EN + JA, ~14 pages each, with the full related-work
>   review and limitations section.
>
> ### What is in active development, not in this commit
>
> - The TEE-confined agent runtime — the negotiator process itself
>   and the attestation verification path. We chose to publish the
>   design + settlement substrate first to get the protocol design
>   reviewed before building the runtime against an unreviewed
>   spec. The substrate exposes the plug-in points the runtime
>   will use (signed parameters, attestation hash slot, state
>   transition gates).
>
> ### Feedback we are actively soliciting
>
> 1. **Layer 1 / Layer 2 decomposition (§1.2, §2.2).** The
>    protocol targets *Layer 2* (negotiation leakage), explicitly
>    not *Layer 1* (discovery leakage) or *Layer 3* (post-
>    settlement persistence). Is this decomposition defensible, or
>    are there leakage channels we've mis-partitioned?
> 2. **Action-space enforcement.** Signed parameters bound the
>    *commitment power* of the agent but not its *reasoning trace*.
>    What is the minimum mechanism — logit masking, constrained
>    decoding, structured-output-only, function-call-only — that
>    would meaningfully reduce the reasoning-trace channel?
> 3. **Attestation of model identity, not just enclave identity.**
>    Has anyone here actually shipped a workflow where the
>    counterparty verifies the deployed model's weight hash via
>    the enclave attestation? We discuss this as future work in §6
>    but want pointers to existing implementations.
> 4. **Equilibrium analysis under parameter shading.** Once the
>    strategic tension moves to parameter-setting, the equilibrium
>    of the two-stage game (sign parameters → run sealed
>    negotiation) is the right object to study. We have informal
>    arguments only — pointers to formal work appreciated.
>
> ### References (paper §References)
>
> [1] Myerson & Satterthwaite, JET 1983.
> [2] A2A Protocol, Linux Foundation, 2025.
> [3] Goldreich, Micali & Wigderson, STOC 1987.
> [4] Gentry, STOC 2009.
> [5] Yang et al., *Omega*, arXiv 2605.03213.
> [6] Renegade, "On-Chain Dark Pool," 2023.
> [7] Penumbra Labs, "A Private DEX and Shielded Pool," 2023.

---

## Anticipated comments & pre-prepared replies

**"This is just MPC dressed up as TEE."**

> The fundamental difference is the computation model. MPC
> requires the function to be expressible as a circuit known to
> both parties in advance, and open-ended natural-language
> negotiation between two LLMs is not a circuit you can specify
> ahead of time. TEE accepts a strictly weaker confidentiality
> root (hardware trust) in exchange for arbitrary-computation
> support. Both are defensible engineering tradeoffs; they're not
> the same thing.

**"You haven't solved the impossibility result."**

> Explicit, repeatedly, in §1, §1.2, §6. We are not. The claim is
> that *negotiation-time* leakage of intermediate signals
> (concession timing, anchoring, response latency, partial offer
> dynamics) is the leakage class that experienced negotiators
> exploit most heavily, and that this class is the one the
> protocol seals — at the cost of moving the strategic surface to
> the parameter-setting stage, where the impossibility applies
> with the same force.

**"Why is the settlement on-chain at all?"**

> Because agent-to-agent settlement needs a programmable,
> permissionless rail with sub-second finality and atomic bundle
> semantics (deal value + bond release in one transaction).
> Traditional payment systems require human approval and don't
> give you atomic settlement. We acknowledge the choice introduces
> on-chain leakage (bond size reveals deal scale, §6) and treat
> that as a residual leakage channel, not a solved problem.

**"Why publish before the runtime is built?"**

> Because the protocol design is the artifact that benefits most
> from being reviewed early. The settlement substrate exists,
> works, and exposes the plug-in points the runtime will need.
> Building the runtime against an unreviewed spec is the higher-
> risk ordering.

**"Hardware-vendor trust is fundamentally weaker than mathematical hardness."**

> Yes. The paper says this in §3.3 and §5.1. We argue the relevant
> alternative for *this specific problem* (open-ended LLM-to-LLM
> negotiation at interactive latency) is not MPC or FHE — those
> don't apply — but a *trusted broker*, which is strictly worse
> on the confidentiality axis because the broker becomes the leak.
> Conditional on accepting that frame, hardware trust is a
> meaningful improvement; outside that frame it's a step back.

---

## What NOT to write

- ❌ Anything that reads as a launch announcement
- ❌ Bitcoin reference (instant credibility kill on this sub)
- ❌ Token / chain framing as the lead
- ❌ Performance claims unsupported by measurement
- ❌ "Revolutionary" / "first-ever" / "next-generation"
- ❌ Excessive formatting (no emojis, minimal bold)
