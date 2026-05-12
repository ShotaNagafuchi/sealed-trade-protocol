# Sealed Trade Protocol: A Peer-to-Peer Bilateral Trade System with Information-Sealed Negotiation

**Shota Nagafuchi**

sealed-trade@proton.me

## Abstract

We propose a protocol for bilateral trade that prevents the double-use of private information during negotiation. In conventional private markets, the act of negotiating reveals private valuations — a buyer's willingness to pay, a seller's urgency to sell — which counterparties exploit to extract surplus. This is the information analogue of Bitcoin's double-spending problem: the same piece of private information is used once to reach a deal and again to worsen the terms.

Sealed Trade addresses this by confining negotiation to AI agents operating within Trusted Execution Environments (TEE). Each agent is bound by cryptographically signed parameters from its principal, negotiates via an agent-to-agent protocol, and provably destroys all negotiation state upon completion. Only the final outcome — agreement or no deal — crosses the enclave boundary.

Settlement occurs on-chain via bonded smart contracts. A Bitcoin-style mining mechanism with volume-based halving bootstraps early adoption without requiring centralized market-making. We present the protocol design, economic model, security analysis, and a working implementation with 103 automated tests.

## 1. Introduction

Bitcoin solved the double-spending problem for digital cash: without a trusted third party, the same digital coin cannot be spent twice [1]. The solution — a distributed timestamp server with proof-of-work consensus — eliminated the need for banks in peer-to-peer electronic payments.

We identify an analogous problem in bilateral trade: the **double-use of private information**. When two parties negotiate a deal, each party's private information — their reservation price, urgency, alternatives — is necessarily communicated during the negotiation process. Once communicated, this information can be used by the counterparty to extract surplus beyond what a fair exchange would produce.

Consider a patent licensing negotiation. The licensee knows the maximum they would pay; the licensor knows the minimum they would accept. In an ideal negotiation, they would agree on a price within this zone of possible agreement (ZOPA) without either party learning the other's boundary. In practice, every offer reveals information. A first offer of $100K signals willingness to pay at least $100K. A counteroffer of $500K signals willingness to accept at most $500K. Through iterated rounds, each party's private valuation is progressively disclosed and exploited.

This problem has been studied in mechanism design since Myerson and Satterthwaite [2], who proved that no incentive-compatible mechanism can achieve ex-post efficiency in bilateral trade with private valuations. Their impossibility result assumes that agents act strategically — which they must, because revealing truthful valuations is dominated by misrepresenting them.

We circumvent this impossibility not by designing a new mechanism, but by changing the information architecture. If negotiation occurs between AI agents in a hardware-sealed environment, and all intermediate state is provably destroyed afterward, the information double-use problem disappears. Each party's private valuation is used exactly once — by their own agent, to negotiate — and is never available to the counterparty.

### 1.1 Contributions

1. We formalize the **information double-use problem** as a three-layer issue: revelation during discovery, extraction during negotiation, and persistence after settlement.
2. We present a protocol that addresses all three layers using TEE-confined AI agent negotiation with cryptographic attestation of state destruction.
3. We design a **volume-based mining mechanism** with Bitcoin-style halving that bootstraps network effects without venture capital or centralized market-making.
4. We provide a working implementation: 5 smart contracts, a Python economic simulation, and 103 automated tests.

## 2. The Information Double-Use Problem

### 2.1 Problem Statement

In bilateral trade, private information serves two conflicting purposes:

1. **Reaching agreement**: Both parties must communicate preferences to find mutually acceptable terms.
2. **Maximizing individual surplus**: Each party wants to conceal preferences to prevent the counterparty from extracting value.

The fundamental tension is that the information required for (1) is the same information exploited in (2). We call this **information double-use**: private information that is used once to facilitate a deal is reused to worsen its terms.

### 2.2 Three Layers

The problem manifests at three distinct points in the trade lifecycle:

**Layer 1: Discovery leakage.** Expressing interest in an asset reveals demand. A buyer who contacts a patent holder has revealed that the patent has strategic value to them. The seller can adjust pricing upward before any negotiation begins.

**Layer 2: Negotiation extraction.** Each offer and counteroffer is a signal. Anchoring effects, response timing, concession patterns, and even the choice to continue negotiating all leak information about private valuations. Experienced negotiators exploit these signals systematically.

