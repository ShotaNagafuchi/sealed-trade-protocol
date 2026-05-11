// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BondVault} from "../src/BondVault.sol";
import {Treasury} from "../src/Treasury.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract BondVaultTest is Test {
    BondVault vault;
    Treasury treasury;
    MockUSDC usdc;
    address owner = makeAddr("owner");
    address sealedTrade;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        usdc = new MockUSDC();
        treasury = new Treasury(address(usdc), owner);
        vault = new BondVault(address(usdc), address(treasury));

        sealedTrade = makeAddr("sealedTrade");
        vault.setSealedTrade(sealedTrade);

        // Fund accounts
        usdc.mint(alice, 1_000_000e6);
        usdc.mint(bob, 1_000_000e6);

        vm.prank(alice);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(bob);
        usdc.approve(address(vault), type(uint256).max);
    }

    function test_discoveryBond_minimum() public view {
        uint256 amount = vault.getBondAmount(BondVault.BondStage.Discovery, 70e6);
        assertEq(amount, 1e6); // $1 minimum
    }

    function test_discoveryBond_normal() public view {
        uint256 amount = vault.getBondAmount(BondVault.BondStage.Discovery, 10_000e6);
        assertEq(amount, 100e6);
    }

    function test_discoveryBond_maximum() public view {
        uint256 amount = vault.getBondAmount(BondVault.BondStage.Discovery, 1_000_000e6);
        assertEq(amount, 1_000e6);
    }

    function test_negotiationBond() public view {
        uint256 amount = vault.getBondAmount(BondVault.BondStage.Negotiation, 10_000e6);
        assertEq(amount, 300e6);
    }

    function test_executionBond() public view {
        uint256 amount = vault.getBondAmount(BondVault.BondStage.Execution, 10_000e6);
        assertEq(amount, 1_000e6);
    }

    function test_genesisTradeBonds() public view {
        uint256 disc = vault.getBondAmount(BondVault.BondStage.Discovery, 70e6);
        uint256 neg = vault.getBondAmount(BondVault.BondStage.Negotiation, 70e6);
        uint256 exec = vault.getBondAmount(BondVault.BondStage.Execution, 70e6);
        assertEq(disc, 1e6);
        assertEq(neg, 5e6);
        assertEq(exec, 10e6);
    }

    function test_postAndRelease() public {
        bytes32 tradeId = bytes32(uint256(1));
        uint256 dealValue = 10_000e6;

        uint256 balBefore = usdc.balanceOf(alice);

        vm.prank(sealedTrade);
        vault.postBondFor(tradeId, alice, BondVault.BondStage.Discovery, dealValue);

        uint256 bondAmount = vault.getBondAmount(BondVault.BondStage.Discovery, dealValue);
        assertEq(usdc.balanceOf(alice), balBefore - bondAmount);

        vm.prank(sealedTrade);
        vault.releaseBonds(tradeId, alice, bob);

        assertEq(usdc.balanceOf(alice), balBefore);
    }

    function test_slashBond_50_50_split() public {
        bytes32 tradeId = bytes32(uint256(1));
        uint256 dealValue = 10_000e6;

        vm.prank(sealedTrade);
        vault.postBondFor(tradeId, alice, BondVault.BondStage.Discovery, dealValue);

        uint256 bondAmount = vault.getBondAmount(BondVault.BondStage.Discovery, dealValue);
        uint256 bobBefore = usdc.balanceOf(bob);
        uint256 treasuryBefore = usdc.balanceOf(address(treasury));

        vm.prank(sealedTrade);
        vault.slashBond(tradeId, alice, bob);

        assertEq(usdc.balanceOf(bob), bobBefore + bondAmount / 2);
        assertEq(usdc.balanceOf(address(treasury)), treasuryBefore + bondAmount - bondAmount / 2);
        // Verify treasury accounting updated
        assertEq(treasury.slashPool(), bondAmount - bondAmount / 2);
    }

    function test_setSealedTrade_onlyDeployer() public {
        MockUSDC usdc2 = new MockUSDC();
        Treasury treasury2 = new Treasury(address(usdc2), owner);
        BondVault vault2 = new BondVault(address(usdc2), address(treasury2));

        // Non-deployer cannot set
        vm.prank(alice);
        vm.expectRevert("not deployer");
        vault2.setSealedTrade(sealedTrade);

        // Deployer can set (this test contract is the deployer)
        vault2.setSealedTrade(sealedTrade);

        // Cannot set twice
        vm.expectRevert("already set");
        vault2.setSealedTrade(makeAddr("other"));
    }

    function test_RevertWhen_nonSealedTradeCannotPost() public {
        vm.expectRevert();
        vault.postBondFor(bytes32(uint256(1)), alice, BondVault.BondStage.Discovery, 10_000e6);
    }

    function test_CEI_stateBeforeTransfer() public {
        bytes32 tradeId = bytes32(uint256(1));
        uint256 dealValue = 10_000e6;

        // Post bond — state should be updated even if transfer were to fail
        vm.prank(sealedTrade);
        vault.postBondFor(tradeId, alice, BondVault.BondStage.Discovery, dealValue);

        // Verify state is set
        (uint256 amount, BondVault.BondStage stage, bool slashed) = vault.bonds(tradeId, alice);
        assertEq(amount, vault.getBondAmount(BondVault.BondStage.Discovery, dealValue));
        assertEq(uint8(stage), uint8(BondVault.BondStage.Discovery));
        assertFalse(slashed);
    }
}
