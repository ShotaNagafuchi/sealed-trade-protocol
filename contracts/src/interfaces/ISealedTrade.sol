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

    event TradeListed(bytes32 indexed tradeId, address indexed seller, bytes32 assetHash, uint256 maxDealValue);
    event TradeMatched(bytes32 indexed tradeId, address indexed buyer);
    event TradeNegotiating(bytes32 indexed tradeId, bytes32 attestationHash);
    event TradeAgreed(bytes32 indexed tradeId, uint256 finalDealValue, bytes32 termsHash, bytes32 attestationHash);
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
    function escalateBond(bytes32 tradeId, address party, BondStage newStage, uint256 dealValue) external;
    function releaseBonds(bytes32 tradeId, address buyer, address seller) external;
    function slashBond(bytes32 tradeId, address faultyParty, address counterparty) external;
    function getBondAmount(BondStage stage, uint256 dealValue) external pure returns (uint256);
}

interface ITreasury {
    function recordFee(uint256 amount) external;
    function recordSlash(uint256 amount) external;
}
