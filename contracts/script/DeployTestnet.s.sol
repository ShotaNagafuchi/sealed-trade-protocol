// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {Treasury} from "../src/Treasury.sol";
import {BondVault} from "../src/BondVault.sol";
import {SealedTrade} from "../src/SealedTrade.sol";

/// @notice Deploy Sealed Trade Protocol to testnet with MockUSDC
/// @dev Usage: forge script script/DeployTestnet.s.sol --rpc-url $RPC_URL --broadcast --verify
contract DeployTestnetScript is Script {
    function run() external {
        address owner = vm.envAddress("OWNER_ADDRESS");

        vm.startBroadcast();

        // 1. Deploy MockUSDC (open mint for testnet faucet)
        MockUSDC usdc = new MockUSDC();
        console2.log("MockUSDC:", address(usdc));

        // 2. Deploy Treasury
        Treasury treasury = new Treasury(address(usdc), owner);
        console2.log("Treasury:", address(treasury));

        // 3. Deploy BondVault
        BondVault bondVault = new BondVault(address(usdc), address(treasury));
        console2.log("BondVault:", address(bondVault));

        // 4. Deploy SealedTrade
        SealedTrade sealedTrade = new SealedTrade(
            address(usdc),
            address(bondVault),
            address(treasury)
        );
        console2.log("SealedTrade:", address(sealedTrade));

        // 5. Wire references
        bondVault.setSealedTrade(address(sealedTrade));
        treasury.setAuthorized(address(sealedTrade), address(bondVault));

        vm.stopBroadcast();

        console2.log("--- Testnet Deployment Complete ---");
        console2.log("Owner:", owner);
    }
}
