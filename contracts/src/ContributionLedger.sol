// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ContributionLedger — Mining rewards with halving
/// @notice Implements Bitcoin-style halving based on cumulative trade volume.
///         Period n threshold = $10K * 2^n. Period n allocation = 47.5M / 2^n SEAL.
///         Rewards are distributed proportionally within each period. No cross-period decay.
contract ContributionLedger is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Constants ---
    uint256 public constant HALVING_INITIAL = 10_000e6; // $10K in USDC (6 decimals)
    uint256 public constant INITIAL_PERIOD_ALLOCATION = 47_500_000 * 1e18; // 47.5M SEAL
    uint256 public constant MAX_PERIODS = 22;

    // --- State ---
    IERC20 public immutable sealToken;
    address public immutable deployer;
    address public sealedTrade;

    uint256 public cumulativeVolume;     // total USDC volume processed
    uint256 public currentPeriod;        // current halving period

    // Period tracking
    struct PeriodInfo {
        uint256 totalScore;              // sum of all contribution scores in this period
        uint256 allocation;              // SEAL tokens allocated to this period
        uint256 totalDistributed;        // SEAL actually distributed (tracks dust)
        bool finalized;                  // period complete, rewards claimable
    }
    mapping(uint256 => PeriodInfo) public periods;

    // Per-address contribution tracking
    struct ContributorPeriod {
        uint256 score;                   // raw contribution score in this period
        bool claimed;
    }
    // address => period => ContributorPeriod
    mapping(address => mapping(uint256 => ContributorPeriod)) public contributions;

    event TradeRecorded(address indexed buyer, address indexed seller, uint256 dealValue, uint256 period);
    event PeriodAdvanced(uint256 indexed newPeriod, uint256 cumulativeVolume);
    event RewardClaimed(address indexed claimant, uint256 indexed period, uint256 amount);
    event MiningComplete(uint256 cumulativeVolume);

    modifier onlySealedTrade() {
        require(msg.sender == sealedTrade, "only SealedTrade");
        _;
    }

    constructor(address _sealToken) {
        require(_sealToken != address(0), "zero token");
        sealToken = IERC20(_sealToken);
        deployer = msg.sender;

        // Initialize period 0
        periods[0] = PeriodInfo({
            totalScore: 0,
            allocation: INITIAL_PERIOD_ALLOCATION,
            totalDistributed: 0,
            finalized: false
        });
    }

    function setSealedTrade(address _sealedTrade) external {
        require(msg.sender == deployer, "not deployer");
        require(sealedTrade == address(0), "already set");
        require(_sealedTrade != address(0), "zero address");
        sealedTrade = _sealedTrade;
    }

    /// @notice Record a completed trade. Called by SealedTrade on settlement.
    function recordTrade(
        address buyer,
        address seller,
        uint256 dealValue
    ) external onlySealedTrade {
        // Guard: no recording after mining is complete
        if (currentPeriod >= MAX_PERIODS) return;

        uint256 period = currentPeriod;

        // Add contribution scores (split equally between buyer and seller)
        uint256 halfValue = dealValue / 2;
        _addScore(buyer, period, halfValue);
        _addScore(seller, period, halfValue);

        // Update cumulative volume and check for halving
        cumulativeVolume += dealValue;
        _checkHalving();

        emit TradeRecorded(buyer, seller, dealValue, period);
    }

    /// @notice Claim mining rewards for a finalized period.
    ///         Reward = period_allocation * (my_score / total_score).
    ///         No cross-period decay — rewards are proportional within the period.
    function claimReward(uint256 period) external nonReentrant returns (uint256) {
        PeriodInfo storage pi = periods[period];
        require(pi.finalized, "period not finalized");
        require(pi.totalScore > 0, "no contributions");

        ContributorPeriod storage cp = contributions[msg.sender][period];
        require(cp.score > 0, "no contribution");
        require(!cp.claimed, "already claimed");

        // Calculate reward: proportional share of period allocation
        uint256 reward = (pi.allocation * cp.score) / pi.totalScore;

        // CEI: update state before transfer
        cp.claimed = true;
        pi.totalDistributed += reward;

        sealToken.safeTransfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, period, reward);
        return reward;
    }

    /// @notice Get current mining rate (SEAL per $1 of trade volume)
    function getCurrentMiningRate() external view returns (uint256) {
        if (currentPeriod >= MAX_PERIODS) return 0;
        uint256 periodAlloc = INITIAL_PERIOD_ALLOCATION >> currentPeriod;
        uint256 volRemaining = _periodVolume(currentPeriod) - _volumeInCurrentPeriod();
        if (volRemaining == 0) return 0;
        return periodAlloc / volRemaining;
    }

    /// @notice Get allocation for a specific period
    function periodAllocation(uint256 period) external pure returns (uint256) {
        if (period >= MAX_PERIODS) return 0;
        return INITIAL_PERIOD_ALLOCATION >> period;
    }

    /// @notice Get volume within a specific period
    function periodVolume(uint256 period) external pure returns (uint256) {
        return _periodVolume(period);
    }

    function _addScore(address contributor, uint256 period, uint256 score) internal {
        contributions[contributor][period].score += score;
        periods[period].totalScore += score;
    }

    function _checkHalving() internal {
        uint256 threshold = _cumulativeThreshold(currentPeriod);
        while (cumulativeVolume >= threshold && currentPeriod < MAX_PERIODS) {
            // Finalize current period
            periods[currentPeriod].finalized = true;

            // Advance to next period
            currentPeriod++;
            if (currentPeriod < MAX_PERIODS) {
                periods[currentPeriod] = PeriodInfo({
                    totalScore: 0,
                    allocation: INITIAL_PERIOD_ALLOCATION >> currentPeriod,
                    totalDistributed: 0,
                    finalized: false
                });
                threshold = _cumulativeThreshold(currentPeriod);
                emit PeriodAdvanced(currentPeriod, cumulativeVolume);
            } else {
                emit MiningComplete(cumulativeVolume);
            }
        }
    }

    /// @notice Cumulative volume threshold to end period n
    /// Formula: $10K * 2^n
    function _cumulativeThreshold(uint256 period) internal pure returns (uint256) {
        return HALVING_INITIAL * (1 << period);
    }

    /// @notice Volume within a single period
    /// Period 0: $10K, Period 1: $10K, Period 2: $20K, Period 3: $40K, ...
    function _periodVolume(uint256 period) internal pure returns (uint256) {
        if (period == 0) return HALVING_INITIAL;
        return HALVING_INITIAL * (1 << (period - 1));
    }

    function _volumeInCurrentPeriod() internal view returns (uint256) {
        if (currentPeriod == 0) return cumulativeVolume;
        uint256 prevCumulative = _cumulativeThreshold(currentPeriod - 1);
        return cumulativeVolume - prevCumulative;
    }
}
