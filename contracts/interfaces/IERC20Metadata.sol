// contracts/interfaces/IERC20Metadata.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IERC20Metadata
 * @dev 扩展了标准的 IERC20 接口，增加了可选的元数据函数。
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev 返回代币的名称。
     */
    function name() external view returns (string memory);

    /**
     * @dev 返回代币的符号（代号）。
     */
    function symbol() external view returns (string memory);

    /**
     * @dev 返回代币使用的小数位数。
     */
    function decimals() external view returns (uint8);
}