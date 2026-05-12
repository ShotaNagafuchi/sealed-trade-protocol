// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SealedTrade} from "../src/SealedTrade.sol";
import {BondVault} from "../src/BondVault.sol";
import {Treasury} from "../src/Treasury.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract SealedTradeTest is Test {
    MockUSDC usdc;
    Treasury treasury;
    BondVault bondVault;
    SealedTrade sealedTrade;

    address owner = makeAddr("owner");

    uint256 sellerKey = 0xA11CE;
    uint256 buyerKey = 0xB0B;
    address seller;
    address buyer;

    function setUp() public {
        seller = vm.addr(sellerKey);
        buyer = vm.addr(buyerKey);

        usdc = new MockUSDC();
        treasury = new Treasury(address(usdc), owner);
        bondVault = new BondVault(address(usdc), address(treasury));

        sealedTrade = new SealedTrade(
            address(usdc),
            address(bondVault),
            address(treasury)
        );

        bondVault.setSealedTrade(address(sealedTrade));
        treasury.setAuthorized(address(sealedTrade), address(bondVault));

        // Fund participants
        usdc.mint(seller, 10_000_000e6);
        usdc.mint(buyer, 10_000_000e6);

        vm.prank(seller);
        usdc.approve(address(bondVault), type(uint256).max);
        vm.prank(buyer);
        usdc.approve(address(bondVault), type(uint256).max);
        vm.prank(seller);
        usdc.approve(address(sealedTrade), type(uint256).max);
        vm.prank(buyer);
        usdc.approve(address(sealedTrade), type(uint256).max);
    }

    function test_listAsset() public {
        bytes32 tradeId = _createListing(10_000e6);

        (
            bytes32 id,,
            address s,
            address b,
            uint256 maxDV,,,
            SealedTrade.TradeState state,,
        ) = sealedTrade.trades(tradeId);

        assertEq(id, tradeId);
        assertEq(s, seller);
        assertEq(b, address(0));
        assertEq(uint8(state), uint8(SealedTrade.TradeState.Listed));
        assertEq(maxDV, 10_000e6);
    }

    function test_expressInterest() public {
        bytes32 tradeId = _createListing(10_000e6);

        vm.prank(buyer);
        sealedTrade.expressInterest(tradeId);

        (,,, address b,,,, SealedTrade.TradeState state,,) = sealedTrade.trades(tradeId);
        assertEq(b, buyer);
        assertEq(uint8(state), uint8(SealedTrade.TradeState.Matched));
    }

    function test_fullSettlement_dealValueTransferred() public {
        uint256 dealValue = 10_000e6;
        bytes32 tradeId = _createListing(dealValue);

        vm.prank(buyer);
        sealedTrade.expressInterest(tradeId);

        vm.prank(seller);
        sealedTrade.beginNegotiation(tradeId, bytes32(uint256(1)));

        uint256 finalDealValue = 8_000e6;
        bytes32 termsHash = keccak256("terms");
        _commitAgreement(tradeId, finalDealValue, termsHash);

        uint256 sellerBefore = usdc.balanceOf(seller);
        uint256 treasuryBefore = usdc.balanceOf(address(treasury));

        vm.prank(buyer);
        sealedTrade.settle(tradeId);

        uint256 fee = (finalDealValue * 30) / 10_000;
        uint256 sellerProceeds = finalDealValue - fee;
        uint256 sellerBondReturn = bondVault.getBondAmount(BondVault.BondStage.Execution, finalDealValue);

        assertEq(usdc.balanceOf(seller), sellerBefore + sellerProceeds + sellerBondReturn);
        assertEq(usdc.balanceOf(address(treasury)), treasuryBefore + fee);
        assertEq(treasury.feePool(), fee);

        (,,,,,,, SealedTrade.TradeState state,,) = sealedTrade.trades(tradeId);
        assertEq(uint8(state), uint8(SealedTrade.TradeState.Settled));
    }

    function test_feeCalculation() public pure {
        uint256 fee = (10_000e6 * 30) / 10_000;
        assertEq(fee, 30e6);
    }

    function test_cancel_beforeNegotiation_releaseBonds() public {
        bytes32 tradeId = _createListing(10_000e6);

        vm.prank(buyer);
        sealedTrade.expressInterest(tradeId);

        uint256 sellerBefore = usdc.balanceOf(seller);

        vm.prank(seller);
        sealedTrade.cancel(tradeId);

        (,,,,,,, SealedTrade.TradeState state,,) = sealedTrade.trades(tradeId);
        assertEq(uint8(state), uint8(SealedTrade.TradeState.Cancelled));
        assertGe(usdc.balanceOf(seller), sellerBefore);
    }

    function test_cancel_duringNegotiation_slashes() public {
        bytes32 tradeId = _createListing(10_000e6);

        vm.prank(buyer);
        sealedTrade.expressInterest(tradeId);

        vm.prank(seller);
        sealedTrade.beginNegotiation(tradeId, bytes32(uint256(1)));

        uint256 buyerBefore = usdc.balanceOf(buyer);

        vm.prank(seller);
        sealedTrade.cancel(tradeId);

        assertGt(usdc.balanceOf(buyer), buyerBefore);
        assertGt(treasury.slashPool(), 0);
    }

    function test_expireTrade() public {
        bytes32 tradeId = _createListing(10_000e6);

        vm.warp(block.timestamp + 8 days);
        sealedTrade.expireTrade(tradeId);

        (,,,,,,, SealedTrade.TradeState state,,) = sealedTrade.trades(tradeId);
        assertEq(uint8(state), uint8(SealedTrade.TradeState.Cancelled));
    }

    // --- Helpers ---

    function _createListing(uint256 maxDeal) internal returns (bytes32) {
        bytes32 assetHash = keccak256("test asset");
        uint64 deadline = uint64(block.timestamp + 7 days);

        vm.prank(seller);
        return sealedTrade.listAsset(assetHash, maxDeal, deadline);
    }

    function _commitAgreement(
        bytes32 tradeId,
        uint256 finalDealValue,
        bytes32 termsHash
    ) internal {
        bytes32 structHash = keccak256(abi.encode(
            sealedTrade.AGREEMENT_TYPEHASH(),
            tradeId,
            finalDealValue,
            termsHash
        ));
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            sealedTrade.DOMAIN_SEPARATOR(),
            structHash
        ));

        (uint8 bv, bytes32 br, bytes32 bs) = vm.sign(buyerKey, digest);
        (uint8 sv, bytes32 sr, bytes32 ss) = vm.sign(sellerKey, digest);

        bytes memory buyerSig = abi.encodePacked(br, bs, bv);
        bytes memory sellerSig = abi.encodePacked(sr, ss, sv);

        sealedTrade.commitAgreement(
            tradeId,
            finalDealValue,
            termsHash,
            bytes32(uint256(2)),
            buyerSig,
            sellerSig
        );
    }
}
