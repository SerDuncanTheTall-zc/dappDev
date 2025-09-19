// contracts/test/MockPriceOracle.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IPriceOracle {
    function getPrice(address _token) external view returns (uint256);
}

contract MockPriceOracle is IPriceOracle, Ownable {
    // 價格以 USD 計算，帶有 8 位小數 (類似 Chainlink)
    mapping(address => uint256) private prices;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setPrice(address _token, uint256 _price) external onlyOwner {
        prices[_token] = _price;
    }

    function getPrice(address _token) external view override returns (uint256) {
        uint256 price = prices[_token];
        require(price > 0, "MockPriceOracle: Price not set");
        return price;
    }
}