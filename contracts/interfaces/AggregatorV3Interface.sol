// contracts/interfaces/AggregatorV3Interface.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

interface AggregatorV3Interface {
  function latestRoundData()
    external
    view
    returns (
      uint80 roundId,
      int256 answer, // The price
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    );
}