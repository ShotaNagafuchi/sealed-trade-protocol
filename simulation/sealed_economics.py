"""
Sealed Trade Protocol — Economic Model Reference Implementation

Canonical Python implementation of all economic formulas.
Used to validate smart contract logic and run simulations.
"""

from dataclasses import dataclass
from typing import List, Tuple

# --- Constants ---
TOTAL_SUPPLY = 100_000_000        # 100M SEAL
TREASURY_ALLOCATION = 5_000_000   # 5M SEAL
MINING_ALLOCATION = 95_000_000    # 95M SEAL
INITIAL_PERIOD_ALLOCATION = 47_500_000  # 47.5M SEAL (period 0)
HALVING_INITIAL_USD = 10_000      # $10K first halving threshold
MAX_PERIODS = 22
FEE_BPS = 30                      # 0.3%
STAKE_LAMBDA = 1e-9               # per second per dollar


def period_allocation(n: int) -> float:
    """SEAL tokens minted in period n. Geometric series: 47.5M / 2^n."""
    if n >= MAX_PERIODS:
        return 0.0
    return INITIAL_PERIOD_ALLOCATION / (2 ** n)


def period_volume(n: int) -> float:
    """Volume (USD) within period n.

    Period 0: $10K, Period 1: $10K, Period 2: $20K, Period 3: $40K, ...
    Formula: $10K * 2^max(0, n-1) — periods 0 and 1 share the same volume.
    """
    if n <= 0:
        return HALVING_INITIAL_USD
    return HALVING_INITIAL_USD * (2 ** (n - 1))


# Keep old name as alias for backwards compat in tests
period_threshold = period_volume


def cumulative_threshold(n: int) -> float:
    """Cumulative volume (USD) at which period n ends.

    Period 0 ends at $10K, period 1 at $20K, period 2 at $40K, ...
    Formula: $10K * 2^n.
    """
    return HALVING_INITIAL_USD * (2 ** n)


def cumulative_mined(through_period: int) -> float:
    """Total SEAL mined through the end of given period."""
    total = 0.0
    for i in range(min(through_period + 1, MAX_PERIODS)):
        total += period_allocation(i)
    return total


def mining_rate(period: int) -> float:
    """SEAL per $1 of trade volume in period n."""
    if period >= MAX_PERIODS:
        return 0.0
    return period_allocation(period) / period_volume(period)


def contribution_score(deal_value: float, periods_elapsed: int, decay: float = 0.5) -> float:
    """Contribution score with geometric decay across halving boundaries."""
    return deal_value * (decay ** periods_elapsed)


def bond_required(deal_value: float, stage: str) -> float:
    """Bond amount for a given stage. Returns USD.
    Stages: 'discovery' (1%), 'negotiation' (3%), 'execution' (10%).
    Each has min/max bounds.
    """
    stages = {
        'discovery':    {'bps': 100,  'min': 1,     'max': 1_000},
        'negotiation':  {'bps': 300,  'min': 5,     'max': 5_000},
        'execution':    {'bps': 1000, 'min': 10,    'max': 50_000},
    }
    s = stages[stage.lower()]
    computed = deal_value * s['bps'] / 10_000
    return max(s['min'], min(s['max'], computed))


def protocol_fee(deal_value: float) -> float:
    """0.3% protocol fee on settlement."""
    return deal_value * FEE_BPS / 10_000


def total_bond_lock(deal_value: float) -> float:
    """Total bond required at Execution stage (cumulative)."""
    return bond_required(deal_value, 'execution')


def stake_score(amount_usd: float, duration_seconds: float, periods_elapsed: int = 0) -> float:
    """Score contribution from staking. λ_stake = 1e-9 per second per dollar."""
    raw = amount_usd * duration_seconds * STAKE_LAMBDA
    return raw * (0.5 ** periods_elapsed)


# --- Simulation helpers ---

@dataclass
class TradeEvent:
    deal_value: float  # USD
    buyer: str
    seller: str
    period: int


