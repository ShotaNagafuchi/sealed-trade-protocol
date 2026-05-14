# r/ethereum

**Sub norms:** technical, allergic to shilling, cares about EIP /
gas / L2 / economic security. Will downvote anything that reads
like a token launch. Mods remove pure-promotion posts.

**Bitcoin framing:** absent. Bitcoin homage on r/ethereum reads as
tribally clueless.

**Timing:** Tuesday–Thursday morning EU/US overlap (12:00–15:00 UTC).

---

## Title

```
Sealed Trade Protocol: bonded escrow + A2A negotiation in TEE, settlement on L2
```

Alternate:

```
A confidential negotiation layer for agent-to-agent commerce, settled on L2
```

---

## Body

> **TL;DR.** Bilateral trade (IP licensing, M&A, real estate) leaks
> private information during negotiation. We seal the negotiation
> phase inside a TEE-confined AI agent pair (A2A protocol) and
> settle on-chain via 3-stage bonded escrow on L2. Open-source,
> Apache-2.0, smart contracts done and tested, agent runtime is the
> next milestone.
>
> **Why this might be of interest to /r/ethereum specifically:**
>
> The settlement layer is the part that's actually built, and the
> design choices are concrete:
>
> - **3-stage bond escalation** (Discovery 1%, Negotiation 3%,
>   Execution 10% — clamped between hard min/max). Each stage gates
>   the next state transition. Slashing on dispute splits 50/50
>   between counterparty and an insurance pool.
> - **EIP-712 typed signatures** with explicit s-value malleability
>   protection. Each state transition requires fresh signed
>   parameters bound to the trade ID and stage.
> - **Atomic settlement.** Deal value, fee (30 bps), and bond
>   release happen in one transaction. No trusted operator with a
>   "release funds" button.
> - **Ownable2Step, ReentrancyGuard, CEI throughout, deployer-gated
>   init, pool-level accounting invariants enforced on every write.**
>   Unaudited — explicitly flagged in the README.
> - **L2 native.** Stablecoin settlement, sub-second finality. The
>   bond/fee math is denominated in deal value, not gas-coupled.
>
> **What we'd like feedback on:**
>
> 1. The bond schedule. The escalating-stake model is intended to
>    price out spam and grief without making honest trades
>    capital-prohibitive. Curious how this compares to bond designs
>    in optimistic rollups or prediction markets.
> 2. The insurance pool design. Currently funded by 100% of
>    fees + 50% of slashed bonds. Claim mechanism is the obvious
>    weak point — currently no on-chain claim flow, just an
>    accounting target. How would you design the dispute /
>    payout path?
> 3. Attestation. We store an attestation hash on-chain but don't
>    yet verify the platform attestation signature. Anyone who has
>    integrated TDX / SEV-SNP attestation on-chain — pitfalls?
>
> **What it is not:**
>
> Not a token. Not a chain. Not a DEX. Not a points program. The
> repo is one paper, three Solidity contracts, an economic
> simulation in Python, and a Foundry demo. License is Apache-2.0.
>
> Paper: [PAPER.md link]
> Code: [github link]
> Demo: `forge script script/Demo.s.sol --fork-url $(anvil --port 8545)`

---

## Anticipated comments

**"Why on Ethereum (or any L2) and not a private chain?"**

> Because the value of the settlement layer is that bonds and fees
> route to a public, permissionless insurance pool that anyone can
> audit. A private chain reintroduces a trusted operator and
> defeats the design.

**"Bond percentages seem high — 10% at execution?"**

> Clamped at $50k max. For most deals the cap binds, not the
> percentage. The high percentage at small notional is intentional:
> it prices spam out of the discovery layer.

**"What chain is this on?"**

> Chain-agnostic on the contract layer. Anywhere with EVM + a
> stablecoin. No deployments yet.

**"Tokenless? What's the incentive?"**

> Fees fund the insurance pool. No token, no airdrop, no points.

---

## Things to avoid on this sub

- ❌ Mentioning Bitcoin in any capacity
- ❌ Comparing to specific coins / tokens
- ❌ Roadmap language ("Q3 mainnet")
- ❌ Anything that looks like a launch announcement
