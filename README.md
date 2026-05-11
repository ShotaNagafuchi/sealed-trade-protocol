# Sealed Trade Protocol

[![CI](https://github.com/ShotaNagafuchi/sealed-trade-protocol/actions/workflows/ci.yml/badge.svg)](https://github.com/ShotaNagafuchi/sealed-trade-protocol/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636.svg)](https://soliditylang.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg)](https://python.org/)

Bilateral trade infrastructure with AI agent negotiation and hardware-enforced confidentiality.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Key Numbers](#key-numbers)
- [Documentation](#documentation)
- [Testing](#testing)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Overview

A protocol where two parties can negotiate and settle bilateral deals (IP licensing, M&A, real estate) without revealing private valuations to anyone — not each other, not an intermediary, not the protocol operator.

- **AI agents** negotiate on behalf of principals within signed parameter boundaries
- **TEE enclaves** (Intel TDX / AMD SEV-SNP) guarantee negotiation privacy at the kernel level
- **Smart contracts** handle bond escrow, fee collection, and mining rewards
- **Bitcoin-style mining** rewards early participants with SEAL tokens

## Architecture

```
Principal A --> [Signed Parameters] --> Agent A <--A2A--> Agent B <-- [Signed Parameters] <-- Principal B
                                           |        TEE Enclave        |
                                           +------------+--------------+
                                                        |
                                                        v
                                              Smart Contracts (L2)
                                           Bond - Fee - Mining - Attestation
```

## Repository Structure

```
contracts/          Solidity smart contracts (Foundry)
  src/
    SealToken.sol           ERC-20 token (100M fixed supply)
    SealedTrade.sol         Trade lifecycle orchestrator (EIP-712)
    BondVault.sol           3-stage bond escrow (ReentrancyGuard)
    ContributionLedger.sol  Mining rewards with halving
    Treasury.sol            Fee vault + insurance pool (Ownable2Step)
  test/                     Foundry tests (49 tests)
  script/                   Deployment scripts

simulation/         Python economic model
  sealed_economics.py       Reference implementation of all formulas
  halving_check.py          Halving schedule verification
  monte_carlo.py            Market scenario simulation
  test_simulation.py        Unit tests (50 tests)

agent/              Rust agent runtime (planned)
frontend/           Next.js web UI (planned)
```

## Requirements

- [Foundry](https://getfoundry.sh/) — Solidity toolchain
- Python 3.10+ — Economic simulation
- Git — With submodule support

## Quick Start

### Smart Contracts (Foundry)

```bash
cd contracts

# Install dependencies
forge install

# Build
forge build

# Test
forge test -vvv

# Gas report
forge test --gas-report
```

### Simulation (Python)

```bash
# Install dependencies
pip install -r simulation/requirements.txt

# Run unit tests
python -m pytest simulation/test_simulation.py -v

# Verify halving schedule
cd simulation && python halving_check.py

# Run Monte Carlo simulation
python monte_carlo.py --simulations 1000
```

### Deployment

```bash
cd contracts
cp .env.example .env
# Edit .env with your values

forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

## Key Numbers

| Parameter | Value |
|-----------|-------|
| Total SEAL supply | 100,000,000 |
| Treasury allocation | 5,000,000 (5%) |
| Mining allocation | 95,000,000 (95%) |
| Genesis trade | ~$70 (min viable) |
| First halving | $10,000 cumulative volume |
| Protocol fee | 0.3% |
| Bond (Execution) | 10% of deal value |
| Full mining volume | ~$21 billion |

## Documentation

- [Economic Model](ECONOMIC_MODEL.md) — Full mathematical specification
- [Position Paper](POSITION_PAPER.md) — TEE justification and protocol design
- [Security Policy](SECURITY.md) — Vulnerability reporting

## Testing

The project has **99 automated tests** across two test suites:

| Suite | Tests | Framework | Coverage |
|-------|-------|-----------|----------|
| Solidity | 49 | Foundry | Contracts |
| Python | 50 | pytest | Economic model |

```bash
# Run everything
cd contracts && forge test && cd ../simulation && python -m pytest test_simulation.py -v
```

## Security

**This protocol has not been audited.** Do not deploy with real funds until a professional audit is completed.

Security hardening applied:
- Checks-Effects-Interactions (CEI) pattern throughout
- OpenZeppelin ReentrancyGuard on all state-mutating external functions
- EIP-712 typed signatures with malleability protection
- Ownable2Step for safe ownership transfer
- Deployer-gated initialization (front-running protection)
- Pool-level accounting enforcement on Treasury withdrawals

See [SECURITY.md](SECURITY.md) for vulnerability reporting instructions.

## Roadmap

- [x] Smart contracts (SealToken, SealedTrade, BondVault, ContributionLedger, Treasury)
- [x] Economic simulation and verification
- [x] Security hardening (CEI, ReentrancyGuard, EIP-712)
- [ ] Professional security audit
- [ ] Agent runtime (Rust + Llama in TEE)
- [ ] Frontend (Next.js)
- [ ] Testnet deployment (Arbitrum Sepolia)
- [ ] Mainnet deployment

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

## License

[Apache-2.0](LICENSE)
