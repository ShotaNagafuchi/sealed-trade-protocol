// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {SealToken} from "../src/SealToken.sol";
import {ContributionLedger} from "../src/ContributionLedger.sol";

contract ContributionLedgerTest is Test {
    ContributionLedger ledger;
    SealToken token;
    address treasury = makeAddr("treasury");
    address sealedTrade = makeAddr("sealedTrade");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        // Predict ledger address for SealToken constructor
        address predictedLedger = vm.computeCreateAddress(address(this), vm.getNonce(address(this)) + 1);

        token = new SealToken(treasury, predictedLedger);
        ledger = new ContributionLedger(address(token));

        // Verify prediction
        assertEq(address(ledger), predictedLedger);
        assertEq(token.balanceOf(address(ledger)), 95_000_000 * 1e18);

        ledger.setSealedTrade(sealedTrade);
    }

    function test_initialState() public view {
        assertEq(ledger.currentPeriod(), 0);
        assertEq(ledger.cumulativeVolume(), 0);
    }

    function test_periodAllocation() public view {
        assertEq(ledger.periodAllocation(0), 47_500_000 * 1e18);
        assertEq(ledger.periodAllocation(1), 23_750_000 * 1e18);
        assertEq(ledger.periodAllocation(2), 11_875_000 * 1e18);
    }

    function test_periodVolume() public view {
        assertEq(ledger.periodVolume(0), 10_000e6);
        assertEq(ledger.periodVolume(1), 10_000e6);
        assertEq(ledger.periodVolume(2), 20_000e6);
        assertEq(ledger.periodVolume(3), 40_000e6);
    }

    function test_recordTradeAdvancesPeriod() public {
        vm.prank(sealedTrade);
        ledger.recordTrade(alice, bob, 10_000e6);

        assertEq(ledger.currentPeriod(), 1);
        assertEq(ledger.cumulativeVolume(), 10_000e6);
    }

    function test_genesisTrade() public {
        vm.prank(sealedTrade);
        ledger.recordTrade(alice, alice, 70e6);

        assertEq(ledger.cumulativeVolume(), 70e6);
        assertEq(ledger.currentPeriod(), 0);
    }

    function test_multipleTradesToHalving() public {
        for (uint256 i = 0; i < 143; i++) {
            vm.prank(sealedTrade);
            ledger.recordTrade(alice, bob, 70e6);
        }
        assertEq(ledger.currentPeriod(), 1);
    }

    function test_rewardClaimAfterPeriodFinalized() public {
        vm.prank(sealedTrade);
        ledger.recordTrade(alice, bob, 10_000e6);

        (uint256 totalScore, uint256 allocation,, bool finalized) = ledger.periods(0);
        assertTrue(finalized);
        assertGt(totalScore, 0);
        assertEq(allocation, 47_500_000 * 1e18);

        uint256 balBefore = token.balanceOf(alice);
        vm.prank(alice);
        ledger.claimReward(0);
        uint256 balAfter = token.balanceOf(alice);

        assertGt(balAfter, balBefore);
    }

    function test_equalSplitBetweenBuyerAndSeller() public {
        vm.prank(sealedTrade);
        ledger.recordTrade(alice, bob, 10_000e6);

        (uint256 aliceScore,) = ledger.contributions(alice, 0);
        (uint256 bobScore,) = ledger.contributions(bob, 0);
        assertEq(aliceScore, bobScore);

        vm.prank(alice);
        uint256 aliceReward = ledger.claimReward(0);
        vm.prank(bob);
        uint256 bobReward = ledger.claimReward(0);
        assertEq(aliceReward, bobReward);

        // Both should get exactly half the period allocation
        assertEq(aliceReward + bobReward, 47_500_000 * 1e18);
    }

    function test_noDecay_fullAllocationDistributed() public {
        // With no decay, the full period allocation should be distributed
        vm.prank(sealedTrade);
        ledger.recordTrade(alice, bob, 10_000e6);

        vm.prank(alice);
        uint256 aliceReward = ledger.claimReward(0);
        vm.prank(bob);
        uint256 bobReward = ledger.claimReward(0);

        assertEq(aliceReward + bobReward, 47_500_000 * 1e18);
    }

    function test_setSealedTrade_onlyDeployer() public {
        address predictedLedger2 = vm.computeCreateAddress(address(this), vm.getNonce(address(this)) + 1);
        SealToken token2 = new SealToken(treasury, predictedLedger2);
        ContributionLedger ledger2 = new ContributionLedger(address(token2));

        // Non-deployer cannot set
        vm.prank(alice);
        vm.expectRevert("not deployer");
        ledger2.setSealedTrade(sealedTrade);

        // Deployer (this test contract) can set
        ledger2.setSealedTrade(sealedTrade);
    }

    function test_postMaxPeriods_noRevert() public {
        // After all periods are exhausted, recordTrade should silently return
        // First, advance past all periods by trading huge volume
        uint256 totalNeeded = 10_000e6 * (1 << 22); // cumulative threshold for period 21
        vm.prank(sealedTrade);
        ledger.recordTrade(alice, bob, totalNeeded);

        assertGe(ledger.currentPeriod(), 22);

        // This should not revert
        vm.prank(sealedTrade);
        ledger.recordTrade(alice, bob, 1_000e6);
    }

    function test_RevertWhen_claimBeforeFinalized() public {
        vm.prank(sealedTrade);
        ledger.recordTrade(alice, bob, 5_000e6);

        vm.prank(alice);
        vm.expectRevert();
        ledger.claimReward(0);
    }

    function test_RevertWhen_doubleClaim() public {
        vm.prank(sealedTrade);
        ledger.recordTrade(alice, bob, 10_000e6);

        vm.prank(alice);
        ledger.claimReward(0);
        vm.prank(alice);
        vm.expectRevert();
        ledger.claimReward(0);
    }
}
