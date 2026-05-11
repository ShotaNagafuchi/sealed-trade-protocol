// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// @title SealToken — Fixed-supply ERC-20 for the Sealed Trade Protocol
/// @notice 100M total supply. 5M to treasury, 95M to ContributionLedger for mining.
contract SealToken is ERC20, ERC20Permit {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18;
    uint256 public constant TREASURY_ALLOCATION = 5_000_000 * 1e18;
    uint256 public constant MINING_ALLOCATION = 95_000_000 * 1e18;

    constructor(
        address treasury,
        address contributionLedger
    ) ERC20("Sealed Trade Token", "SEAL") ERC20Permit("Sealed Trade Token") {
        require(treasury != address(0), "zero treasury");
        require(contributionLedger != address(0), "zero ledger");

        _mint(treasury, TREASURY_ALLOCATION);
        _mint(contributionLedger, MINING_ALLOCATION);
    }
}
