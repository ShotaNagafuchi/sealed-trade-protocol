# Sealed Trade Protocol

[![CI](https://github.com/ShotaNagafuchi/sealed-trade-protocol/actions/workflows/ci.yml/badge.svg)](https://github.com/ShotaNagafuchi/sealed-trade-protocol/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636.svg)](https://soliditylang.org/)

**A protocol that reduces the leakage of private information in bilateral trade.**

## The Problem

In private markets — IP licensing, M&A, real estate — negotiation itself leaks information. When a buyer expresses interest, the seller learns there is demand. When a seller lists an asset, the buyer learns there is urgency. Every offer, counteroffer, and hesitation becomes a signal that the counterparty can exploit.

This is the **information double-use problem**: the information you share to reach a deal is reused to worsen your terms.

## The Solution

Sealed Trade confines negotiation to AI agents inside hardware-isolated enclaves (TEE). Neither party can observe the negotiation. Only the outcome crosses the boundary: an agreement, or "no deal."

```
 Seller                                                        Buyer
   |                                                              |
   |  [signs parameters: min price, terms]    [signs parameters: max price, terms]
   |              |                                               |
   |              v                                               v
   |    +-----------------------TEE Enclave-----------------------+
   |    |  Seller Agent  <-- A2A Protocol -->  Buyer Agent        |
   |    |  (LLM in TEE)     signed messages    (LLM in TEE)       |
   |    |                                                         |
   |    |  * Neither agent can exfiltrate data                    |
   |    |  * Memory destroyed after negotiation                   |
   |    |  * Only outcome (agree/no-deal) exits the enclave       |
   |    +--------------------------+------------------------------+
   |                               |
   |                               v
   |                    Smart Contracts (L2)
   |                    Escrow · Bond · Insurance
   |                               |
   +-------------------------------+------------------------------+
                           Settlement
```

### Why Smart Contracts

Agent-to-agent settlement requires a programmable, permissionless payment rail. Traditional payments (bank transfers, credit cards) need human approval and take hours. Stablecoin on L2 provides sub-second finality with full programmability — the only rail compatible with autonomous agent operation.

Smart contracts provide: atomic settlement (deal value and bond release in one transaction), programmatic bond escalation, and an immutable audit trail.

### Why TEE

| Approach | Why it doesn't work here |
|----------|--------------------------|
| MPC | Requires predefined circuits — can't support free-form LLM negotiation |
| FHE | Orders of magnitude too slow for LLM inference |
| ZKP | Proves correctness but can't seal arbitrary negotiation content |
| Trusted broker | No technical enforcement — trust is the product, and trust fails |

TEE requires trusting the hardware vendor — a different class of assumption than mathematical hardness, but one with a 10+ year operational track record. The insurance pool provides economic recourse if the guarantee fails.

## Economic Design

### Bonds

Every trade participant posts collateral that escalates with commitment:

| Stage | Bond | Min | Max |
|-------|------|-----|-----|
| Discovery | 1% of deal value | $1 | $1,000 |
| Negotiation | 3% of deal value | $5 | $5,000 |
| Execution | 10% of deal value | $10 | $50,000 |

Bonds are returned on settlement. On dispute, the faulty party's bond is slashed: 50% to counterparty, 50% to insurance pool.

### Fee

0.3% of deal value on settlement. This is the only non-recoverable cost.

### Insurance Pool

Funded by protocol fees and slashed bonds. Provides economic recourse for enclave breach claims. Pool balance and claim history are publicly verifiable on-chain.

## Repository

```
contracts/src/
  SealedTrade.sol       Trade lifecycle + escrow (EIP-712 signatures)
  BondVault.sol         3-stage bond escrow
  Treasury.sol          Fee vault + insurance pool
  MockUSDC.sol          Test USDC with open mint (testnet only)

frontend/               Next.js demo UI (wagmi + Sepolia testnet)

simulation/
  sealed_economics.py   Bond and fee calculations
  test_simulation.py    Unit tests
```

## Try It (Testnet Demo)

> Requires a browser wallet (MetaMask) connected to **Sepolia**.

1. Visit the demo: **https://frontend-five-xi-i81goehc6k.vercel.app/**
2. Connect your wallet and switch to Sepolia
3. Click **"Get 10K USDC"** to mint test tokens
4. **Seller**: List an asset with a max deal value and deadline
5. **Buyer** (different wallet): Express interest on the listing
6. Progress through Negotiation → Agreement → Settlement

No real funds are involved — MockUSDC is used on testnet.

## Quick Start (Development)

Requires: [Foundry](https://getfoundry.sh/), Node.js 20+, Python 3.10+, Git with submodule support.

```bash
git clone --recurse-submodules https://github.com/ShotaNagafuchi/sealed-trade-protocol.git
cd sealed-trade-protocol

# Smart contracts
cd contracts && forge build && forge test -vvv

# Economic simulation
pip install -r simulation/requirements.txt
python -m pytest simulation/test_simulation.py -v

# Frontend (development server)
cd ../frontend && npm install && npm run dev
```

## Security

**Not audited. Do not deploy with real funds.**

Security hardening: CEI pattern, ReentrancyGuard, EIP-712 with malleability protection, Ownable2Step, deployer-gated initialization, pool-level accounting enforcement. See [SECURITY.md](SECURITY.md).

## Documentation

- [Paper](PAPER.md) — Full protocol paper ([PDF](paper/sealed-trade-protocol.pdf)) ([日本語版](PAPER_ja.md) / [PDF](paper/sealed-trade-protocol_ja.pdf))
- [Contributing](CONTRIBUTING.md) — Development setup and guidelines

## Status

- [x] Smart contracts (settlement layer) + 32 automated tests
- [x] Frontend demo UI (Next.js + wagmi)
- [x] Testnet deployment script (Sepolia)
- [ ] **Agent runtime — the TEE-confined negotiation engine (next milestone)**
- [ ] Professional security audit

## License

[Apache-2.0](LICENSE)
