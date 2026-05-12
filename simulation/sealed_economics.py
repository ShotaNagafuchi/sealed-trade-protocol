"""
Sealed Trade Protocol — Economic Model Reference Implementation

Bond calculation, fee structure, and trade cost analysis.
No token mining — the protocol charges fees for utility, not token rewards.
"""

from dataclasses import dataclass
from typing import Dict

# --- Constants ---
FEE_BPS = 30  # 0.3%


def bond_required(deal_value: float, stage: str) -> float:
    """Bond amount for a given stage. Returns USD.

    Stages: 'discovery' (1%), 'negotiation' (3%), 'execution' (10%).
    Each has min/max bounds.
    """
    stages: Dict[str, Dict[str, float]] = {
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


def total_bond_at_execution(deal_value: float) -> float:
    """Total bond locked per party at execution stage."""
    return bond_required(deal_value, 'execution')


def trade_cost(deal_value: float) -> float:
    """Non-recoverable cost of a trade (fee only; bonds are returned on settlement)."""
    return protocol_fee(deal_value)


def bond_escalation_cost(deal_value: float, from_stage: str, to_stage: str) -> float:
    """Additional bond required to escalate from one stage to the next."""
    return bond_required(deal_value, to_stage) - bond_required(deal_value, from_stage)


@dataclass
class TradeAnalysis:
    """Full cost breakdown for a trade at a given deal value."""
    deal_value: float
    discovery_bond: float
    negotiation_bond: float
    execution_bond: float
    fee: float
    seller_proceeds: float
    total_bond_per_party: float
    non_recoverable_cost: float


def analyze_trade(deal_value: float) -> TradeAnalysis:
    """Compute full cost breakdown for a trade."""
    disc = bond_required(deal_value, 'discovery')
    neg = bond_required(deal_value, 'negotiation')
    exe = bond_required(deal_value, 'execution')
    fee = protocol_fee(deal_value)

    return TradeAnalysis(
        deal_value=deal_value,
        discovery_bond=disc,
        negotiation_bond=neg,
        execution_bond=exe,
        fee=fee,
        seller_proceeds=deal_value - fee,
        total_bond_per_party=exe,  # execution is the final (additive) bond
        non_recoverable_cost=fee,  # bonds are returned on settlement
    )


if __name__ == '__main__':
    print("=== Sealed Trade Protocol — Trade Cost Analysis ===\n")

    test_values = [70, 1_000, 10_000, 100_000, 1_000_000, 10_000_000]

    print(f"{'Deal Value':>12} {'Disc Bond':>10} {'Neg Bond':>10} {'Exec Bond':>10} "
          f"{'Fee':>10} {'Seller Gets':>12} {'Cost':>10}")
    print("-" * 80)

    for dv in test_values:
        t = analyze_trade(dv)
        print(f"${t.deal_value:>11,.0f} ${t.discovery_bond:>9,.0f} ${t.negotiation_bond:>9,.0f} "
              f"${t.execution_bond:>9,.0f} ${t.fee:>9,.2f} ${t.seller_proceeds:>11,.2f} "
              f"${t.non_recoverable_cost:>9,.2f}")
