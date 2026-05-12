"""
Unit tests for the Sealed Trade Protocol economic model.

Run: python3 -m pytest simulation/test_simulation.py -v
"""

import unittest

from sealed_economics import (
    FEE_BPS,
    bond_required, protocol_fee, total_bond_at_execution,
    trade_cost, bond_escalation_cost, analyze_trade,
)


class TestBondRequired(unittest.TestCase):
    def test_discovery_normal(self):
        self.assertEqual(bond_required(10_000, 'discovery'), 100)

    def test_discovery_minimum(self):
        self.assertEqual(bond_required(70, 'discovery'), 1)

    def test_discovery_maximum(self):
        self.assertEqual(bond_required(1_000_000, 'discovery'), 1_000)

    def test_negotiation_normal(self):
        self.assertEqual(bond_required(10_000, 'negotiation'), 300)

    def test_negotiation_minimum(self):
        self.assertEqual(bond_required(70, 'negotiation'), 5)

    def test_execution_normal(self):
        self.assertEqual(bond_required(10_000, 'execution'), 1_000)

    def test_execution_minimum(self):
        self.assertEqual(bond_required(70, 'execution'), 10)

    def test_execution_maximum(self):
        self.assertEqual(bond_required(1_000_000, 'execution'), 50_000)

    def test_genesis_trade_bonds(self):
        self.assertEqual(bond_required(70, 'discovery'), 1)
        self.assertEqual(bond_required(70, 'negotiation'), 5)
        self.assertEqual(bond_required(70, 'execution'), 10)


class TestProtocolFee(unittest.TestCase):
    def test_fee_calculation(self):
        self.assertAlmostEqual(protocol_fee(10_000), 30)

    def test_genesis_fee(self):
        self.assertAlmostEqual(protocol_fee(70), 0.21)

    def test_fee_bps(self):
        self.assertEqual(FEE_BPS, 30)


class TestTradeCost(unittest.TestCase):
    def test_non_recoverable_cost_is_fee_only(self):
        """Bonds are returned on settlement; only the fee is a real cost."""
        self.assertAlmostEqual(trade_cost(10_000), 30)
        self.assertAlmostEqual(trade_cost(1_000_000), 3_000)

    def test_total_bond_at_execution(self):
        self.assertEqual(total_bond_at_execution(10_000), 1_000)
        self.assertEqual(total_bond_at_execution(70), 10)


class TestBondEscalation(unittest.TestCase):
    def test_discovery_to_negotiation(self):
        dv = 10_000
        additional = bond_escalation_cost(dv, 'discovery', 'negotiation')
        self.assertEqual(additional, 200)  # 300 - 100

    def test_negotiation_to_execution(self):
        dv = 10_000
        additional = bond_escalation_cost(dv, 'negotiation', 'execution')
        self.assertEqual(additional, 700)  # 1000 - 300


class TestAnalyzeTrade(unittest.TestCase):
    def test_standard_trade(self):
        t = analyze_trade(10_000)
        self.assertEqual(t.deal_value, 10_000)
        self.assertEqual(t.discovery_bond, 100)
        self.assertEqual(t.negotiation_bond, 300)
        self.assertEqual(t.execution_bond, 1_000)
        self.assertAlmostEqual(t.fee, 30)
        self.assertAlmostEqual(t.seller_proceeds, 9_970)
        self.assertAlmostEqual(t.non_recoverable_cost, 30)

    def test_genesis_trade(self):
        t = analyze_trade(70)
        self.assertEqual(t.discovery_bond, 1)
        self.assertEqual(t.negotiation_bond, 5)
        self.assertEqual(t.execution_bond, 10)
        self.assertAlmostEqual(t.fee, 0.21)

    def test_large_trade_capped_bonds(self):
        t = analyze_trade(10_000_000)
        self.assertEqual(t.discovery_bond, 1_000)     # capped
        self.assertEqual(t.negotiation_bond, 5_000)    # capped
        self.assertEqual(t.execution_bond, 50_000)     # capped
        self.assertAlmostEqual(t.fee, 30_000)


if __name__ == '__main__':
    unittest.main()
