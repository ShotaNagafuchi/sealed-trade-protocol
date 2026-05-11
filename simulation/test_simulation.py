"""
Unit tests for the Sealed Trade Protocol economic model.

Run: python3 -m pytest simulation/test_simulation.py -v
"""

import math
import unittest

from sealed_economics import (
    TOTAL_SUPPLY, TREASURY_ALLOCATION, MINING_ALLOCATION,
    INITIAL_PERIOD_ALLOCATION, HALVING_INITIAL_USD, MAX_PERIODS,
    period_allocation, period_volume, cumulative_threshold,
    cumulative_mined, mining_rate, contribution_score,
    bond_required, protocol_fee, total_bond_lock, stake_score,
    simulate_genesis, simulate_trade, SimulationState,
)


class TestConstants(unittest.TestCase):
    def test_total_supply(self):
        self.assertEqual(TOTAL_SUPPLY, 100_000_000)

    def test_allocation_split(self):
        self.assertEqual(TREASURY_ALLOCATION + MINING_ALLOCATION, TOTAL_SUPPLY)

    def test_initial_period_allocation(self):
        self.assertEqual(INITIAL_PERIOD_ALLOCATION, 47_500_000)


class TestPeriodAllocation(unittest.TestCase):
    def test_period_0(self):
        self.assertEqual(period_allocation(0), 47_500_000)

    def test_period_1(self):
        self.assertEqual(period_allocation(1), 23_750_000)

    def test_period_2(self):
        self.assertEqual(period_allocation(2), 11_875_000)

    def test_geometric_series_sums_to_95M(self):
        total = sum(period_allocation(n) for n in range(MAX_PERIODS))
        # Geometric series: 47.5M * (1 - 0.5^22) / (1 - 0.5) ≈ 95M
        # Residual: 47.5M / 2^22 ≈ 22.65 SEAL unmined (dust)
        self.assertAlmostEqual(total, MINING_ALLOCATION, delta=23.0)
        self.assertLessEqual(total, MINING_ALLOCATION)

    def test_beyond_max_periods_returns_zero(self):
        self.assertEqual(period_allocation(MAX_PERIODS), 0)
        self.assertEqual(period_allocation(100), 0)


class TestPeriodVolume(unittest.TestCase):
    def test_period_0(self):
        self.assertEqual(period_volume(0), 10_000)

    def test_period_1(self):
        """Period 1 also has $10K volume (same as period 0)."""
        self.assertEqual(period_volume(1), 10_000)

    def test_period_2(self):
        self.assertEqual(period_volume(2), 20_000)

    def test_period_3(self):
        self.assertEqual(period_volume(3), 40_000)

    def test_doubles_from_period_2_onward(self):
        for n in range(2, MAX_PERIODS):
            self.assertEqual(period_volume(n), period_volume(n - 1) * 2)


class TestCumulativeThreshold(unittest.TestCase):
    def test_period_0(self):
        self.assertEqual(cumulative_threshold(0), 10_000)

    def test_period_1(self):
        self.assertEqual(cumulative_threshold(1), 20_000)  # $10K * 2^1

    def test_period_2(self):
        self.assertEqual(cumulative_threshold(2), 40_000)  # $10K * 2^2

    def test_period_3(self):
        self.assertEqual(cumulative_threshold(3), 80_000)  # $10K * 2^3

    def test_formula(self):
        for n in range(MAX_PERIODS):
            expected = HALVING_INITIAL_USD * (2 ** n)
            self.assertEqual(cumulative_threshold(n), expected)

    def test_volume_sums(self):
        """Sum of period volumes should equal cumulative threshold."""
        for n in range(MAX_PERIODS):
            vol_sum = sum(period_volume(i) for i in range(n + 1))
            self.assertAlmostEqual(vol_sum, cumulative_threshold(n))


class TestCumulativeMined(unittest.TestCase):
    def test_through_period_0(self):
        self.assertEqual(cumulative_mined(0), 47_500_000)

    def test_through_period_1(self):
        self.assertEqual(cumulative_mined(1), 47_500_000 + 23_750_000)

    def test_never_exceeds_supply(self):
        for n in range(MAX_PERIODS):
            self.assertLessEqual(cumulative_mined(n), MINING_ALLOCATION + 1)


class TestMiningRate(unittest.TestCase):
    def test_period_0(self):
        # 47.5M / $10K = 4,750 SEAL/$
        self.assertAlmostEqual(mining_rate(0), 4_750, places=1)

    def test_period_1(self):
        # 23.75M / $10K = 2,375 SEAL/$
        self.assertAlmostEqual(mining_rate(1), 2_375, places=1)

    def test_period_2(self):
        # 11.875M / $20K = 593.75 SEAL/$
        self.assertAlmostEqual(mining_rate(2), 593.75, places=2)

    def test_period_3(self):
        # 5.9375M / $40K = 148.4375 SEAL/$
        self.assertAlmostEqual(mining_rate(3), 148.4375, places=2)

    def test_rate_decreases(self):
        for n in range(1, MAX_PERIODS):
            self.assertLess(mining_rate(n), mining_rate(n - 1))

    def test_beyond_max_returns_zero(self):
        self.assertEqual(mining_rate(MAX_PERIODS), 0)