**Layer 3: Post-settlement persistence.** After a deal closes, the intermediary (broker, advisor, platform) retains complete knowledge of both parties' reservation prices and negotiation behavior. This information can be used in future deals, shared with other clients, or leveraged in related transactions.

### 2.3 Why Existing Solutions Fail

**Trusted intermediaries** (brokers, investment bankers) promise confidentiality but have no technical enforcement mechanism. Their business model depends on information asymmetry — they profit from knowing what both sides will accept. The global M&A advisory market charges 1-5% of deal value [3] for this unenforceable promise.

**Sealed-bid auctions** eliminate negotiation but sacrifice price discovery. They are efficient only when there are many competing bidders for standardized goods — the opposite of bilateral trade in private markets.

**Cryptographic approaches** (MPC, FHE, ZKP) can protect specific computations but cannot support the open-ended, natural-language negotiation required in complex bilateral deals. MPC requires predefined circuits. FHE imposes 10,000-100,000x computational overhead [4], making LLM inference infeasible. ZKP proves computation correctness but cannot seal arbitrary content.

**Dark pools** (Renegade [5], Penumbra [6]) solve information leakage for fungible token swaps — matching buyers and sellers of ETH/USDC without revealing order flow. But bilateral trade involves non-fungible, complex assets (patents, companies, real estate) that require multi-dimensional negotiation, not simple price matching.

## 3. Protocol Design

### 3.1 Overview

Sealed Trade is a four-layer architecture:

```
Layer 3: Vertical Adapters     (IP licensing, real estate, M&A — future)
Layer 2: Sealed Bilateral Trade (this protocol)
Layer 1: TEE Substrate          (Intel TDX / AMD SEV-SNP)
Layer 0: Settlement             (EVM smart contracts on L2)
```

### 3.2 Trade Lifecycle

A trade progresses through six states:

```
Listed → Matched → Negotiating → Agreed → Settled
                                         ↗
                    (any state) → Cancelled
```

**Listed.** A seller publishes a hashed asset description and a maximum deal value. They post a Discovery bond (1% of deal value, $1-$1,000). No information about the asset's nature is revealed — only that something is available.

**Matched.** A buyer expresses interest and posts a matching Discovery bond. The buyer cannot see the seller's parameters; the seller cannot see the buyer's.

**Negotiating.** Both parties escalate to Negotiation bonds (3%, $5-$5,000). Each party signs a parameter set defining acceptable terms for their AI agent:

```
Parameters = {
    price_range: [min, max],
    required_terms: [...],
    deal_breakers: [...],
    negotiation_strategy: "..."
}

signature = sign(hash(Parameters), private_key)
```

The signed parameters are loaded into a TEE enclave. The agents negotiate via the A2A (Agent-to-Agent) protocol, exchanging signed messages. Neither agent can communicate outside the enclave. Neither principal can observe the negotiation.

**Agreed.** If the agents reach agreement, both parties escalate to Execution bonds (10%, $10-$50,000). The agreement hash and TEE attestation are recorded on-chain.

**Settled.** The deal value (in USDC) transfers from buyer to seller, minus the 0.3% protocol fee. Bonds are returned. Mining rewards are distributed.

**Cancelled.** At any point before agreement, either party can cancel. Before negotiation, bonds are returned without penalty. During or after negotiation, the cancelling party's bond is slashed: 50% to counterparty, 50% to insurance pool.

### 3.3 TEE Substrate

Agents run inside Trusted Execution Environments — Intel TDX or AMD SEV-SNP. The TEE provides three properties:

1. **Memory isolation.** The enclave's memory is encrypted in hardware. No process, operating system, hypervisor, or physical access can read it.

2. **Remote attestation.** The TEE generates a cryptographic proof that specific code is running in an authentic enclave. Counterparties verify that the agent code has not been tampered with.

3. **Attestation of destruction.** Upon negotiation completion, the TEE attests that all enclave memory has been zeroed. This is a kernel-level operation — forensic recovery is infeasible.

#### Trust Assumption

TEE requires trusting the hardware vendor to correctly implement isolation. We argue this assumption is:

