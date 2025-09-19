// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibAppStorage, AppStorage } from "../libraries/LibAppStorage.sol";

contract MessageFacet {
    /// @notice 设置存储在 Diamond 中的消息
    /// @param _newMessage 要设置的新消息
    function setMessage(string calldata _newMessage) external {
        // 获取 Diamond 的主存储空间
        AppStorage storage ds = LibAppStorage.layout();
        // 修改存储空间中的 message 变量
        ds.message = _newMessage;
    }

    /// @notice 从 Diamond 的存储中读取消息
    /// @return The message.
    function getMessage() external view returns (string memory) {
        // 获取 Diamond 的主存储空间并返回 message
        return LibAppStorage.layout().message;
    }
}