class TestContributionScore(unittest.TestCase):
    def test_no_decay(self):
        self.assertEqual(contribution_score(1000, 0), 1000)

    def test_one_period_decay(self):
        self.assertEqual(contribution_score(1000, 1), 500)

    def test_two_period_decay(self):
        self.assertEqual(contribution_score(1000, 2), 250)

    def test_custom_decay(self):
        self.assertAlmostEqual(contribution_score(1000, 1, decay=0.7), 700)


class TestBondRequired(unittest.TestCase):
    def test_discovery_normal(self):
        # $10,000 × 1% = $100
        self.assertEqual(bond_required(10_000, 'discovery'), 100)

    def test_discovery_minimum(self):
        # $70 × 1% = $0.70, min $1
        self.assertEqual(bond_required(70, 'discovery'), 1)

    def test_discovery_maximum(self):
        # $1M × 1% = $10K, max $1K
        self.assertEqual(bond_required(1_000_000, 'discovery'), 1_000)

    def test_negotiation_normal(self):
        # $10,000 × 3% = $300
        self.assertEqual(bond_required(10_000, 'negotiation'), 300)

    def test_negotiation_minimum(self):
        # $70 × 3% = $2.10, min $5
        self.assertEqual(bond_required(70, 'negotiation'), 5)

    def test_execution_normal(self):
        # $10,000 × 10% = $1,000
        self.assertEqual(bond_required(10_000, 'execution'), 1_000)

    def test_execution_minimum(self):
        # $70 × 10% = $7, min $10
        self.assertEqual(bond_required(70, 'execution'), 10)

    def test_execution_maximum(self):
        # $1M × 10% = $100K, max $50K
        self.assertEqual(bond_required(1_000_000, 'execution'), 50_000)

    def test_genesis_trade_bonds(self):
        """¥10,000 ≈ $70 genesis trade."""
        self.assertEqual(bond_required(70, 'discovery'), 1)
        self.assertEqual(bond_required(70, 'negotiation'), 5)
        self.assertEqual(bond_required(70, 'execution'), 10)
        # Total lock = $10 (execution stage, cumulative)
        self.assertEqual(total_bond_lock(70), 10)


class TestProtocolFee(unittest.TestCase):
    def test_fee_calculation(self):
        # 0.3% of $10,000 = $30
        self.assertAlmostEqual(protocol_fee(10_000), 30)

    def test_genesis_fee(self):
        # 0.3% of $70 = $0.21
        self.assertAlmostEqual(protocol_fee(70), 0.21)


class TestStakeScore(unittest.TestCase):
    def test_basic_stake(self):
        # $1000 staked for 1 day (86400 seconds)
        score = stake_score(1000, 86400)
        self.assertAlmostEqual(score, 1000 * 86400 * 1e-9, places=6)

    def test_stake_with_decay(self):
        raw = stake_score(1000, 86400, periods_elapsed=0)
        decayed = stake_score(1000, 86400, periods_elapsed=1)
        self.assertAlmostEqual(decayed, raw / 2, places=10)


class TestGenesisSimulation(unittest.TestCase):
    def test_default_genesis(self):
        """100 trades of $70 = $7,000 cumulative."""
        state = simulate_genesis()
        self.assertEqual(len(state.trades), 100)
        self.assertAlmostEqual(state.cumulative_volume, 7_000)
        self.assertEqual(state.current_period, 0)  # $7K < $10K threshold

    def test_tk_score(self):
        state = simulate_genesis()
        # Genesis trader is both buyer and seller, gets full deal_value per trade
        self.assertAlmostEqual(state.scores['genesis'], 7_000)

    def test_genesis_to_period_1(self):
        """143 trades of $70 = $10,010 > $10K threshold."""
        state = simulate_genesis(num_trades=143)
        self.assertGreaterEqual(state.cumulative_volume, 10_000)
        self.assertEqual(state.current_period, 1)


class TestSimulateTrade(unittest.TestCase):
    def test_single_trade(self):
        state = SimulationState()
        trade = simulate_trade(state, 1000, "alice", "bob")
        self.assertEqual(trade.deal_value, 1000)
        self.assertEqual(state.cumulative_volume, 1000)
        self.assertEqual(state.scores['alice'], 500)  # half
        self.assertEqual(state.scores['bob'], 500)    # half

    def test_period_advancement(self):
        state = SimulationState()
        simulate_trade(state, 10_001, "alice", "bob")
        self.assertEqual(state.current_period, 1)


if __name__ == '__main__':
    unittest.main()