- **Comparable to cryptographic assumptions.** Using ECDSA requires trusting that the discrete logarithm problem is hard. Using TEE requires trusting that Intel TDX isolates memory. Both are empirically validated assumptions that could theoretically fail.

- **Economically bounded.** The protocol maintains an insurance pool to compensate for TEE breaches. The expected loss per trade is:

```
E[loss] = P(hardware_vuln) × P(exploit_in_window) × P(targeted) × deal_value
        ≈ 10⁻³ × 10⁻² × 10⁻² × deal_value
        = 10⁻⁷ × deal_value
```

For a $100K deal, the expected loss is $0.01. The insurance pool is sized to cover aggregate expected losses across all trades.

### 3.4 Agent Design

Each agent is an LLM (e.g., Llama 3.1 70B) running inside the TEE enclave. The agent:

1. Receives signed parameters from its principal.
2. Negotiates with the counterparty's agent using structured messages.
3. Evaluates offers against its parameter boundaries.
4. Either reaches agreement or declares no-deal.
5. Signs the outcome and publishes it, then destroys all state.

The principal's signed parameters act as an **irrevocable mandate** — the agent cannot exceed them. If the principal sets a maximum price of $100K, the agent cannot agree to $101K, regardless of the negotiation dynamics.

## 4. Economic Model

### 4.1 Token Supply

SEAL is an ERC-20 token with fixed supply:

| Allocation | Amount | Share |
|-----------|--------|-------|
| Mining | 95,000,000 SEAL | 95% |
| Treasury | 5,000,000 SEAL | 5% |
| **Total** | **100,000,000 SEAL** | **100%** |

All tokens are minted at deployment. There is no inflation, no minting function, and no admin key that can create additional supply.

### 4.2 Volume-Based Halving

Mining rewards decrease as cumulative trade volume grows, following a Bitcoin-style halving schedule indexed by volume rather than time.

**Definition.** Let $V$ denote cumulative trade volume in USD. Period $n$ spans the volume interval:

$$V_{n-1} < V \leq V_n$$

where $V_n = H \cdot 2^n$ and $H = \$10{,}000$ is the halving constant.

The SEAL allocation for period $n$ is:

$$A_n = \frac{A_0}{2^n}$$

where $A_0 = 47{,}500{,}000$ SEAL.

The volume within period $n$ is:

$$\Delta V_n = V_n - V_{n-1} = \begin{cases} H & \text{if } n = 0 \\ H \cdot 2^{n-1} & \text{if } n \geq 1 \end{cases}$$

The mining rate (SEAL per dollar traded) in period $n$ is:

$$r_n = \frac{A_n}{\Delta V_n}$$

| Period | Cumulative Threshold | Allocation (SEAL) | Mining Rate (SEAL/$) |
|--------|---------------------|--------------------|----------------------|
| 0 | $10,000 | 47,500,000 | 4,750.00 |
| 1 | $20,000 | 23,750,000 | 2,375.00 |
| 2 | $40,000 | 11,875,000 | 593.75 |
| 3 | $80,000 | 5,937,500 | 148.44 |
| 4 | $160,000 | 2,968,750 | 37.11 |
| 5 | $320,000 | 1,484,375 | 9.28 |
| ... | ... | ... | ... |
| 21 | $20,971,520,000 | ~23 | ~0 |

The geometric series converges: $\sum_{n=0}^{21} A_n = A_0 \cdot (1 - 2^{-22}) / (1 - 2^{-1}) \approx 95{,}000{,}000$ SEAL, with approximately 22.65 SEAL of dust remaining.

Total cumulative volume to fully mine: approximately $21 billion.

### 4.3 Contribution Scoring

When a trade settles at value $d$, both buyer and seller receive contribution scores:

$$s_{\text{buyer}} = s_{\text{seller}} = \frac{d}{2}$$

Within each period $n$, a contributor's reward is proportional to their share of the period's total score:

$$R_i^{(n)} = A_n \cdot \frac{s_i^{(n)}}{\sum_j s_j^{(n)}}$$

This ensures that the full period allocation $A_n$ is distributed to participants, with no tokens locked or lost.

### 4.4 Bond Mechanism

