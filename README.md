# Sealed Trade Protocol

[![CI](https://github.com/ShotaNagafuchi/sealed-trade-protocol/actions/workflows/ci.yml/badge.svg)](https://github.com/ShotaNagafuchi/sealed-trade-protocol/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636.svg)](https://soliditylang.org/)

**A protocol that prevents the double-use of private information in bilateral trade.**

Bitcoin solved double-spending: you can't spend the same coin twice.
Sealed Trade solves double-use: your private valuation can't be used against you.

## The Problem

In private markets — IP licensing, M&A, real estate — negotiation itself leaks information. When a buyer expresses interest, the seller learns there is demand. When a seller lists an asset, the buyer learns there is urgency. Intermediaries who promise confidentiality have no technical mechanism to enforce it.

This is the **information double-use problem**: the act of negotiating reveals private constraints that the counterparty can exploit. Every offer, counteroffer, and hesitation becomes a signal. The information you share to reach a deal is reused to worsen your terms.

No existing infrastructure solves this. Brokers are trusted third parties with no technical enforcement. Online marketplaces are public by design. Even encrypted channels only protect data in transit — not from the other party at the table.

## The Solution

Sealed Trade makes bilateral negotiation **information-tight**. AI agents negotiate inside hardware-isolated enclaves (TEE). Neither party — nor any intermediary, nor the protocol itself — can observe the negotiation. Only the outcome crosses the boundary: an agreement, or "no deal."

```
 Seller                                                        Buyer
   |                                                              |
   |  [signs parameters: min price, terms]                        |
   |              |                                               |
   |              v                                               |
   |    +-----------------------TEE Enclave-----------------------+
   |    |  Seller Agent  <-- A2A Protocol -->  Buyer Agent        |
   |    |  (LLM in TEE)     signed messages    (LLM in TEE)       |
   |    |                                                         |
   |    |  * Neither agent can exfiltrate data                    |
   |    |  * Memory provably wiped after negotiation              |
   |    |  * Only outcome (agree/no-deal) exits the enclave       |
   |    +--------------------------+------------------------------+
   |                               |
   |                               v
   |                    Smart Contracts (L2)
   |                  Bond · Fee · Mining · Attestation
   |                               |
   +-------------------------------+------------------------------+
                           Settlement
```

### How It Works

1. **Each party signs parameters** — acceptable price range, required terms, deal-breakers. These are the agent's mandate.
2. **AI agents negotiate in a TEE enclave** — Intel TDX or AMD SEV-SNP. The agents run LLMs to negotiate freely within their signed parameters. No human or external process can read enclave memory.
3. **Only the outcome exits** — the final agreement (or "no deal"). All intermediate state — offers, counteroffers, reasoning — is kernel-level deleted with cryptographic attestation.
4. **Smart contracts settle** — bonds are posted at each stage, the deal value transfers on settlement, and mining rewards are distributed.

### Why TEE

| Approach | Why it doesn't work here |
|----------|--------------------------|
| MPC | Requires predefined computation circuits — can't support free-form LLM negotiation |
| FHE | 10,000-100,000x overhead makes LLM inference infeasible |
| ZKP | Proves computation correctness but can't seal arbitrary negotiation content |
| Trusted broker | No technical enforcement — trust is the product, and trust fails |

TEE requires trusting the hardware vendor (Intel, AMD). This is comparable to trusting that ECDSA is hard — an empirically validated assumption with a 10+ year track record. The protocol's insurance pool provides economic recourse if the hardware guarantee fails.

## Economic Design

The protocol uses Bitcoin-style mining to bootstrap a two-sided market.

**The cold-start problem**: buyers won't come without sellers, sellers won't come without buyers. Mining solves this by rewarding the first participants disproportionately — exactly as Bitcoin rewarded early miners with 50 BTC per block before anyone else was paying attention.

### Mining Schedule

| Period | Cumulative Volume | SEAL Allocated | Mining Rate |
|--------|-------------------|----------------|-------------|
| 0 | $0 — $10K | 47,500,000 | 4,750 SEAL/$1 |
| 1 | $10K — $20K | 23,750,000 | 2,375 SEAL/$1 |
| 2 | $20K — $40K | 11,875,000 | 593.75 SEAL/$1 |
| 3 | $40K — $80K | 5,937,500 | 148.44 SEAL/$1 |
| ... | ... | ... | ... |
| 21 | ~$10.5B — ~$21B | 23 | ~0 SEAL/$1 |

- **100M SEAL total supply** (95M mining + 5M treasury). Fixed at deployment. No inflation.
- **Halving by volume**, not time. Each period requires 2x the cumulative trade volume.
- **~$21B cumulative volume** to fully mine all tokens.

### Bonds

Every trade participant posts collateral that escalates with commitment:

| Stage | Bond | Min | Max |
|-------|------|-----|-----|
| Discovery | 1% of deal value | $1 | $1,000 |
| Negotiation | 3% of deal value | $5 | $5,000 |
| Execution | 10% of deal value | $10 | $50,000 |

Bonds are returned on settlement. On dispute, the faulty party's bond is slashed: 50% to counterparty, 50% to insurance pool.

### Fee

0.3% of deal value on settlement. Compared to 5-15% for traditional brokers.

## Repository

```
contracts/src/
  SealToken.sol             ERC-20 (100M fixed supply)
  SealedTrade.sol           Trade lifecycle (EIP-712 signatures)
  BondVault.sol             3-stage bond escrow
  ContributionLedger.sol    Mining with halving
  Treasury.sol              Fee vault + insurance pool

simulation/
  sealed_economics.py       Reference implementation of all formulas
  halving_check.py          Halving schedule verification
  monte_carlo.py            Market scenario simulation
  test_simulation.py        50 unit tests
```

## Quick Start

```bash
# Smart contracts
cd contracts && forge install && forge test -vvv

# Economic simulation
pip install -r simulation/requirements.txt
python -m pytest simulation/test_simulation.py -v
python simulation/halving_check.py
```

## Security

**Not audited. Do not deploy with real funds.**

Security hardening applied: CEI pattern, ReentrancyGuard, EIP-712 with malleability protection, Ownable2Step, deployer-gated initialization, pool-level accounting enforcement. See [SECURITY.md](SECURITY.md).

## Documentation

- [Paper](PAPER.md) — Full protocol paper ([日本語版](PAPER_ja.md))
- [Economic Model](ECONOMIC_MODEL.md) — Mathematical specification
- [Position Paper](POSITION_PAPER.md) — TEE justification
- [Contributing](CONTRIBUTING.md) — Development setup and guidelines

## Status

- [x] Smart contracts + 103 automated tests
- [x] Economic simulation + Monte Carlo verification
- [ ] Professional security audit
- [ ] Agent runtime (Rust + LLM in TEE)
- [ ] Testnet deployment (Arbitrum Sepolia)

## License

[Apache-2.0](LICENSE)
