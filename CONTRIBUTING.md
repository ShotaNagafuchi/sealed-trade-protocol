# Contributing to Sealed Trade Protocol

Thank you for your interest in contributing. This document explains how to get started.

## Development Setup

### Prerequisites

- [Foundry](https://getfoundry.sh/) (Solidity toolchain)
- Python 3.10+ with pip
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ShotaNagafuchi/sealed-trade-protocol.git
cd sealed-trade-protocol

# Install Solidity dependencies
cd contracts
forge install
forge build
forge test

# Install Python dependencies
cd ../simulation
pip install -r requirements.txt
python -m pytest test_simulation.py -v
```

## How to Contribute

### Reporting Bugs

Open a [GitHub Issue](https://github.com/ShotaNagafuchi/sealed-trade-protocol/issues/new?template=bug_report.md) with:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Foundry version, OS, etc.)

### Suggesting Features

Open a [Feature Request](https://github.com/ShotaNagafuchi/sealed-trade-protocol/issues/new?template=feature_request.md) with:
- Problem description
- Proposed solution
- Alternatives considered

### Submitting Code

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Write tests first (TDD)
4. Implement your changes
5. Ensure all tests pass:
   ```bash
   cd contracts && forge test
   cd ../simulation && python -m pytest test_simulation.py -v
   ```
6. Commit with conventional format: `feat: add XYZ` or `fix: resolve ABC`
7. Open a Pull Request against `main`

### Pull Request Requirements

- All existing tests must pass
- New code must include tests
- Solidity functions must have NatSpec documentation
- No hardcoded secrets or credentials
- Follow the existing code style

## Code Style

### Solidity
- Solidity 0.8.24+
- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use NatSpec for all public/external functions
- Checks-Effects-Interactions pattern for all state-mutating functions
- ReentrancyGuard on external functions that make transfers

### Python
- PEP 8 compliance
- Type annotations on function signatures
- Docstrings on all public functions

## Security

If you discover a security vulnerability, **do not open a public issue**. See [SECURITY.md](SECURITY.md) for responsible disclosure instructions.

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