@dataclass
class SimulationState:
    cumulative_volume: float = 0.0
    current_period: int = 0
    total_mined: float = 0.0
    scores: dict = None  # address -> score
    trades: list = None

    def __post_init__(self):
        if self.scores is None:
            self.scores = {}
        if self.trades is None:
            self.trades = []


def simulate_trade(state: SimulationState, deal_value: float, buyer: str, seller: str) -> TradeEvent:
    """Simulate a single trade and update state."""
    period = state.current_period

    # Record contribution (split between buyer and seller)
    half = deal_value / 2
    state.scores[buyer] = state.scores.get(buyer, 0) + half
    state.scores[seller] = state.scores.get(seller, 0) + half

    # Update volume
    state.cumulative_volume += deal_value

    # Check halving
    while (state.current_period < MAX_PERIODS and
           state.cumulative_volume >= cumulative_threshold(state.current_period)):
        state.total_mined += period_allocation(state.current_period)
        state.current_period += 1

    trade = TradeEvent(deal_value, buyer, seller, period)
    state.trades.append(trade)
    return trade


def simulate_genesis(num_trades: int = 100, deal_value: float = 70.0) -> SimulationState:
    """Simulate the genesis self-trading phase.

    Default: 100 trades of $70 each (¥10,000) = $7,000 cumulative.
    """
    state = SimulationState()
    for i in range(num_trades):
        simulate_trade(state, deal_value, "genesis", "genesis")
    return state


def halving_table(max_period: int = MAX_PERIODS) -> List[dict]:
    """Generate the halving schedule table."""
    table = []
    cum_mined = 0.0
    for n in range(max_period):
        alloc = period_allocation(n)
        cum_mined += alloc
        vol = period_volume(n)
        cum_vol = cumulative_threshold(n)
        rate = mining_rate(n)
        table.append({
            'period': n,
            'volume_in_period': vol,
            'cumulative_volume': cum_vol,
            'allocation': alloc,
            'cumulative_mined': cum_mined,
            'mining_rate': rate,
            'remaining_supply': MINING_ALLOCATION - cum_mined,
        })
    return table


if __name__ == '__main__':
    print("=== Sealed Trade Protocol — Economic Model ===\n")

    print("--- Halving Schedule ---")
    table = halving_table()
    print(f"{'Period':>6} {'Vol in Period':>15} {'Cumul Volume':>15} {'Allocation':>15} {'Cumul Mined':>15} {'Rate (SEAL/$)':>15}")
    for row in table:
        print(f"{row['period']:>6} {row['volume_in_period']:>15,.0f} {row['cumulative_volume']:>15,.0f} "
              f"{row['allocation']:>15,.0f} {row['cumulative_mined']:>15,.0f} {row['mining_rate']:>15,.4f}")

    print(f"\nTotal mined (all periods): {cumulative_mined(MAX_PERIODS - 1):,.2f} SEAL")
    print(f"Mining allocation:         {MINING_ALLOCATION:,.0f} SEAL")
    print(f"Difference:                {MINING_ALLOCATION - cumulative_mined(MAX_PERIODS - 1):,.4f} SEAL")

    print("\n--- Genesis Trade Simulation ---")
    genesis = simulate_genesis()
    print(f"Trades: {len(genesis.trades)}")
    print(f"Cumulative volume: ${genesis.cumulative_volume:,.0f}")
    print(f"Current period: {genesis.current_period}")
    print(f"Genesis score: {genesis.scores.get('genesis', 0):,.0f}")
    print(f"Genesis SEAL (if only contributor): {period_allocation(0) * genesis.scores['genesis'] / genesis.scores['genesis']:,.0f}")

    print("\n--- Genesis Trade Bonds ---")
    dv = 70  # $70
    print(f"Deal value: ${dv}")
    print(f"Discovery bond:    ${bond_required(dv, 'discovery'):,.2f}")
    print(f"Negotiation bond:  ${bond_required(dv, 'negotiation'):,.2f}")
    print(f"Execution bond:    ${bond_required(dv, 'execution'):,.2f}")
    print(f"Protocol fee:      ${protocol_fee(dv):,.2f}")
