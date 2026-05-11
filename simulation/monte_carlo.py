"""
Monte Carlo simulation of Sealed Trade Protocol market scenarios.

Simulates random deal arrivals and sizes to project:
- Time to exhaust mining supply
- Token distribution (Gini coefficient)
- Period progression under various market conditions
"""

import argparse
import sys
from dataclasses import dataclass, field
from typing import Dict, List

import numpy as np

from sealed_economics import (
    MINING_ALLOCATION, MAX_PERIODS, HALVING_INITIAL_USD,
    period_allocation, cumulative_threshold, protocol_fee,
    simulate_trade, SimulationState,
)


@dataclass
class MarketScenario:
    """Parameters for a market simulation."""
    daily_trade_rate: float = 2.0       # average trades per day (Poisson λ)
    deal_size_mu: float = 7.0           # log-normal mean (ln USD), e^7 ≈ $1,096
    deal_size_sigma: float = 1.5        # log-normal std dev
    num_traders: int = 50               # distinct trader population
    max_days: int = 3650                # 10 years max
    label: str = "default"


@dataclass
class SimResult:
    """Results from a single simulation run."""
    days_to_complete: int = 0
    final_period: int = 0
    total_volume: float = 0.0
    total_fees: float = 0.0
    num_trades: int = 0
    trader_scores: Dict[str, float] = field(default_factory=dict)
    period_history: List[int] = field(default_factory=list)


def gini_coefficient(values: np.ndarray) -> float:
    """Compute Gini coefficient (0 = perfect equality, 1 = max inequality)."""
    if len(values) == 0 or np.sum(values) == 0:
        return 0.0
    sorted_vals = np.sort(values)
    n = len(sorted_vals)
    index = np.arange(1, n + 1)
    return (2 * np.sum(index * sorted_vals) - (n + 1) * np.sum(sorted_vals)) / (n * np.sum(sorted_vals))


def run_simulation(scenario: MarketScenario, rng: np.random.Generator) -> SimResult:
    """Run a single Monte Carlo simulation."""
    state = SimulationState()
    result = SimResult()
    traders = [f"trader_{i}" for i in range(scenario.num_traders)]

    for day in range(scenario.max_days):
        # Poisson-distributed number of trades per day
        num_trades_today = rng.poisson(scenario.daily_trade_rate)

        for _ in range(num_trades_today):
            # Log-normal deal size
            deal_value = rng.lognormal(scenario.deal_size_mu, scenario.deal_size_sigma)
            deal_value = max(10.0, deal_value)  # minimum $10

            # Random buyer and seller (distinct)
            buyer, seller = rng.choice(traders, size=2, replace=False)

            simulate_trade(state, deal_value, buyer, seller)
            result.total_fees += protocol_fee(deal_value)
            result.num_trades += 1

        result.period_history.append(state.current_period)

        # Check if mining is exhausted
        if state.current_period >= MAX_PERIODS:
            result.days_to_complete = day + 1
            break
    else:
        result.days_to_complete = scenario.max_days

    result.final_period = state.current_period
    result.total_volume = state.cumulative_volume
    result.trader_scores = dict(state.scores)
    return result


def run_monte_carlo(
    scenario: MarketScenario,
    num_simulations: int = 1000,
    seed: int = 42,
) -> Dict:
    """Run multiple simulations and aggregate results."""
    rng = np.random.default_rng(seed)

    days_to_complete = []
    final_periods = []
    total_volumes = []
    total_fees = []
    gini_values = []

    for i in range(num_simulations):
        result = run_simulation(scenario, rng)
        days_to_complete.append(result.days_to_complete)
        final_periods.append(result.final_period)
        total_volumes.append(result.total_volume)
        total_fees.append(result.total_fees)

        if result.trader_scores:
            scores = np.array(list(result.trader_scores.values()))
            gini_values.append(gini_coefficient(scores))

    days = np.array(days_to_complete)
    completed = days < scenario.max_days

    return {
        'scenario': scenario.label,
        'num_simulations': num_simulations,
        'completion_rate': np.mean(completed),
        'days_median': np.median(days[completed]) if np.any(completed) else float('inf'),
        'days_p25': np.percentile(days[completed], 25) if np.any(completed) else float('inf'),
        'days_p75': np.percentile(days[completed], 75) if np.any(completed) else float('inf'),
        'volume_median': np.median(total_volumes),
        'fees_median': np.median(total_fees),
        'gini_median': np.median(gini_values) if gini_values else 0,
        'gini_p90': np.percentile(gini_values, 90) if gini_values else 0,
        'final_period_median': np.median(final_periods),
    }


def main():
    parser = argparse.ArgumentParser(description="Monte Carlo simulation of Sealed Trade Protocol")
    parser.add_argument('--simulations', type=int, default=1000, help='Number of simulations')
    parser.add_argument('--seed', type=int, default=42, help='Random seed')
    args = parser.parse_args()

    scenarios = [
        MarketScenario(
            daily_trade_rate=1.0,
            deal_size_mu=6.0,       # ~$400 avg
            deal_size_sigma=1.0,
            num_traders=20,
            label="conservative",
        ),
        MarketScenario(
            daily_trade_rate=5.0,
            deal_size_mu=7.5,       # ~$1,800 avg
            deal_size_sigma=1.5,
            num_traders=100,
            label="moderate",
        ),
        MarketScenario(
            daily_trade_rate=20.0,
            deal_size_mu=9.0,       # ~$8,100 avg
            deal_size_sigma=2.0,
            num_traders=500,
            label="aggressive",
        ),
    ]

    print("=" * 80)
    print("Sealed Trade Protocol — Monte Carlo Simulation")
    print(f"Simulations per scenario: {args.simulations}")
    print(f"Random seed: {args.seed}")
    print("=" * 80)

    for scenario in scenarios:
        print(f"\n--- Scenario: {scenario.label} ---")
        print(f"  Daily trade rate:  {scenario.daily_trade_rate}")
        print(f"  Deal size (median): ${np.exp(scenario.deal_size_mu):,.0f}")
        print(f"  Traders:           {scenario.num_traders}")

        results = run_monte_carlo(scenario, args.simulations, args.seed)

        print(f"\n  Results:")
        print(f"  Completion rate:    {results['completion_rate']:.1%}")
        if results['days_median'] != float('inf'):
            print(f"  Days to complete:   {results['days_median']:.0f} (p25={results['days_p25']:.0f}, p75={results['days_p75']:.0f})")
            print(f"  Years to complete:  {results['days_median']/365:.1f}")
        else:
            print(f"  Did not complete within {scenario.max_days} days")
        print(f"  Median volume:      ${results['volume_median']:,.0f}")
        print(f"  Median fees:        ${results['fees_median']:,.0f}")
        print(f"  Final period:       {results['final_period_median']:.0f}")
        print(f"  Gini (median):      {results['gini_median']:.3f}")
        print(f"  Gini (p90):         {results['gini_p90']:.3f}")

    print("\n" + "=" * 80)
    print("Interpretation:")
    print("  Gini < 0.3 = equitable distribution")
    print("  Gini 0.3-0.5 = moderate inequality (typical)")
    print("  Gini > 0.5 = concentrated distribution")
    print("=" * 80)


if __name__ == '__main__':
    main()
