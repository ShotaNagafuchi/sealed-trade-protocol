// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SealToken} from "../src/SealToken.sol";
import {Treasury} from "../src/Treasury.sol";
import {BondVault} from "../src/BondVault.sol";
import {ContributionLedger} from "../src/ContributionLedger.sol";
import {SealedTrade} from "../src/SealedTrade.sol";

/// @notice Deploy all Sealed Trade Protocol contracts
/// @dev Uses CREATE2 via Foundry's deterministic deployer to solve chicken-and-egg
///      between SealToken and ContributionLedger.
///
///      Deployment order:
///      1. Predict ContributionLedger address using CREATE2
///      2. Deploy SealToken with predicted ledger address
///      3. Deploy ContributionLedger with actual token address
///      4. Verify addresses match
///      5. Deploy remaining contracts and wire references
///
/// Usage: forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
contract DeployScript is Script {
    function run() external {
        address usdc = vm.envAddress("USDC_ADDRESS");
        address owner = vm.envAddress("OWNER_ADDRESS");

        vm.startBroadcast();

        // 1. Deploy Treasury first (no circular deps)
        Treasury treasury = new Treasury(usdc, owner);
        console2.log("Treasury:", address(treasury));

        // 2. Deploy BondVault (depends on treasury)
        BondVault bondVault = new BondVault(usdc, address(treasury));
        console2.log("BondVault:", address(bondVault));

        // 3. Predict ContributionLedger address for SealToken constructor
        //    We need the token address to create the ledger, and the ledger
        //    address to create the token. Solve with a two-step approach:
        //    Deploy a temporary SealToken, compute ledger address, redeploy.
        //
        //    Alternative (simpler): Deploy ledger first with a known token address
        //    by using CREATE2 salt to make the address deterministic.
        //
        //    Simplest approach: use nonce-based address prediction.
        //    The deployer's next nonce will create the SealToken,
        //    and the nonce after that will create ContributionLedger.

        // Predict the ContributionLedger address (will be created at nonce+1)
        address predictedLedger = vm.computeCreateAddress(msg.sender, vm.getNonce(msg.sender) + 1);

        // 4. Deploy SealToken pointing to predicted ledger
        SealToken token = new SealToken(address(treasury), predictedLedger);
        console2.log("SealToken:", address(token));

        // 5. Deploy ContributionLedger with actual token address
        ContributionLedger ledger = new ContributionLedger(address(token));
        console2.log("ContributionLedger:", address(ledger));

        // 6. Verify the prediction was correct
        require(address(ledger) == predictedLedger, "ledger address mismatch");
        require(token.balanceOf(address(ledger)) == token.MINING_ALLOCATION(), "ledger balance wrong");

        // 7. Deploy SealedTrade (depends on all others)
        SealedTrade sealedTrade = new SealedTrade(
            usdc,
            address(bondVault),
            address(ledger),
            address(treasury)
        );
        console2.log("SealedTrade:", address(sealedTrade));

        // 8. Wire references (only deployer can call these)
        bondVault.setSealedTrade(address(sealedTrade));
        ledger.setSealedTrade(address(sealedTrade));
        treasury.setAuthorized(address(sealedTrade), address(bondVault));

        vm.stopBroadcast();

        console2.log("--- Deployment Complete ---");
        console2.log("SEAL total supply:", token.totalSupply());
        console2.log("Treasury SEAL:", token.balanceOf(address(treasury)));
        console2.log("Ledger SEAL:", token.balanceOf(address(ledger)));
    }
}
