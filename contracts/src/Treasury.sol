// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title Treasury — Fee vault and insurance pool for Sealed Trade Protocol
/// @notice Receives 0.3% trade fees and slashed bonds. Owner-gated withdrawals.
///         Uses Ownable2Step for safe ownership transfer.
contract Treasury is Ownable2Step {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    uint256 public insurancePool;
    uint256 public feePool;
    uint256 public slashPool;

    event FeeRecorded(uint256 amount);
    event SlashRecorded(uint256 amount);
    event InsuranceSeeded(uint256 amount);
    event Withdrawn(address indexed token, address indexed to, uint256 amount, string pool);
    event BreachClaimed(address indexed claimant, uint256 amount);

    constructor(address _usdc, address _owner) Ownable(_owner) {
        require(_usdc != address(0), "zero usdc");
        usdc = IERC20(_usdc);
    }

    /// @notice Record fee deposit. Caller must have already transferred USDC to this contract.
    function recordFee(uint256 amount) external {
        feePool += amount;
        emit FeeRecorded(amount);
    }

    /// @notice Record slash deposit. Caller must have already transferred USDC to this contract.
    function recordSlash(uint256 amount) external {
        slashPool += amount;
        emit SlashRecorded(amount);
    }

    /// @notice Seed insurance pool with USDC (pull pattern — caller approves first).
    function seedInsurance(uint256 amount) external {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        insurancePool += amount;
        emit InsuranceSeeded(amount);
    }

    /// @notice Claim breach compensation from insurance pool.
    function claimBreach(address claimant, uint256 amount) external onlyOwner {
        require(amount <= insurancePool, "exceeds insurance");
        insurancePool -= amount;
        usdc.safeTransfer(claimant, amount);
        emit BreachClaimed(claimant, amount);
    }

    /// @notice Withdraw from a specific pool. Enforces pool accounting.
    function withdrawFromPool(string calldata pool, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "zero recipient");
        bytes32 poolHash = keccak256(bytes(pool));

        if (poolHash == keccak256("fee")) {
            require(amount <= feePool, "exceeds fee pool");
            feePool -= amount;
        } else if (poolHash == keccak256("slash")) {
            require(amount <= slashPool, "exceeds slash pool");
            slashPool -= amount;
        } else if (poolHash == keccak256("insurance")) {
            require(amount <= insurancePool, "exceeds insurance pool");
            insurancePool -= amount;
        } else {
            revert("unknown pool");
        }

        usdc.safeTransfer(to, amount);
        emit Withdrawn(address(usdc), to, amount, pool);
    }

    /// @notice Emergency withdraw for non-USDC tokens accidentally sent.
    function rescueToken(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "zero recipient");
        require(token != address(usdc), "use withdrawFromPool for USDC");
        IERC20(token).safeTransfer(to, amount);
    }
}
