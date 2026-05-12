# Security Policy

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

If you discover a security vulnerability in the Sealed Trade Protocol smart contracts, simulation code, or documentation, please report it responsibly:

1. Email: Create a private security advisory on GitHub via [Security Advisories](https://github.com/ShotaNagafuchi/sealed-trade-protocol/security/advisories/new)
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 7 days
- **Fix development**: Depends on severity
- **Public disclosure**: After fix is deployed and verified

## Scope

### In Scope
- Smart contracts in `contracts/src/`
- Economic model logic in `simulation/`
- Deployment scripts in `contracts/script/`

### Out of Scope
- Test files (`contracts/test/`)
- Documentation content (unless it reveals sensitive information)
- Third-party dependencies (report upstream)

## Severity Classification

| Severity | Description | Example |
|----------|-------------|---------|
| Critical | Direct loss of funds | Reentrancy draining BondVault, unauthorized bond release |
| High | Indirect loss of funds or protocol manipulation | Bond calculation bypass, fee accounting manipulation |
| Medium | Protocol degradation without direct fund loss | Accounting desync, gas griefing |
| Low | Minor issues with no fund risk | Informational findings, style issues |

## Audit Status

This protocol has not yet undergone a professional security audit. A formal audit by a recognized firm (Trail of Bits, OpenZeppelin, or equivalent) is required before any mainnet deployment.

## Disclaimer

The Sealed Trade Protocol smart contracts are provided as-is and have not been audited. Do not use in production with real funds until a professional audit has been completed.
