// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {Treasury} from "../src/Treasury.sol";
import {BondVault} from "../src/BondVault.sol";
import {SealedTrade} from "../src/SealedTrade.sol";

/// @notice Deploy all Sealed Trade Protocol contracts
/// @dev Deployment order: Treasury → BondVault → SealedTrade → wire references
/// Usage: forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
contract DeployScript is Script {
    function run() external {
        address usdc = vm.envAddress("USDC_ADDRESS");
        address owner = vm.envAddress("OWNER_ADDRESS");

        vm.startBroadcast();

        // 1. Deploy Treasury
        Treasury treasury = new Treasury(usdc, owner);
        console2.log("Treasury:", address(treasury));

        // 2. Deploy BondVault
        BondVault bondVault = new BondVault(usdc, address(treasury));
        console2.log("BondVault:", address(bondVault));

        // 3. Deploy SealedTrade
        SealedTrade sealedTrade = new SealedTrade(
            usdc,
            address(bondVault),
            address(treasury)
        );
        console2.log("SealedTrade:", address(sealedTrade));

        // 4. Wire references
        bondVault.setSealedTrade(address(sealedTrade));
        treasury.setAuthorized(address(sealedTrade), address(bondVault));

        vm.stopBroadcast();

        console2.log("--- Deployment Complete ---");
    }
}
