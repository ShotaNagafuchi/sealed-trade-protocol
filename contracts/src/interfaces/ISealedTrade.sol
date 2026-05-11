// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

interface ISealedTrade {
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
        bytes32 assetHash;
        address seller;
        address buyer;
        uint256 dealValue;
        uint64 deadline;
        TradeState state;
        bytes32 attestationHash;
        bytes32 termsHash;
    }

    event TradeListed(bytes32 indexed tradeId, address indexed seller, bytes32 assetHash, uint256 maxDealValue);
    event TradeMatched(bytes32 indexed tradeId, address indexed buyer);
    event TradeNegotiating(bytes32 indexed tradeId);
    event TradeAgreed(bytes32 indexed tradeId, uint256 dealValue, bytes32 termsHash);
    event TradeSettled(bytes32 indexed tradeId, uint256 dealValue, uint256 fee);
    event TradeCancelled(bytes32 indexed tradeId, address indexed initiator);
}

interface IBondVault {
    enum BondStage {
        None,
        Discovery,
        Negotiation,
        Execution
    }

    function postBondFor(bytes32 tradeId, address party, BondStage stage, uint256 dealValue) external;
    function releaseBonds(bytes32 tradeId, address buyer, address seller) external;
    function slashBond(bytes32 tradeId, address faultyParty, address counterparty) external;
}

interface IContributionLedger {
    function recordTrade(address buyer, address seller, uint256 dealValue) external;
}

interface ITreasury {
    function recordFee(uint256 amount) external;
    function recordSlash(uint256 amount) external;
}
