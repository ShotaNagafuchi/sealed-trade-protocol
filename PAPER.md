# Sealed Trade Protocol: A Peer-to-Peer Bilateral Trade System with Information-Sealed Negotiation

**Shota Nagafuchi**

sealed-trade@proton.me

## Abstract

We propose a protocol for bilateral trade that prevents the double-use of private information during negotiation. In conventional private markets, the act of negotiating reveals private valuations which counterparties exploit to extract surplus. A buyer's willingness to pay, once signaled through an offer, can never be unsignaled. A seller's urgency, once revealed through a concession, permanently weakens their position. Sealed Trade addresses this by confining negotiation to AI agents operating within hardware-isolated enclaves. Each agent is bound by cryptographically signed parameters from its principal, and all negotiation state is destroyed upon completion. Only the final outcome — agreement or no deal — crosses the enclave boundary. Settlement occurs on-chain via bonded contracts with a volume-based mining mechanism that incentivizes early adoption.

## 1. Introduction

Private bilateral markets — IP licensing, M&A, real estate — require negotiation to reach agreement. But negotiation itself is a destructive act: every offer, counteroffer, and hesitation reveals private information that the counterparty can exploit. The information required to reach a deal is the same information used to worsen its terms.

We call this the **double-use of private information**. When two parties negotiate, each party's private information — their reservation price, urgency, alternatives — is necessarily communicated during the process. Once communicated, this information can be used by the counterparty to extract surplus beyond what a fair exchange would produce.

Consider a patent licensing negotiation. The licensee knows the maximum they would pay; the licensor knows the minimum they would accept. In an ideal negotiation, they would agree on a price within this zone of possible agreement (ZOPA) without either party learning the other's boundary. In practice, every offer reveals information. A first offer of $100K signals willingness to pay at least $100K. A counteroffer of $500K signals willingness to accept at most $500K. Through iterated rounds, each party's private valuation is progressively disclosed and exploited.

This problem has been studied in mechanism design since Myerson and Satterthwaite [1], who proved that no incentive-compatible mechanism can achieve ex-post efficiency in bilateral trade with private valuations. Their impossibility result assumes that agents act strategically — which they must, because revealing truthful valuations is dominated by misrepresenting them.

We circumvent this impossibility not by designing a new mechanism, but by changing the information architecture. If negotiation occurs between AI agents in a hardware-sealed environment, and all intermediate state is destroyed afterward, the information double-use problem disappears. Each party's private valuation is used exactly once — by their own agent, to negotiate — and is never available to the counterparty.

### 1.1 Related Work

Hardware enclaves for confidential computation have been explored in blockchain contexts, including Oasis Network and Secret Network, which use TEEs to enable private smart contract execution. These systems protect on-chain computation but do not address multi-round bilateral negotiation between autonomous agents.

Multi-party computation (MPC) [2] enables joint computation over private inputs without revealing them. However, MPC requires the computation to be expressed as a circuit, which precludes the open-ended natural-language negotiation central to bilateral trade.

Yao's garbled circuits [3] and subsequent work on privacy-preserving negotiation [4] address two-party computation with private inputs, but are limited to predefined protocols rather than free-form agent interaction.

Dark pools [5][6] solve information leakage for fungible token swaps — matching buyers and sellers without revealing order flow. Bilateral trade involves non-fungible, complex assets that require multi-dimensional negotiation, not simple price matching.

Our contribution is the synthesis: confining LLM-based agent negotiation within hardware enclaves, with cryptographic parameter binding and post-negotiation state destruction, applied to the bilateral trade setting.

## 2. The Information Double-Use Problem

### 2.1 Definition

In bilateral trade, private information serves two conflicting purposes:

1. **Reaching agreement**: Both parties must communicate preferences to find mutually acceptable terms.
2. **Maximizing individual surplus**: Each party wants to conceal preferences to prevent the counterparty from extracting value.

The fundamental tension is that the information required for (1) is the same information exploited in (2). We call this **information double-use**: private information that is used once to facilitate a deal is reused to worsen its terms.

### 2.2 Three Layers

The problem manifests at three distinct points in the trade lifecycle:

**Layer 1: Discovery leakage.** Expressing interest in an asset reveals demand. A buyer who contacts a patent holder has revealed that the patent has strategic value to them. The seller can adjust pricing upward before any negotiation begins.

