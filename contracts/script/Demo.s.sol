// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {Treasury} from "../src/Treasury.sol";
import {BondVault} from "../src/BondVault.sol";
import {SealedTrade} from "../src/SealedTrade.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

/// @notice Deploy + run a full trade demo on local Anvil
contract DemoScript is Script {
    uint256 constant DEPLOYER_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 constant SELLER_KEY = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    uint256 constant BUYER_KEY = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;

    function _commitAgreement(
        SealedTrade sealedTrade,
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

        (uint8 bv, bytes32 br, bytes32 bs) = vm.sign(BUYER_KEY, digest);
        (uint8 sv, bytes32 sr, bytes32 ss) = vm.sign(SELLER_KEY, digest);

        vm.broadcast(DEPLOYER_KEY);
        sealedTrade.commitAgreement(
            tradeId,
            finalDealValue,
            termsHash,
            keccak256("tee-attestation-final"),
            abi.encodePacked(br, bs, bv),
            abi.encodePacked(sr, ss, sv)
        );
    }

    function run() external {
        address deployer = vm.addr(DEPLOYER_KEY);
        address seller = vm.addr(SELLER_KEY);
        address buyer = vm.addr(BUYER_KEY);

        console2.log("=== Sealed Trade Protocol Demo ===");
        console2.log("");

        // ========== DEPLOY ==========
        vm.startBroadcast(DEPLOYER_KEY);

        MockUSDC usdc = new MockUSDC();
        console2.log("USDC deployed:", address(usdc));

        Treasury treasury = new Treasury(address(usdc), deployer);
        console2.log("Treasury deployed:", address(treasury));

        BondVault bondVault = new BondVault(address(usdc), address(treasury));
        console2.log("BondVault deployed:", address(bondVault));

        SealedTrade sealedTrade = new SealedTrade(
            address(usdc),
            address(bondVault),
            address(treasury)
        );
        console2.log("SealedTrade deployed:", address(sealedTrade));

        bondVault.setSealedTrade(address(sealedTrade));
        treasury.setAuthorized(address(sealedTrade), address(bondVault));

        // Fund seller and buyer
        usdc.mint(seller, 1_000_000e6);
        usdc.mint(buyer, 1_000_000e6);

        vm.stopBroadcast();

        console2.log("");
        console2.log("=== DEPLOYMENT COMPLETE ===");
        console2.log("Seller USDC:", usdc.balanceOf(seller) / 1e6, "USDC");
        console2.log("Buyer USDC:", usdc.balanceOf(buyer) / 1e6, "USDC");
        console2.log("");

        // ========== TRADE: Patent License for $10,000 ==========
        uint256 dealValue = 10_000e6; // $10,000 USDC

        console2.log("=== TRADE: Patent License ===");
        console2.log("Deal value: $10,000");
        console2.log("");

        // Step 1: Seller lists asset
        vm.startBroadcast(SELLER_KEY);
        usdc.approve(address(bondVault), type(uint256).max);
        bytes32 tradeId = sealedTrade.listAsset(
            keccak256("Patent US-2026-001: AI Negotiation Method"),
            dealValue,
            uint64(block.timestamp + 7 days)
        );
        vm.stopBroadcast();

        console2.log("1. LISTED");
        console2.log("   Trade ID:", vm.toString(tradeId));
        console2.log("   Seller bond locked: $", bondVault.getBondAmount(BondVault.BondStage.Discovery, dealValue) / 1e6);
        console2.log("");

        // Step 2: Buyer expresses interest
        vm.startBroadcast(BUYER_KEY);
        usdc.approve(address(bondVault), type(uint256).max);
        usdc.approve(address(sealedTrade), type(uint256).max);
        sealedTrade.expressInterest(tradeId);
        vm.stopBroadcast();

        console2.log("2. MATCHED");
        console2.log("   Buyer bond locked: $", bondVault.getBondAmount(BondVault.BondStage.Discovery, dealValue) / 1e6);
        console2.log("");

        // Step 3: Begin negotiation (escalate to 3% bonds)
        vm.startBroadcast(SELLER_KEY);
        sealedTrade.beginNegotiation(tradeId, keccak256("tee-attestation-v1"));
        vm.stopBroadcast();

        console2.log("3. NEGOTIATING");
        console2.log("   Both bonds escalated to: $", bondVault.getBondAmount(BondVault.BondStage.Negotiation, dealValue) / 1e6);
        console2.log("   [AI agents would negotiate here inside TEE]");
        console2.log("");

        // Step 4: Commit agreement (both sign, escalate to 10% bonds)
        uint256 finalDealValue = 7_500e6; // Agreed at $7,500
        bytes32 termsHash = keccak256("non-exclusive, worldwide, 5 years");

        _commitAgreement(sealedTrade, tradeId, finalDealValue, termsHash);

        console2.log("4. AGREED");
        console2.log("   Final price: $", finalDealValue / 1e6);
        console2.log("   Terms: non-exclusive, worldwide, 5 years");
        console2.log("   Both bonds escalated to: $", bondVault.getBondAmount(BondVault.BondStage.Execution, finalDealValue) / 1e6);
        console2.log("");

        _settleAndLog(sealedTrade, usdc, treasury, tradeId, finalDealValue, seller, buyer);
    }

    function _settleAndLog(
        SealedTrade sealedTrade,
        MockUSDC usdc,
        Treasury treasury,
        bytes32 tradeId,
        uint256 finalDealValue,
        address seller,
        address buyer
    ) internal {
        uint256 sellerBefore = usdc.balanceOf(seller);
        uint256 buyerBefore = usdc.balanceOf(buyer);

        vm.broadcast(BUYER_KEY);
        sealedTrade.settle(tradeId);

        uint256 fee = (finalDealValue * 30) / 10_000;

        console2.log("5. SETTLED");
        console2.log("   Deal value transferred: $", finalDealValue / 1e6);
        console2.log("   Fee (0.3%): $", fee / 1e6);
        console2.log("   Seller received: $", (usdc.balanceOf(seller) - sellerBefore) / 1e6);
        console2.log("   Buyer paid: $", (buyerBefore - usdc.balanceOf(buyer)) / 1e6);
        console2.log("   Treasury fee pool: $", treasury.feePool() / 1e6);
        console2.log("");

        console2.log("=== TRADE COMPLETE ===");
        console2.log("Final balances:");
        console2.log("   Seller: $", usdc.balanceOf(seller) / 1e6, "USDC");
        console2.log("   Buyer:  $", usdc.balanceOf(buyer) / 1e6, "USDC");
        console2.log("   Treasury: $", usdc.balanceOf(address(treasury)) / 1e6, "USDC");
    }
}
