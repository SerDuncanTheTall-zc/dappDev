// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import { LibAppStorage, AppStorage, TokenInfo } from "../libraries/LibAppStorage.sol";

import "../interfaces/IERC20Metadata.sol";
import "../interfaces/AggregatorV3Interface.sol";

contract LendingFacet {
    uint256 private constant FACTOR_PRECISION = 1e4;
    uint256 private constant HEALTH_FACTOR_PRECISION = 1e18;

    // ... (管理功能 supportToken, setPriceFeed 不变) ...
    function supportToken(address _token, uint256 _collateralFactor) external {
        AppStorage storage ds = LibAppStorage.layout();
        require(msg.sender == ds.owner, "Lending: Not owner");
        require(!ds.supportedTokens[_token].isSupported, "Lending: Token already supported");
        require(_collateralFactor > 0 && _collateralFactor <= FACTOR_PRECISION, "Lending: Invalid factor");
        ds.supportedTokens[_token] = TokenInfo({isSupported: true, collateralFactor: _collateralFactor});
    }
    function setPriceFeed(address _token, address _feed) external {
        AppStorage storage ds = LibAppStorage.layout();
        require(msg.sender == ds.owner, "Lending: Not owner");
        ds.priceFeeds[_token] = AggregatorV3Interface(_feed);
    }


    // --- 核心功能 ---
    function deposit(address _token, uint256 _amount) external {
        _trackUserAsset(msg.sender, _token);
        AppStorage storage ds = LibAppStorage.layout();
        require(ds.supportedTokens[_token].isSupported, "Lending: Token not supported");
        require(_amount > 0, "Lending: Amount must be > 0");
        ds.userDeposits[msg.sender][_token] += _amount;
        IERC20Metadata(_token).transferFrom(msg.sender, address(this), _amount);
    }

    function withdraw(address _token, uint256 _amount) external {
        AppStorage storage ds = LibAppStorage.layout();
        require(ds.userDeposits[msg.sender][_token] >= _amount, "Lending: Insufficient deposit");
        
        ds.userDeposits[msg.sender][_token] -= _amount;
        require(getHealthFactor(msg.sender) >= HEALTH_FACTOR_PRECISION, "Lending: Position would be undercollateralized");
        
        IERC20Metadata(_token).transfer(msg.sender, _amount);
    }

    function borrow(address _token, uint256 _amount) external {
        _trackUserAsset(msg.sender, _token);
        AppStorage storage ds = LibAppStorage.layout();
        require(ds.supportedTokens[_token].isSupported, "Lending: Token not supported");
        require(_amount > 0, "Lending: Amount must be > 0");

        (uint256 totalCollateralValue, ) = getAccountInfo(msg.sender);

        uint256 borrowValue = (_amount * getPrice(_token)) / (10**IERC20Metadata(_token).decimals());
        
        require(totalCollateralValue >= borrowValue, "Lending: Borrow amount exceeds collateral limit");
        require(getHealthFactor(msg.sender) > HEALTH_FACTOR_PRECISION, "Lending: Insufficient health factor");

        ds.userBorrows[msg.sender][_token] += _amount;
        IERC20Metadata(_token).transfer(msg.sender, _amount);
    }

    function repay(address _token, uint256 _amount) external {
        AppStorage storage ds = LibAppStorage.layout();
        require(ds.userBorrows[msg.sender][_token] >= _amount, "Lending: Repay amount exceeds borrow");
        ds.userBorrows[msg.sender][_token] -= _amount;
        IERC20Metadata(_token).transferFrom(msg.sender, address(this), _amount);
    }


    // --- 视圖功能 ---
    function getAccountInfo(address _user) public view returns (uint256 totalCollateralValue, uint256 totalBorrowValue) {
        AppStorage storage ds = LibAppStorage.layout();
        address[] memory assets = ds.userAssets[_user];
        
        for(uint i = 0; i < assets.length; i++) {
            address token = assets[i];
            uint256 price = getPrice(token);

            uint256 decimals = 10**IERC20Metadata(token).decimals();

            uint256 depositAmount = ds.userDeposits[_user][token];
            if (depositAmount > 0) {
                uint256 depositValue = (depositAmount * price) / decimals;
                uint256 collateralFactor = ds.supportedTokens[token].collateralFactor;
                totalCollateralValue += (depositValue * collateralFactor) / FACTOR_PRECISION;
            }

            uint256 borrowAmount = ds.userBorrows[_user][token];
            if (borrowAmount > 0) {
                totalBorrowValue += (borrowAmount * price) / decimals;
            }
        }
    }

    function getHealthFactor(address _user) public view returns (uint256) {
        (uint256 totalCollateralValue, uint256 totalBorrowValue) = getAccountInfo(_user);
        if (totalBorrowValue == 0) {
            return type(uint256).max;
        }
        return (totalCollateralValue * HEALTH_FACTOR_PRECISION) / totalBorrowValue;
    }

    function getPrice(address _token) public view returns (uint256) {
        AppStorage storage ds = LibAppStorage.layout();
        AggregatorV3Interface feed = ds.priceFeeds[_token];
        require(address(feed) != address(0), "Lending: Price feed not set");
        
        (, int256 price, , , ) = feed.latestRoundData();
        require(price > 0, "Lending: Invalid price from oracle");
        return uint256(price);
    }

    // --- 内部函数 ---
    function _trackUserAsset(address _user, address _token) internal {
        AppStorage storage ds = LibAppStorage.layout();
        if (!ds.hasInteracted[_user][_token]) {
            ds.hasInteracted[_user][_token] = true;
            ds.userAssets[_user].push(_token);
        }
    }
}