**Layer 2: Negotiation extraction.** Each offer and counteroffer is a signal. Anchoring effects, response timing, concession patterns, and even the choice to continue negotiating all leak information about private valuations. Experienced negotiators exploit these signals systematically.

**Layer 3: Post-settlement persistence.** After a deal closes, the intermediary retains complete knowledge of both parties' reservation prices and negotiation behavior. This information can be used in future deals, shared with other clients, or leveraged in related transactions.

### 2.3 Inadequacy of Existing Approaches

**Trusted intermediaries** promise confidentiality but have no technical enforcement mechanism. Their business model depends on information asymmetry — they profit from knowing what both sides will accept.

**Fully homomorphic encryption** [7] imposes computational overhead several orders of magnitude beyond what is feasible for LLM inference, making it impractical for agent-based negotiation.

**Zero-knowledge proofs** prove computation correctness but cannot seal arbitrary content. A ZKP can prove that an agent followed its parameters, but it cannot prevent the counterparty from observing the negotiation itself.

## 3. Protocol Design

### 3.1 Trade Lifecycle

A trade progresses through six states:

```
Listed → Matched → Negotiating → Agreed → Settled
                                     ↗
                (any state) → Cancelled
```

**Listed.** A seller publishes a hashed asset description and a maximum deal value. They post a Discovery bond. No information about the asset's nature is revealed — only that something is available.

**Matched.** A buyer expresses interest and posts a matching bond. Neither party can see the other's parameters.

**Negotiating.** Both parties escalate their bonds. Each party signs a parameter set defining acceptable terms for their AI agent:

```
Parameters = {
    price_range: [min, max],
    required_terms: [...],
    deal_breakers: [...],
    strategy: "..."
}

signature = sign(hash(Parameters), private_key)
```

The signed parameters are loaded into a hardware-isolated enclave. The agents negotiate via a structured message protocol. Neither agent can communicate outside the enclave. Neither principal can observe the negotiation.

**Agreed.** If the agents reach agreement, both parties escalate to the highest bond tier. The agreement hash and enclave attestation are recorded on the settlement layer.

**Settled.** The deal value transfers from buyer to seller, net of the protocol fee. Bonds are returned. Mining rewards are distributed.

**Cancelled.** At any point before agreement, either party can cancel. Before negotiation, bonds are returned without penalty. During or after negotiation, the cancelling party's bond is slashed: half to the counterparty as compensation, half to the protocol's insurance pool.

### 3.2 Information Sealing via Hardware Enclaves

Agents run inside Trusted Execution Environments (Intel TDX, AMD SEV-SNP). The enclave provides two established properties and one architectural goal:

1. **Memory isolation.** The enclave's memory is encrypted in hardware. No process, operating system, hypervisor, or physical access can read it.

2. **Remote attestation.** The enclave generates a cryptographic proof that specific code is running in an authentic environment. Counterparties verify that the agent code has not been tampered with.

3. **State destruction.** Upon negotiation completion, the enclave executes a memory-zeroing procedure. Current TEE architectures support enclave teardown with memory clearing, though standardized attestation of destruction is an area of active development. The protocol treats verified state destruction as a design requirement; implementations must demonstrate this property through platform-specific attestation mechanisms.

### 3.3 Trust Assumption

The enclave requires trusting the hardware vendor to correctly implement isolation. This assumption differs in kind from mathematical hardness assumptions: ECDSA's security rests on the discrete logarithm problem, a mathematical conjecture; enclave security rests on correct hardware manufacturing and firmware, an engineering process subject to supply chain risks and implementation bugs.

We accept this tradeoff because the alternative — no confidentiality guarantee at all — is strictly worse. The protocol bounds the economic consequence of enclave failure through an insurance pool (see Section 5.1).

### 3.4 Agent Design

Each agent is a language model running inside the enclave. The agent receives signed parameters from its principal, negotiates with the counterparty's agent using structured messages, evaluates offers against its parameter boundaries, and either reaches agreement or declares no-deal.

The principal's signed parameters act as an **irrevocable mandate**. The agent cannot exceed them. If the principal sets a maximum price, the agent cannot agree to a higher one, regardless of the negotiation dynamics. This constrains the agent alignment problem within the negotiation context — the agent's action space is bounded by cryptographically enforced parameters. However, agent behavior within those bounds remains non-deterministic, and negotiation quality depends on the underlying model's capabilities.

