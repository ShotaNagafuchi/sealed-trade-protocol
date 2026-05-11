// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SealToken} from "../src/SealToken.sol";

contract SealTokenTest is Test {
    SealToken token;
    address treasury = makeAddr("treasury");
    address ledger = makeAddr("ledger");

    function setUp() public {
        token = new SealToken(treasury, ledger);
    }

    function test_totalSupply() public view {
        assertEq(token.totalSupply(), 100_000_000 * 1e18);
    }

    function test_treasuryAllocation() public view {
        assertEq(token.balanceOf(treasury), 5_000_000 * 1e18);
    }

    function test_miningAllocation() public view {
        assertEq(token.balanceOf(ledger), 95_000_000 * 1e18);
    }

    function test_noAdditionalMinting() public view {
        assertEq(token.totalSupply(), token.MAX_SUPPLY());
    }

    function test_name() public view {
        assertEq(token.name(), "Sealed Trade Token");
    }

    function test_symbol() public view {
        assertEq(token.symbol(), "SEAL");
    }

    function test_RevertWhen_zeroTreasury() public {
        vm.expectRevert();
        new SealToken(address(0), ledger);
    }

    function test_RevertWhen_zeroLedger() public {
        vm.expectRevert();
        new SealToken(treasury, address(0));
    }
}