Bonds serve two purposes: preventing spam/griefing and providing economic recourse for counterparty harm.

| Stage | Rate | Minimum | Maximum |
|-------|------|---------|---------|
| Discovery | 1% | $1 | $1,000 |
| Negotiation | 3% | $5 | $5,000 |
| Execution | 10% | $10 | $50,000 |

Bond amounts are computed as:

$$B(d, \text{stage}) = \text{clamp}(d \cdot r_{\text{stage}}, B_{\min}, B_{\max})$$

where $d$ is the deal value, $r_{\text{stage}}$ is the basis point rate, and $\text{clamp}(x, a, b) = \min(\max(x, a), b)$.

Escalation is additive: progressing from Discovery to Negotiation requires posting the difference, not the full Negotiation amount.

On dispute, the faulty party's bond is slashed: 50% to the counterparty as compensation, 50% to the protocol's insurance pool.

### 4.5 Fee Structure

A 0.3% fee (30 basis points) is collected from the deal value at settlement. This is 10-50x lower than traditional intermediary fees of 5-15%.

The fee is paid by the buyer and deducted from the settlement amount:

$$\text{seller\_proceeds} = d - \text{fee} = d \cdot (1 - 0.003)$$

## 5. Reflexive Growth Mechanism

The protocol exhibits a positive feedback loop between trade volume and token value:

```
More trades → more fees + more mining → higher token demand
                                              ↓
Higher token value → more incentive to trade → more trades
```

This reflexive loop is self-reinforcing but also self-limiting — as mining rewards halve with volume, the marginal token incentive decreases, and the protocol must sustain itself on utility value rather than mining subsidies.

### 5.1 Multi-Vertical Trust Accumulation

A participant's contribution score is cumulative across all trade verticals. An IP licensing participant who later enters real estate trading carries their accumulated reputation. This creates a cross-vertical trust graph that becomes the protocol's moat:

- Vertical-specific platforms cannot replicate cross-vertical reputation.
- Each new vertical adds liquidity to the existing token economy.
- Participants are incentivized to bring new verticals onto the protocol rather than fork it.

### 5.2 Genesis Bootstrap

The protocol can bootstrap from a single self-trade of $70 (¥10,000). At the Period 0 mining rate of 4,750 SEAL per dollar, this genesis trade mines approximately 332,500 SEAL (0.33% of supply). One hundred such self-trades ($7,000 cumulative) mine approximately 33.25M SEAL (33% of supply) while completing 70% of Period 0.

This is deliberately analogous to Satoshi mining Bitcoin block 0 on a single computer. The genesis trade proves the system works with real money at minimal scale.

## 6. Security Model

### 6.1 Defense Layers

The protocol provides security through three independent mechanisms:

**Cryptographic.** EIP-712 typed signatures with domain separation prevent cross-chain replay. Secp256k1 signature malleability is rejected (EIP-2 s-range check). TEE attestation chains are verified on-chain.

**Economic.** Bonds create financial incentives for honest behavior. The minimum bond for any trade stage ensures that even small-value trades have meaningful economic commitment. The insurance pool provides aggregate protection against TEE breaches.

**Operational.** Smart contracts enforce the state machine — no transition can bypass the required bond escalation, signature verification, or attestation recording. The ContributionLedger stops recording scores after Period 21, preventing unbounded state growth.

### 6.2 Smart Contract Security

The implementation applies:

- **Checks-Effects-Interactions (CEI) pattern** in all state-mutating functions. State is updated before external calls, eliminating reentrancy attack vectors.
- **OpenZeppelin ReentrancyGuard** as defense-in-depth on all external state-mutating functions.
- **Deployer-gated initialization** for cross-contract references, preventing front-running attacks during deployment.
- **Ownable2Step** for Treasury ownership, requiring explicit acceptance to prevent ownership transfer to incorrect addresses.
- **Pool-level accounting** enforcement on Treasury withdrawals, preventing accounting desynchronization.

### 6.3 Limitations

**TEE hardware trust.** The protocol's confidentiality guarantee depends on TEE vendor integrity. A fundamental hardware compromise (not just a software exploit) would violate the sealed negotiation property. The insurance pool mitigates but does not eliminate this risk.

