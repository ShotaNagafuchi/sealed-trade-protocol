// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {BondVault} from "./BondVault.sol";
import {ContributionLedger} from "./ContributionLedger.sol";
import {Treasury} from "./Treasury.sol";

/// @title SealedTrade — Core trade lifecycle orchestrator
/// @notice Manages bilateral trades from listing through settlement.
///         Coordinates BondVault (collateral), ContributionLedger (mining), Treasury (fees).
contract SealedTrade is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Types ---
    enum TradeState {
        Listed,
        Matched,
        Negotiating,
        Agreed,
        Settled,
        Cancelled
    }

    struct Trade {
        bytes32 tradeId;
        bytes32 assetHash;           // SHA-256 of asset description
        address seller;
        address buyer;
        uint256 maxDealValue;        // seller's asking ceiling (USDC, 6 dec)
        uint256 finalDealValue;      // agreed price
        uint64 deadline;
        TradeState state;
        bytes32 attestationHash;     // TEE attestation of negotiation
        bytes32 termsHash;           // hash of agreed terms document
    }

    // --- Constants ---
    uint256 public constant FEE_BPS = 30; // 0.3%

    // EIP-712 domain separator components
    bytes32 public constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 public constant AGREEMENT_TYPEHASH =
        keccak256("Agreement(bytes32 tradeId,uint256 finalDealValue,bytes32 termsHash)");
    bytes32 public immutable DOMAIN_SEPARATOR;

    // Signature malleability bound (secp256k1 curve order / 2)
    uint256 private constant MAX_S = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;

    // --- State ---
    IERC20 public immutable usdc;
    BondVault public immutable bondVault;
    ContributionLedger public immutable contributionLedger;
    Treasury public immutable treasury;

    mapping(bytes32 => Trade) public trades;
    uint256 public tradeCount;

    // --- Events ---
    event TradeListed(bytes32 indexed tradeId, address indexed seller, bytes32 assetHash, uint256 maxDealValue);
    event TradeMatched(bytes32 indexed tradeId, address indexed buyer);
    event TradeNegotiating(bytes32 indexed tradeId, bytes32 attestationHash);
    event TradeAgreed(
        bytes32 indexed tradeId,
        uint256 finalDealValue,
        bytes32 termsHash,
        bytes32 attestationHash
    );
    event TradeSettled(bytes32 indexed tradeId, uint256 dealValue, uint256 fee);
    event TradeCancelled(bytes32 indexed tradeId, address indexed initiator);

    constructor(
        address _usdc,
        address _bondVault,
        address _contributionLedger,
        address _treasury
    ) {
        require(_usdc != address(0), "zero usdc");
        require(_bondVault != address(0), "zero bondVault");
        require(_contributionLedger != address(0), "zero ledger");
        require(_treasury != address(0), "zero treasury");

        usdc = IERC20(_usdc);
        bondVault = BondVault(_bondVault);
        contributionLedger = ContributionLedger(_contributionLedger);
        treasury = Treasury(_treasury);

        DOMAIN_SEPARATOR = keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            keccak256("SealedTrade"),
            keccak256("1"),
            block.chainid,
            address(this)
        ));
    }

    /// @notice List an asset for trade. Seller posts Discovery bond.
    function listAsset(
        bytes32 assetHash,
        uint256 maxDealValue,
        uint64 deadline
    ) external returns (bytes32 tradeId) {
        require(maxDealValue > 0, "zero deal value");
        require(deadline > block.timestamp, "deadline passed");

        tradeCount++;
        tradeId = keccak256(abi.encodePacked(msg.sender, tradeCount, block.timestamp));

        trades[tradeId] = Trade({
            tradeId: tradeId,
            assetHash: assetHash,
            seller: msg.sender,
            buyer: address(0),
            maxDealValue: maxDealValue,
            finalDealValue: 0,
            deadline: deadline,
            state: TradeState.Listed,
            attestationHash: bytes32(0),
            termsHash: bytes32(0)
        });

        // Seller posts Discovery bond
        bondVault.postBondFor(tradeId, msg.sender, BondVault.BondStage.Discovery, maxDealValue);

        emit TradeListed(tradeId, msg.sender, assetHash, maxDealValue);
    }

    /// @notice Buyer expresses interest. Posts Discovery bond.
    function expressInterest(bytes32 tradeId) external {
        Trade storage t = trades[tradeId];
        require(t.state == TradeState.Listed, "not listed");
        require(msg.sender != t.seller, "cannot self-match");
        require(block.timestamp < t.deadline, "deadline passed");

        t.buyer = msg.sender;
        t.state = TradeState.Matched;

        // Buyer posts Discovery bond
        bondVault.postBondFor(tradeId, msg.sender, BondVault.BondStage.Discovery, t.maxDealValue);

        emit TradeMatched(tradeId, msg.sender);
    }

    /// @notice Begin agent negotiation. Both parties escalate to Negotiation bond.
    function beginNegotiation(bytes32 tradeId, bytes32 attestationHash) external {
        Trade storage t = trades[tradeId];
        require(t.state == TradeState.Matched, "not matched");
        require(msg.sender == t.seller || msg.sender == t.buyer, "not party");
        require(attestationHash != bytes32(0), "empty attestation");

        t.state = TradeState.Negotiating;
        t.attestationHash = attestationHash;

        // Escalate both parties to Negotiation bond
        bondVault.escalateBond(tradeId, t.buyer, BondVault.BondStage.Negotiation, t.maxDealValue);
        bondVault.escalateBond(tradeId, t.seller, BondVault.BondStage.Negotiation, t.maxDealValue);

        emit TradeNegotiating(tradeId, attestationHash);
    }

    /// @notice Commit agreement after successful negotiation. Escalate to Execution bond.
    function commitAgreement(
        bytes32 tradeId,
        uint256 finalDealValue,
        bytes32 termsHash,
        bytes32 finalAttestationHash,
        bytes calldata buyerSig,
        bytes calldata sellerSig
    ) external {
        Trade storage t = trades[tradeId];
        require(t.state == TradeState.Negotiating, "not negotiating");
        require(finalDealValue > 0 && finalDealValue <= t.maxDealValue, "invalid deal value");
        require(termsHash != bytes32(0), "empty terms hash");
        require(finalAttestationHash != bytes32(0), "empty attestation");

        // Verify both signatures using EIP-712
        bytes32 structHash = keccak256(abi.encode(
            AGREEMENT_TYPEHASH,
            tradeId,
            finalDealValue,
            termsHash
        ));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));

        require(_verifySignature(digest, buyerSig, t.buyer), "bad buyer sig");
        require(_verifySignature(digest, sellerSig, t.seller), "bad seller sig");

        t.finalDealValue = finalDealValue;
        t.termsHash = termsHash;
        t.attestationHash = finalAttestationHash;
        t.state = TradeState.Agreed;

        // Escalate to Execution bond (based on final deal value)
        bondVault.escalateBond(tradeId, t.buyer, BondVault.BondStage.Execution, finalDealValue);
        bondVault.escalateBond(tradeId, t.seller, BondVault.BondStage.Execution, finalDealValue);

        emit TradeAgreed(tradeId, finalDealValue, termsHash, finalAttestationHash);
    }

    /// @notice Settle the trade. Transfer deal value, collect fee, release bonds, record contribution.
    function settle(bytes32 tradeId) external nonReentrant {
        Trade storage t = trades[tradeId];
        require(t.state == TradeState.Agreed, "not agreed");
        require(msg.sender == t.seller || msg.sender == t.buyer, "not party");

        // CEI: update state first
        t.state = TradeState.Settled;

        uint256 dealValue = t.finalDealValue;
        uint256 fee = (dealValue * FEE_BPS) / 10_000;
        uint256 sellerProceeds = dealValue - fee;

        // Transfer deal value: buyer pays seller (net of fee)
        usdc.safeTransferFrom(t.buyer, t.seller, sellerProceeds);

        // Transfer fee: buyer pays treasury directly
        if (fee > 0) {
            usdc.safeTransferFrom(t.buyer, address(treasury), fee);
            treasury.recordFee(fee);
        }

        // Release all bonds
        bondVault.releaseBonds(tradeId, t.buyer, t.seller);

        // Record trade for mining rewards
        contributionLedger.recordTrade(t.buyer, t.seller, dealValue);

        emit TradeSettled(tradeId, dealValue, fee);
    }

    /// @notice Cancel a trade. Available before Agreed state.
    function cancel(bytes32 tradeId) external nonReentrant {
        Trade storage t = trades[tradeId];
        require(
            t.state == TradeState.Listed ||
            t.state == TradeState.Matched ||
            t.state == TradeState.Negotiating,
            "cannot cancel"
        );
        require(msg.sender == t.seller || msg.sender == t.buyer, "not party");

        TradeState prevState = t.state;
        t.state = TradeState.Cancelled;

        // If cancelling after negotiation started, slash the canceller's bond
        if (prevState == TradeState.Negotiating) {
            address counterparty = msg.sender == t.seller ? t.buyer : t.seller;
            bondVault.slashBond(tradeId, msg.sender, counterparty);
        } else {
            // Release bonds normally
            if (t.buyer != address(0)) {
                bondVault.releaseBonds(tradeId, t.buyer, t.seller);
            } else {
                // Only seller had a bond
                bondVault.releaseBonds(tradeId, address(0), t.seller);
            }
        }

        emit TradeCancelled(tradeId, msg.sender);
    }

    /// @notice Check if trade deadline has passed. Anyone can call to trigger cancellation.
    function expireTrade(bytes32 tradeId) external nonReentrant {
        Trade storage t = trades[tradeId];
        require(block.timestamp >= t.deadline, "not expired");
        require(
            t.state == TradeState.Listed ||
            t.state == TradeState.Matched ||
            t.state == TradeState.Negotiating,
            "cannot expire"
        );

        t.state = TradeState.Cancelled;

        // Release bonds without slashing on expiry
        if (t.buyer != address(0)) {
            bondVault.releaseBonds(tradeId, t.buyer, t.seller);
        } else {
            bondVault.releaseBonds(tradeId, address(0), t.seller);
        }

        emit TradeCancelled(tradeId, address(0));
    }

    /// @notice EIP-712 signature verification with malleability protection
    function _verifySignature(
        bytes32 digest,
        bytes calldata sig,
        address expected
    ) internal pure returns (bool) {
        if (sig.length != 65) return false;
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }
        // Reject high-s signatures (EIP-2 malleability fix)
        if (uint256(s) > MAX_S) return false;
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return false;

        address recovered = ecrecover(digest, v, r, s);
        return recovered != address(0) && recovered == expected;
    }
}