## 4. Economic Model

### 4.1 Token Supply

The protocol's native token has a fixed supply of 100,000,000 units, allocated as:

- **95%** (95,000,000) to mining — distributed to trade participants over time
- **5%** (5,000,000) to treasury — for governance and ecosystem development

All tokens are created at protocol deployment. There is no inflation and no mechanism to create additional supply.

### 4.2 Volume-Based Halving

Mining rewards decrease as cumulative trade volume grows, following a halving schedule indexed by volume rather than time.

Let *V* denote cumulative trade volume. Period *n* spans the volume interval (*V*<sub>*n*-1</sub>, *V*<sub>*n*</sub>], where:

*V*<sub>*n*</sub> = *H* · 2<sup>*n*</sup>

and *H* = $10,000 is the halving constant. The token allocation for period *n* is:

*A*<sub>*n*</sub> = *A*<sub>0</sub> / 2<sup>*n*</sup>

where *A*<sub>0</sub> = 47,500,000. The volume within period *n* is:

Δ*V*<sub>*n*</sub> = *H* for *n* = 0, and *H* · 2<sup>*n*-1</sup> for *n* ≥ 1.

The mining rate (tokens per dollar traded) in period *n* is:

*r*<sub>*n*</sub> = *A*<sub>*n*</sub> / Δ*V*<sub>*n*</sub>

| Period | Cumulative Threshold (*V*<sub>*n*</sub>) | Allocation (*A*<sub>*n*</sub>) | Rate (*r*<sub>*n*</sub>) |
|--------|-----------|------------|------|
| 0 | $10,000 | 47,500,000 | 4,750 |
| 1 | $20,000 | 23,750,000 | 2,375 |
| 2 | $40,000 | 11,875,000 | 593.75 |
| 3 | $80,000 | 5,937,500 | 148.44 |

The partial sum of allocations over *N* periods is *A*<sub>0</sub> · (1 − 2<sup>−*N*</sup>) / (1 − 2<sup>−1</sup>). With *N* = 22 periods, this yields 95,000,000 · (1 − 2<sup>−22</sup>) ≈ 94,999,977 tokens, accounting for over 99.999% of the mining allocation. The cumulative volume at the end of period 21 is *V*<sub>21</sub> = $10,000 · 2<sup>21</sup> ≈ $20.97 billion.

### 4.3 Contribution Scoring

When a trade settles at value *d*, both buyer and seller receive equal contribution scores:

*s*<sub>buyer</sub> = *s*<sub>seller</sub> = *d* / 2

Within each period *n*, a contributor's reward is proportional to their share of the period's total score:

*R*<sub>*i*</sub><sup>(*n*)</sup> = *A*<sub>*n*</sub> · *s*<sub>*i*</sub><sup>(*n*)</sup> / Σ<sub>*j*</sub> *s*<sub>*j*</sub><sup>(*n*)</sup>

This ensures that the full period allocation is distributed to participants.

### 4.4 Bonds

Bonds serve two purposes: preventing spam and providing economic recourse for counterparty harm. The bond amount at each stage is:

*B*(*d*, stage) = clamp(*d* · *r*<sub>stage</sub>, *B*<sub>min</sub>, *B*<sub>max</sub>)

where clamp(*x*, *a*, *b*) = min(max(*x*, *a*), *b*).

| Stage | Rate | Minimum | Maximum |
|-------|------|---------|---------|
| Discovery | 1% | $1 | $1,000 |
| Negotiation | 3% | $5 | $5,000 |
| Execution | 10% | $10 | $50,000 |

Escalation is additive: progressing from one stage to the next requires posting only the difference, not the full amount. On dispute, the faulty party's bond is split equally between the counterparty and the insurance pool.

### 4.5 Fee

A 0.3% fee is collected at settlement. The buyer transfers the full deal value; the seller receives the deal value minus the fee. The fee is routed to the protocol treasury.

## 5. Security Analysis

### 5.1 Enclave Breach

The protocol's confidentiality depends on hardware enclave integrity. We model breach probability as:

*P*(breach) = *P*(hardware vulnerability) × *P*(exploit within trade window) × *P*(targeted at specific trade)

