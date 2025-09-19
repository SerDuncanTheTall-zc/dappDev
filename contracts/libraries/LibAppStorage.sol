// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../facets/test/MockPriceOracle.sol"; // 導入接口;

struct TokenInfo {
    bool isSupported;
    uint256 collateralFactor; // 抵押因子，例如 8000 代表 80%
}

// 这个结构体定义了 Diamond 的所有状态变量
struct AppStorage {
    // OwnershipFacet 的状态变量
    address owner;
    // MessageFacet 的状态变量
    string message;


    // --- 为 StakingFacet 添加的状态变量 ---
    // 质押代币的地址
    address stakingToken;
    // 奖励代币的地址
    address rewardsToken;
    // 每秒钟分发的奖励数量
    uint256 rewardsRate;
    // 上次更新奖励数据的时间戳
    uint256 lastUpdateTime;
    // 每单位质押代币累计的奖励数量
    uint256 rewardPerTokenStored;
    // 质押的总量
    uint256 totalSupply;
    // 记录用户已支付的“每单位奖励”
    mapping(address => uint256) userRewardPerTokenPaid;
    // 记录用户的奖励余额
    mapping(address => uint256) rewards;
    // 记录用户的质押余额
    mapping(address => uint256) stakedBalances;

    // --- 為 Airdrop Facets 添加的狀態變數 ---
    // 空投代幣的地址
    address airdropToken;
    // Merkle 樹的根哈希值
    bytes32 merkleRoot;
    // 記錄用戶是否已領取 Pull 模式空投
    mapping(address => bool) hasClaimed;

    // --- 為 LendingFacet 添加的狀態變數 ---
    IPriceOracle priceOracle;
    // 映射：代幣地址 => 代幣資訊
    mapping(address => TokenInfo) supportedTokens;
    // 映射：用戶地址 => 代幣地址 => 存款金額
    mapping(address => mapping(address => uint256)) userDeposits;
    // 映射：用戶地址 => 代幣地址 => 借款金額
    mapping(address => mapping(address => uint256)) userBorrows;
}

// 这个库提供了获取 Diamond 存储的方法
library LibAppStorage {
    /// @notice 返回 AppStorage 结构体的存储指针
    function layout() internal pure returns (AppStorage storage ds) {
        // 通过计算特定的存储槽位置来定位
        assembly {
            ds.slot := 0
        }
    }
}