**Single-party collusion with their agent.** A malicious principal who controls the TEE infrastructure could potentially extract their own agent's observations. The protocol assumes that TEE infrastructure is operated by a neutral party or a decentralized set of operators.

**Oracle dependency.** Deal values are denominated in USDC but the protocol does not verify that stated deal values reflect actual economic reality. Participants could report inflated deal values to mine additional SEAL tokens. Bond requirements create a cost to this attack proportional to the inflation.

## 7. Implementation

The protocol is implemented as five Solidity smart contracts targeting EVM-compatible L2 chains (Arbitrum):

| Contract | Purpose | Key Properties |
|----------|---------|----------------|
| SealToken | ERC-20 with fixed 100M supply | No admin mint, ERC-20 Permit |
| SealedTrade | Trade lifecycle orchestrator | EIP-712 signatures, ReentrancyGuard |
| BondVault | 3-stage bond escrow | CEI pattern, deployer-gated init |
| ContributionLedger | Mining with halving | Volume-based periods, proportional rewards |
| Treasury | Fee vault + insurance pool | Ownable2Step, pool accounting |

A Python reference implementation (`simulation/sealed_economics.py`) independently validates all economic formulas. Monte Carlo simulations confirm equitable reward distribution (Gini coefficient < 0.2 across all tested market scenarios).

The test suite comprises 53 Solidity tests (Foundry) and 50 Python tests, covering supply invariants, bond mechanics, halving transitions, fee calculations, access control, and signature verification.

## 8. Future Work

**Agent runtime.** The TEE-confined agent runtime (Rust + Llama) is designed but not yet implemented. Key challenges include TEE attestation chain management, LLM inference optimization within enclave memory constraints, and formal verification of the memory wipe procedure.

**Vertical adapters.** Domain-specific adapters for IP licensing, real estate, and M&A will translate industry-standard deal terms into the protocol's parameter format.

**Governance.** The 5M SEAL treasury allocation enables future token-weighted governance for protocol parameter changes, insurance pool management, and ecosystem grants.

**Formal verification.** The economic model's properties (supply cap, reward conservation, halving correctness) should be formally verified using tools such as Certora or Halmos.

## 9. Conclusion

The information double-use problem in bilateral trade is analogous to the double-spending problem in digital cash. Just as Bitcoin made trustless digital payments possible by eliminating the need for a trusted third party to prevent double-spending, Sealed Trade makes trustless bilateral negotiation possible by eliminating the ability to double-use private information.

The protocol achieves this through three mechanisms: TEE-confined AI agents that prevent information leakage during negotiation, cryptographic attestation of state destruction that prevents information persistence after negotiation, and bonded smart contracts that provide economic enforcement and dispute resolution.

The mining mechanism enables bootstrap from a single $70 self-trade to a global bilateral trade infrastructure, following the same organic growth path that took Bitcoin from a single genesis block to a trillion-dollar network.

The implementation is open-source, with 103 automated tests verifying correctness of the economic model and smart contract logic. The protocol has not been professionally audited and should not be used with real funds until an audit is completed.

## References

[1] S. Nakamoto, "Bitcoin: A Peer-to-Peer Electronic Cash System," 2008.

[2] R. Myerson and M. Satterthwaite, "Efficient Mechanisms for Bilateral Trading," *Journal of Economic Theory*, vol. 29, pp. 265-281, 1983.

[3] McKinsey & Company, "Global Banking Annual Review," 2023.

[4] C. Gentry, "Fully Homomorphic Encryption Using Ideal Lattices," *STOC*, 2009.

[5] Renegade, "Renegade: On-Chain Dark Pool," https://renegade.fi, 2023.

[6] Penumbra Labs, "Penumbra: A Private DEX and Shielded Pool," https://penumbra.zone, 2023.

[7] N. Stephenson, "NDAI: Non-Disclosure AI Agents," 2025.

[8] Intel Corporation, "Intel Trust Domain Extensions (TDX) Module Architecture Specification," 2023.

[9] A. Yao, "Protocols for Secure Computations," *FOCS*, 1982.

[10] R. Moraffah and B. Sankar, "Privacy-Preserving Multi-Round Negotiations," *IEEE Transactions on Information Forensics and Security*, 2021.