These factors are order-of-magnitude estimates, not measured probabilities. Based on the historical frequency of TEE vulnerabilities (e.g., Foreshadow, ÆPIC Leak, CacheOut) and the narrow time window of a single negotiation, we treat *P*(breach) as small but non-zero. The protocol does not claim to eliminate breach risk; it bounds the economic consequence through an insurance pool funded by 50% of slashed bonds.

### 5.2 Economic Attacks

**Bond griefing.** An attacker could repeatedly enter trades and cancel during negotiation to trigger bond slashing. The cost of this attack is the attacker's own bond (3% of deal value at minimum), while the harm is the counterparty's wasted time and bond lockup. The minimum bond ensures that even small-value griefing has non-trivial cost.

**Volume inflation.** A participant could report inflated deal values to mine additional tokens. The cost of this attack is the bond required at each stage (up to 10% of the stated deal value). For deal values above the maximum bond cap ($50,000), the attacker's bond is fixed at the cap while their mining reward continues to scale with the stated value. This creates an asymmetry: above the cap, the marginal cost of additional fake volume is zero. The maximum bond caps therefore bound total attack cost but do not fully prevent volume inflation at high stated values. This is a known limitation of the bonding mechanism.

**Sybil mining.** A participant could create multiple identities to accumulate disproportionate mining rewards. Since rewards are proportional to contribution score (which is proportional to deal value), and each deal requires real bond capital, the cost of Sybil mining equals the bond capital required — which is proportional to the deal value being mined. There is no amplification.

### 5.3 Settlement Integrity

The settlement layer enforces a strict state machine. Each transition requires:

- Bond escalation from the transacting parties
- Cryptographic signatures from both buyer and seller (for agreement)
- Enclave attestation (for negotiation initiation and completion)

No transition can bypass these requirements. The state machine is deterministic and fully specified — there are no administrative overrides or upgrade mechanisms for the core trade logic.

## 6. Limitations

**Hardware vendor trust.** The protocol's confidentiality guarantee depends on enclave vendor integrity. A fundamental hardware compromise — not just a software exploit — would violate the sealed negotiation property. The insurance pool mitigates but does not eliminate this risk. Unlike mathematical hardness assumptions, hardware trust involves supply chains and manufacturing processes that are opaque to external verification.

**Self-reported deal values.** The protocol does not independently verify that stated deal values reflect actual economic reality. Bond requirements create a cost proportional to misreporting, but the maximum bond caps create an asymmetry for high-value claims (see Section 5.2).

**Agent non-determinism.** Language models are stochastic. Two runs of the same agent with identical parameters and identical counterparty behavior may produce different negotiation outcomes. The protocol guarantees that agent actions stay within signed parameter bounds, but does not guarantee optimal negotiation outcomes.

**Single-vertical cold start.** The protocol requires participants in each trade vertical. Network effects within a vertical do not transfer unless participants overlap across verticals.

**Legal enforceability.** The protocol produces a cryptographic agreement hash, but for the asset classes targeted (IP licensing, M&A, real estate), legal contracts — not on-chain state — are the enforceable instrument in most jurisdictions. The relationship between protocol settlement and legal enforceability is an open question.

## 7. Conclusion

We have presented a protocol that eliminates the double-use of private information in bilateral trade. The mechanism confines negotiation to hardware-isolated AI agents that destroy all intermediate state, ensuring that private valuations are used exactly once — by their owner's agent — and are never available to the counterparty, the intermediary, or the protocol itself.

A reference implementation is available as open-source software.

## References

[1] R. Myerson and M. Satterthwaite, "Efficient Mechanisms for Bilateral Trading," *Journal of Economic Theory*, vol. 29, pp. 265-281, 1983.

[2] O. Goldreich, S. Micali, and A. Wigderson, "How to Play Any Mental Game," *STOC*, 1987.

[3] A. Yao, "Protocols for Secure Computations," *FOCS*, 1982.

[4] R. Moraffah and B. Sankar, "Privacy-Preserving Multi-Round Negotiations," *IEEE Transactions on Information Forensics and Security*, 2021.

[5] Renegade, "On-Chain Dark Pool," 2023.

[6] Penumbra Labs, "A Private DEX and Shielded Pool," 2023.

[7] C. Gentry, "Fully Homomorphic Encryption Using Ideal Lattices," *STOC*, 2009.
