// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Treasury} from "../src/Treasury.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract TreasuryTest is Test {
    Treasury treasury;
    MockUSDC usdc;
    address owner = makeAddr("owner");
    address user = makeAddr("user");

    function setUp() public {
        usdc = new MockUSDC();
        treasury = new Treasury(address(usdc), owner);
        usdc.mint(user, 1_000_000e6);
        vm.prank(user);
        usdc.approve(address(treasury), type(uint256).max);
    }

    function test_recordFee() public {
        // Simulate SealedTrade sending USDC then calling recordFee
        vm.prank(user);
        usdc.transfer(address(treasury), 100e6);

        treasury.recordFee(100e6);
        assertEq(treasury.feePool(), 100e6);
    }

    function test_seedInsurance() public {
        vm.prank(user);
        treasury.seedInsurance(50_000e6);
        assertEq(treasury.insurancePool(), 50_000e6);
    }

    function test_claimBreach() public {
        vm.prank(user);
        treasury.seedInsurance(50_000e6);

        address claimant = makeAddr("claimant");
        vm.prank(owner);
        treasury.claimBreach(claimant, 10_000e6);

        assertEq(usdc.balanceOf(claimant), 10_000e6);
        assertEq(treasury.insurancePool(), 40_000e6);
    }

    function test_RevertWhen_nonOwnerWithdraw() public {
        vm.prank(user);
        treasury.seedInsurance(50_000e6);

        vm.prank(user);
        vm.expectRevert();
        treasury.withdrawFromPool("insurance", user, 50_000e6);
    }

    function test_RevertWhen_breachExceedsInsurance() public {
        vm.prank(user);
        treasury.seedInsurance(10_000e6);

        vm.prank(owner);
        vm.expectRevert();
        treasury.claimBreach(makeAddr("claimant"), 20_000e6);
    }

    function test_ownerWithdrawFromFeePool() public {
        // Simulate fee deposit
        vm.prank(user);
        usdc.transfer(address(treasury), 100e6);
        treasury.recordFee(100e6);

        address recipient = makeAddr("recipient");
        vm.prank(owner);
        treasury.withdrawFromPool("fee", recipient, 100e6);

        assertEq(usdc.balanceOf(recipient), 100e6);
        assertEq(treasury.feePool(), 0);
    }

    function test_RevertWhen_withdrawExceedsPool() public {
        vm.prank(user);
        usdc.transfer(address(treasury), 100e6);
        treasury.recordFee(100e6);

        vm.prank(owner);
        vm.expectRevert();
        treasury.withdrawFromPool("fee", makeAddr("recipient"), 200e6);
    }

    function test_rescueToken_notUSDC() public {
        // Deploy a different token
        MockUSDC otherToken = new MockUSDC();
        otherToken.mint(address(treasury), 1000e6);

        address recipient = makeAddr("recipient");
        vm.prank(owner);
        treasury.rescueToken(address(otherToken), recipient, 1000e6);
        assertEq(otherToken.balanceOf(recipient), 1000e6);
    }

    function test_RevertWhen_rescueUSDC() public {
        vm.prank(owner);
        vm.expectRevert();
        treasury.rescueToken(address(usdc), makeAddr("recipient"), 100e6);
    }

    function test_ownable2Step() public {
        address newOwner = makeAddr("newOwner");

        vm.prank(owner);
        treasury.transferOwnership(newOwner);

        // Not effective yet — must accept
        assertEq(treasury.owner(), owner);

        vm.prank(newOwner);
        treasury.acceptOwnership();

        assertEq(treasury.owner(), newOwner);
    }
}
