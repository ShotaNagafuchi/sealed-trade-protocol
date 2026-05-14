# r/MachineLearning

**Sub norms:** strict. Posts must be flaired correctly. `[R]` for
research / paper. `[P]` for project. `[D]` for discussion. Anything
that looks like a launch / promotion gets removed by mods. Karma
threshold may apply.

**Bitcoin framing:** absent. Academic sub. Reads as crank.

**Flair:** `[R]` (we have a paper) is the right tag. `[P]` works
too if you want to lead with the implementation.

---

## Title

```
[R] Sealed Trade Protocol: confidential negotiation between LLM agents via TEE
isolation — addressing the information double-use problem in bilateral trade
```

Alternate (more academic):

```
[R] Information double-use in bilateral negotiation between language-model
agents: a hardware-isolated protocol and reference implementation
```

---

## Body

> **Paper:** [link to PAPER.md or arXiv]
> **Code:** [github link]
> **License:** Apache-2.0
>
> **Problem statement.** When two parties negotiate a bilateral
> deal — an IP license, an acquisition, a real estate transaction —
> private valuations must be partially communicated to reach
> agreement (Myerson & Satterthwaite, 1983). But the same
> communication is exploited by the counterparty to extract
> surplus. We call this *information double-use*: information
> shared to reach a deal is reused to worsen its terms.
>
> When the negotiators are LLM agents acting on behalf of human
> principals, this problem becomes worse, not better. LLMs trained
> on cooperative dialogue will surface intermediate reasoning that
> a strategic human negotiator would suppress. The signal-to-noise
> in each exchange is much higher.
>
> **Approach.** We confine the agent-to-agent negotiation to a
> hardware-isolated enclave (Intel TDX / AMD SEV-SNP). Each agent
> is bound by cryptographically signed parameters from its
> principal — an upper bound on what it can commit to. Inter-agent
> messages are A2A-protocol-shaped but never leave the enclave.
> Only the final outcome (agreement or no-deal) is published, and
> enclave memory is destroyed.
>
> We are not circumventing Myerson–Satterthwaite. The strategic
> tension simply moves from negotiation-time to parameter-setting-
> time. A principal who signs a maximum below their true reserve is
> shading their parameters, just as a negotiator might shade an
> opening offer. We claim the protocol reduces leakage *during the
> negotiation process*, not that it produces ex-post efficiency.
>
> **Why not the obvious alternatives?**
>
> | Approach        | Why it doesn't apply here                           |
> |-----------------|-----------------------------------------------------|
> | MPC             | Requires the computation as a circuit; precludes    |
> |                 | open-ended natural-language negotiation             |
> | FHE             | Several orders of magnitude too slow for LLM        |
> |                 | inference at interactive latency                    |
> | ZKP             | Proves correctness of computation, but cannot seal  |
> |                 | the *content* of an arbitrary LLM rollout           |
> | Trusted broker  | No technical enforcement of confidentiality;        |
> |                 | reverts the problem one layer up                    |
>
> TEE swaps mathematical-hardness assumptions for hardware-vendor
> trust + supply-chain assumptions. We're explicit about this in §3.3
> and §5.1 of the paper. Foreshadow / ÆPIC / CacheOut history is
> acknowledged. An insurance pool funded by protocol fees bounds the
> economic consequence of breach, which is not the same as
> preventing it.
>
> **What's implemented.**
>
> - Settlement layer: Solidity contracts (escrow + 3-stage bonded
>   commitments + insurance pool accounting). 51 unit tests.
> - Economic simulation in Python (bond schedules, fee model).
> - Demo script: end-to-end trade lifecycle on local Anvil.
>
> **What's not.**
>
> - The TEE-confined agent runtime. This is the next milestone
>   and the harder half. We chose to publish the design + settlement
>   substrate first to get critique before building the runtime.
>
> **What we'd value feedback on.**
>
> 1. The reduction of negotiation leakage versus parameter-setting
>    leakage. Is the *Layer 1 vs. Layer 2* decomposition (§1.2,
>    §2.2) defensible? Where does it leak?
> 2. The action-space constraint enforcement. The signed parameters
>    bound the agent's commitment power but not its internal
>    reasoning. What's the minimum mechanism (logit masking,
>    constrained decoding, structured-output-only) that you'd
>    consider sufficient?
> 3. The related-work table. We cite Renegade and Penumbra for
>    fungible dark-pool prior work, and Omega (arXiv 2605.03213)
>    for the most comparable TEE-based agent runtime. What are we
>    missing?

---

## Anticipated comments

**"This is just MPC dressed up as TEE."**

> No. MPC requires the computation to be expressed as a circuit
> ahead of time. Open-ended LLM negotiation cannot be expressed as
> a fixed circuit. TEE makes a different tradeoff: it accepts a
> hardware trust root in exchange for arbitrary-computation
> support.

**"You're not solving the impossibility result."**

> Explicit acknowledgment in §1, §1.2, and §6. We are not. We are
> reducing leakage of a specific class of information (intermediate
> negotiation dynamics) at the cost of moving strategic tension to
> the parameter-setting stage.

**"Why is this a paper and not a blog post?"**

> Fair. The paper format is deliberate — we want the protocol
> design reviewed against the prior art carefully before the agent
> runtime is built. The release order is paper-first, code-second,
> deployment-last.

---

## Things to avoid on this sub

- ❌ Crypto framing in the lead
- ❌ Marketing language
- ❌ Anything that looks like a Show HN body pasted over
- ❌ Token / chain / settlement-layer framing as the *main* hook
  (mention it but don't lead with it)
