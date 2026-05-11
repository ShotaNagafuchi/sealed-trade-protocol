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
    address mockSealedTrade = makeAddr("sealedTrade");
    address mockBondVault = makeAddr("bondVault");

    function setUp() public {
        usdc = new MockUSDC();
        treasury = new Treasury(address(usdc), owner);
        treasury.setAuthorized(mockSealedTrade, mockBondVault);

        usdc.mint(user, 1_000_000e6);
        vm.prank(user);
        usdc.approve(address(treasury), type(uint256).max);
    }

    function test_recordFee_onlySealedTrade() public {
        // Transfer USDC to treasury, then record via authorized caller
        vm.prank(user);
        usdc.transfer(address(treasury), 100e6);

        vm.prank(mockSealedTrade);
        treasury.recordFee(100e6);
        assertEq(treasury.feePool(), 100e6);
    }

    function test_RevertWhen_recordFee_unauthorized() public {
        vm.prank(user);
        vm.expectRevert("only SealedTrade");
        treasury.recordFee(100e6);
    }

    function test_recordSlash_onlyBondVault() public {
        vm.prank(user);
        usdc.transfer(address(treasury), 50e6);

        vm.prank(mockBondVault);
        treasury.recordSlash(50e6);
        assertEq(treasury.slashPool(), 50e6);
    }

    function test_RevertWhen_recordSlash_unauthorized() public {
        vm.prank(user);
        vm.expectRevert("only BondVault");
        treasury.recordSlash(50e6);
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
        vm.prank(user);
        usdc.transfer(address(treasury), 100e6);
        vm.prank(mockSealedTrade);
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
        vm.prank(mockSealedTrade);
        treasury.recordFee(100e6);

        vm.prank(owner);
        vm.expectRevert();
        treasury.withdrawFromPool("fee", makeAddr("recipient"), 200e6);
    }

    function test_rescueToken_notUSDC() public {
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
        assertEq(treasury.owner(), owner);

        vm.prank(newOwner);
        treasury.acceptOwnership();
        assertEq(treasury.owner(), newOwner);
    }

    function test_setAuthorized_onlyDeployer() public {
        MockUSDC usdc2 = new MockUSDC();
        Treasury treasury2 = new Treasury(address(usdc2), owner);

        // Non-deployer cannot set
        vm.prank(user);
        vm.expectRevert("not deployer");
        treasury2.setAuthorized(mockSealedTrade, mockBondVault);

        // Deployer (this test contract) can set
        treasury2.setAuthorized(mockSealedTrade, mockBondVault);

        // Cannot set twice
        vm.expectRevert("already set");
        treasury2.setAuthorized(mockSealedTrade, mockBondVault);
    }
}
