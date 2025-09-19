// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import { LibAppStorage, AppStorage } from "../libraries/LibAppStorage.sol";

contract InitAirdrop {
    function init(address _airdropToken) external {
        AppStorage storage ds = LibAppStorage.layout();
        // 確保只初始化一次
        require(ds.airdropToken == address(0), "InitAirdrop: Already initialized");
        ds.airdropToken = _airdropToken;
    }
}