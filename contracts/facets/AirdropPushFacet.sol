// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6; // 與你的專案版本保持一致

import { LibAppStorage, AppStorage } from "../libraries/LibAppStorage.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AirdropPushFacet {
    event Pushed(address indexed recipient, uint256 amount);

    function airdropPush(address[] calldata recipients, uint256[] calldata amounts) external {
        AppStorage storage ds = LibAppStorage.layout();
        // 使用 Diamond 的 owner 進行權限控制
        require(msg.sender == ds.owner, "AirdropPushFacet: Not owner");
        require(recipients.length == amounts.length, "Airdrop: Mismatched array lengths");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            totalAmount += amounts[i];
        }
        require(IERC20(ds.airdropToken).balanceOf(address(this)) >= totalAmount, "Airdrop: Insufficient token balance");

        for (uint256 i = 0; i < recipients.length; i++) {
            IERC20(ds.airdropToken).transfer(recipients[i], amounts[i]);
            emit Pushed(recipients[i], amounts[i]);
        }
    }
}