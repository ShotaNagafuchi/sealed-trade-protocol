// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Treasury} from "./Treasury.sol";

/// @title BondVault — 3-stage bond lifecycle for Sealed Trade Protocol
/// @notice Bonds are denominated in USDC. Stages: Discovery (1%), Negotiation (3%), Execution (10%).
contract BondVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum BondStage { None, Discovery, Negotiation, Execution }

    struct Bond {
        uint256 amount;
        BondStage stage;
        bool slashed;
    }

    // Stage basis points: Discovery 1%, Negotiation 3%, Execution 10%
    uint256 public constant DISCOVERY_BPS = 100;
    uint256 public constant NEGOTIATION_BPS = 300;
    uint256 public constant EXECUTION_BPS = 1000;

    // Min/max per stage (USDC 6 decimals)
    uint256 public constant DISCOVERY_MIN = 1e6;        // $1
    uint256 public constant DISCOVERY_MAX = 1_000e6;    // $1,000
    uint256 public constant NEGOTIATION_MIN = 5e6;      // $5
    uint256 public constant NEGOTIATION_MAX = 5_000e6;  // $5,000
    uint256 public constant EXECUTION_MIN = 10e6;       // $10
    uint256 public constant EXECUTION_MAX = 50_000e6;   // $50,000

    IERC20 public immutable usdc;
    Treasury public immutable treasury;
    address public immutable deployer;
    address public sealedTrade;

    // tradeId => party => Bond
    mapping(bytes32 => mapping(address => Bond)) public bonds;

    event BondPosted(bytes32 indexed tradeId, address indexed party, BondStage stage, uint256 amount);
    event BondEscalated(bytes32 indexed tradeId, address indexed party, BondStage newStage, uint256 additionalAmount);
    event BondReleased(bytes32 indexed tradeId, address indexed party, uint256 amount);
    event BondSlashed(bytes32 indexed tradeId, address indexed faultyParty, uint256 toCounterparty, uint256 toTreasury);

    modifier onlySealedTrade() {
        require(msg.sender == sealedTrade, "only SealedTrade");
        _;
    }

    constructor(address _usdc, address _treasury) {
        require(_usdc != address(0), "zero usdc");
        require(_treasury != address(0), "zero treasury");
        usdc = IERC20(_usdc);
        treasury = Treasury(_treasury);
        deployer = msg.sender;
    }

    function setSealedTrade(address _sealedTrade) external {
        require(msg.sender == deployer, "not deployer");
        require(sealedTrade == address(0), "already set");
        require(_sealedTrade != address(0), "zero address");
        sealedTrade = _sealedTrade;
    }

    function postBondFor(
        bytes32 tradeId,
        address party,
        BondStage stage,
        uint256 dealValue
    ) external onlySealedTrade nonReentrant {
        _postBondFor(tradeId, party, stage, dealValue);
    }

    function escalateBond(
        bytes32 tradeId,
        address party,
        BondStage newStage,
        uint256 dealValue
    ) external onlySealedTrade nonReentrant {
        Bond storage bond = bonds[tradeId][party];
        require(bond.stage != BondStage.None, "no existing bond");
        require(uint8(newStage) > uint8(bond.stage), "must escalate");
        require(!bond.slashed, "already slashed");

        uint256 required = _bondAmount(newStage, dealValue);
        uint256 additional = required - bond.amount;

        // CEI: update state before external call
        bond.amount = required;
        bond.stage = newStage;

        usdc.safeTransferFrom(party, address(this), additional);

        emit BondEscalated(tradeId, party, newStage, additional);
    }

    function releaseBonds(
        bytes32 tradeId,
        address buyer,
        address seller
    ) external onlySealedTrade nonReentrant {
        _release(tradeId, buyer);
        _release(tradeId, seller);
    }

    function slashBond(
        bytes32 tradeId,
        address faultyParty,
        address counterparty
    ) external onlySealedTrade nonReentrant {
        Bond storage bond = bonds[tradeId][faultyParty];
        require(bond.amount > 0, "no bond");
        require(!bond.slashed, "already slashed");

        // CEI: update all state before external calls
        bond.slashed = true;
        uint256 total = bond.amount;
        bond.amount = 0;

        uint256 toCounterparty = total / 2;
        uint256 toTreasury = total - toCounterparty;

        emit BondSlashed(tradeId, faultyParty, toCounterparty, toTreasury);

        usdc.safeTransfer(counterparty, toCounterparty);
        usdc.safeTransfer(address(treasury), toTreasury);

        // Update treasury slash accounting
        treasury.recordSlash(toTreasury);

        // Release counterparty's bond
        _release(tradeId, counterparty);
    }

    function getBondAmount(BondStage stage, uint256 dealValue) external pure returns (uint256) {
        return _bondAmount(stage, dealValue);
    }

    function _postBondFor(bytes32 tradeId, address party, BondStage stage, uint256 dealValue) internal {
        require(stage != BondStage.None, "invalid stage");
        Bond storage bond = bonds[tradeId][party];
        require(bond.stage == BondStage.None, "bond exists");

        uint256 amount = _bondAmount(stage, dealValue);

        // CEI: update state before external call
        bond.amount = amount;
        bond.stage = stage;

        usdc.safeTransferFrom(party, address(this), amount);

        emit BondPosted(tradeId, party, stage, amount);
    }

    function _release(bytes32 tradeId, address party) internal {
        Bond storage bond = bonds[tradeId][party];
        if (bond.amount > 0 && !bond.slashed) {
            uint256 amount = bond.amount;
            bond.amount = 0;
            usdc.safeTransfer(party, amount);
            emit BondReleased(tradeId, party, amount);
        }
    }

    function _bondAmount(BondStage stage, uint256 dealValue) internal pure returns (uint256) {
        uint256 bps;
        uint256 minBond;
        uint256 maxBond;

        if (stage == BondStage.Discovery) {
            bps = DISCOVERY_BPS;
            minBond = DISCOVERY_MIN;
            maxBond = DISCOVERY_MAX;
        } else if (stage == BondStage.Negotiation) {
            bps = NEGOTIATION_BPS;
            minBond = NEGOTIATION_MIN;
            maxBond = NEGOTIATION_MAX;
        } else if (stage == BondStage.Execution) {
            bps = EXECUTION_BPS;
            minBond = EXECUTION_MIN;
            maxBond = EXECUTION_MAX;
        } else {
            revert("invalid stage");
        }

        uint256 computed = (dealValue * bps) / 10_000;
        if (computed < minBond) return minBond;
        if (computed > maxBond) return maxBond;
        return computed;
    }
}
