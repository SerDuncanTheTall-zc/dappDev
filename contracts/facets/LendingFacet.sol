// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import { LibAppStorage, AppStorage, TokenInfo } from "../libraries/LibAppStorage.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../test/MockPriceOracle.sol"; // 導入接口

contract LendingFacet {
    // --- 管理功能 ---
    function supportToken(address _token, uint256 _collateralFactor) external {
        AppStorage storage ds = LibAppStorage.layout();
        require(msg.sender == ds.owner, "Lending: Not owner");
        require(!ds.supportedTokens[_token].isSupported, "Lending: Token already supported");
        // 例如 _collateralFactor = 8000 代表 80%
        require(_collateralFactor > 0 && _collateralFactor < 10000, "Lending: Invalid factor");
        
        ds.supportedTokens[_token] = TokenInfo({
            isSupported: true,
            collateralFactor: _collateralFactor
        });
    }

    // --- 核心功能 ---
    function deposit(address _token, uint256 _amount) external {
        AppStorage storage ds = LibAppStorage.layout();
        require(ds.supportedTokens[_token].isSupported, "Lending: Token not supported");
        require(_amount > 0, "Lending: Amount must be > 0");
        ds.userDeposits[msg.sender][_token] += _amount;
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
    }

    function withdraw(address _token, uint256 _amount) external {
        AppStorage storage ds = LibAppStorage.layout();
        require(ds.userDeposits[msg.sender][_token] >= _amount, "Lending: Insufficient deposit");
        
        ds.userDeposits[msg.sender][_token] -= _amount;
        // 提款後，檢查健康因子是否仍然安全
        (uint256 totalCollateral, uint256 totalBorrow) = getAccountInfo(msg.sender);
        require(totalBorrow == 0 || (totalCollateral * 10000 / totalBorrow) > 10000, "Lending: Position would be undercollateralized");
        
        IERC20(_token).transfer(msg.sender, _amount);
    }

    function borrow(address _token, uint256 _amount) external {
        AppStorage storage ds = LibAppStorage.layout();
        require(ds.supportedTokens[_token].isSupported, "Lending: Token not supported");
        require(_amount > 0, "Lending: Amount must be > 0");

        (uint256 totalCollateral, uint256 totalBorrow) = getAccountInfo(msg.sender);
        uint256 borrowValue = (_amount * ds.priceOracle.getPrice(_token)) / 1e8;
        
        // 借款後，檢查健康因子是否仍然安全
        require((totalCollateral * 10000 / (totalBorrow + borrowValue)) > 10000, "Lending: Insufficient collateral");

        ds.userBorrows[msg.sender][_token] += _amount;
        IERC20(_token).transfer(msg.sender, _amount);
    }

    function repay(address _token, uint256 _amount) external {
        AppStorage storage ds = LibAppStorage.layout();
        require(ds.userBorrows[msg.sender][_token] >= _amount, "Lending: Repay amount exceeds borrow");
        ds.userBorrows[msg.sender][_token] -= _amount;
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
    }

    // --- 視圖功能 ---
    function getAccountInfo(address _user) public view returns (uint256 totalCollateralValue, uint256 totalBorrowValue) {
        AppStorage storage ds = LibAppStorage.layout();
        // 這裡的實現是簡化的，一個真實的協議需要遍歷用戶所有資產
        // 為了演示，我們假設只存借了 WETH 和 DAI
        address weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // 範例地址
        address dai = 0x6B175474E89094C44Da98b954EedeAC495271d0F;   // 範例地址

        uint256 wethDeposits = ds.userDeposits[_user][weth];
        if (wethDeposits > 0) {
            uint256 price = ds.priceOracle.getPrice(weth);
            uint256 value = (wethDeposits * price) / 1e18; // 假設 WETH 是 18 位小數
            totalCollateralValue += (value * ds.supportedTokens[weth].collateralFactor) / 10000;
        }

        uint256 daiBorrows = ds.userBorrows[_user][dai];
        if (daiBorrows > 0) {
            uint256 price = ds.priceOracle.getPrice(dai);
            totalBorrowValue += (daiBorrows * price) / 1e18; // 假設 DAI 是 18 位小數
        }
    }
}