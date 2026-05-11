# Sealed Trade Protocol — Economic Model

## Token Supply

| Parameter | Value |
|-----------|-------|
| Total Supply | 100,000,000 SEAL |
| Treasury Allocation | 5,000,000 SEAL (5%) |
| Mining Allocation | 95,000,000 SEAL (95%) |
| Token Standard | ERC-20 (with ERC-20 Permit) |
| Decimals | 18 |

All tokens are minted at deployment. No inflation.

## Halving Schedule

Mining rewards follow a Bitcoin-inspired halving model based on **cumulative trade volume** rather than block height.

### Period Definitions

| Period | Volume in Period | Cumulative Volume | SEAL Allocated | Mining Rate (SEAL/$1) |
|--------|-----------------|-------------------|----------------|----------------------|
| 0 | $10,000 | $10,000 | 47,500,000 | 4,750.0000 |
| 1 | $10,000 | $20,000 | 23,750,000 | 2,375.0000 |
| 2 | $20,000 | $40,000 | 11,875,000 | 593.7500 |
| 3 | $40,000 | $80,000 | 5,937,500 | 148.4375 |
| 4 | $80,000 | $160,000 | 2,968,750 | 37.1094 |
| 5 | $160,000 | $320,000 | 1,484,375 | 9.2773 |
| ... | ... | ... | ... | ... |
| 21 | $10,485,760,000 | $20,971,520,000 | 23 | ~0 |

**Total cumulative volume to fully mine: ~$21 billion.**

### Formulas

**Cumulative volume threshold** at end of period n:

```
cumulative_threshold(n) = $10,000 × 2^n
```

**Volume within period n:**

```
volume(0) = $10,000
volume(n) = $10,000 × 2^(n-1)    for n ≥ 1
```

**SEAL allocation for period n:**

```
allocation(n) = 47,500,000 / 2^n
```

The geometric series sums to approximately 95M SEAL (with ~22.65 SEAL dust remaining after 22 periods).

**Mining rate** (SEAL per $1 of trade volume):

```
rate(n) = allocation(n) / volume(n)
```

## Contribution Score

Each participant earns a contribution score that determines their share of mining rewards.

### Trade Contribution

When a trade settles at value `V`:
- Buyer receives score: `V / 2`
- Seller receives score: `V / 2`

### Geometric Decay

Scores decay by 50% for each halving boundary crossed:

```
C_i(t) = Σ_{j ∈ trades of i} deal_value_j × (1/2)^(halvings_between(j, t))
```

This ensures early contributors are rewarded but cannot permanently dominate.

### Stake Contribution

Participants who stake USDC earn additional score:

```
stake_score = amount_usd × duration_seconds × λ_stake × (1/2)^(halvings_elapsed)

λ_stake = 1 × 10^-9  (per second per dollar)
```

### Reward Distribution

For each finalized period, a contributor's reward is:

```
reward_i = period_allocation × (score_i / total_score)
```

Distribution uses a pull-based pattern — contributors call `claimReward(period)`.

## Fee Structure

| Fee | Rate | Recipient |
|-----|------|-----------|
| Protocol fee | 0.3% of deal value | Treasury |

Collected at trade settlement.

## Bond Requirements

Bonds are denominated in USDC with minimum and maximum bounds:

| Stage | Rate | Minimum | Maximum |
|-------|------|---------|---------|
| Discovery | 1% of deal value | $1 | $1,000 |
| Negotiation | 3% of deal value | $5 | $5,000 |
| Execution | 10% of deal value | $10 | $50,000 |

**Bond escalation is additive.** When progressing from Discovery to Negotiation, the participant pays the difference (2%), not the full 3%.

### Slash Mechanics

On dispute during negotiation:
- 50% of slashed bond → counterparty
- 50% of slashed bond → Treasury insurance pool

### Genesis Trade Example (¥10,000 ≈ $70)

```
Discovery bond:    $1   (minimum applies)
Negotiation bond:  $5   (minimum applies)
Execution bond:    $10  (minimum applies)
Protocol fee:      $0.21

SEAL mined (genesis trader as both parties):
  Buyer side:  $70 × 4,750 / 2 = 166,250 SEAL
  Seller side: $70 × 4,750 / 2 = 166,250 SEAL
  Total: 332,500 SEAL ≈ 0.33% of supply
```

## Insurance Pool

The Treasury maintains an insurance pool funded by:
1. Initial seed ($50K USDC from deployer)
2. 50% of slashed bonds
3. Protocol fee allocation (governance-controlled)

Insurance covers TEE breach claims — situations where the hardware confidentiality guarantee fails and trade information leaks.

## Governance

The 5M SEAL treasury allocation enables future governance:
- Protocol parameter changes (fee rate, bond percentages)
- Insurance pool management
- Ecosystem grants
- Bug bounty funding

Initially owner-controlled, transitioning to token-weighted governance.
