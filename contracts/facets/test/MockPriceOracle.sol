// contracts/test/MockPriceOracle.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IPriceOracle {
    function getPrice(address _token) external view returns (uint256);
}

// 继承 Ownable，其构造函数会自动将部署者设为 owner
contract MockPriceOracle is IPriceOracle, Ownable {
    // 价格以 USD 计算，带有 8 位小数 (类似 Chainlink)
    mapping(address => uint256) private prices;

    // 构造函数不再需要 initialOwner 参数
    constructor() {
        // Ownable 的构造函数在这里被自动隐式调用，无需参数
    }

    function setPrice(address _token, uint256 _price) external onlyOwner {
        prices[_token] = _price;
    }

    function getPrice(address _token) external view override returns (uint256) {
        uint256 price = prices[_token];
        require(price > 0, "MockPriceOracle: Price not set");
        return price;
    }
}