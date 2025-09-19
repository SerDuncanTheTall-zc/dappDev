// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import { LibAppStorage, AppStorage } from "../libraries/LibAppStorage.sol";

contract MessageFacetV2 {
    /// @notice 设置消息，并自动添加 "V2: " 前缀
    function setMessage(string calldata _newMessage) external {
        AppStorage storage ds = LibAppStorage.layout();
        // 使用 abi.encodePacked 进行拼接，并转换为 string
        ds.message = string(abi.encodePacked("V2: ", _newMessage));
    }

    /// @notice 读取消息
    function getMessage() external view returns (string memory) {
        return LibAppStorage.layout().message;
    }

    /// @notice 新增的函数：清空消息
    function clearMessage() external {
        AppStorage storage ds = LibAppStorage.layout();
        ds.message = "";
    }
}