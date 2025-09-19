// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6; // 與你的專案版本保持一致

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CoinCJMCCO
 * @dev 這是一個簡單的 ERC20 代幣，用於開發和測試。
 * 部署者 (msg.sender) 會自動成為擁有者。
 */
contract CoinLillard is ERC20, Ownable {
    
    /**
     * @dev 合約的構造函數
     */
    constructor() 
        ERC20("Lillard", "LLD") // 1. 設定代幣的全名和代號
        // 2. Ownable 的構造函數在這裡被自動調用，無需參數
    {
        // 3. 為部署者(同時也是擁有者)鑄造 1,000,000 個代幣
        _mint(msg.sender, 1_000_000 * (10**18));
    }

    /**
     * @notice 允許擁有者鑄造更多的代幣（可選功能）
     * @param to 接收代幣的地址
     * @param amount 要鑄造的數量
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}