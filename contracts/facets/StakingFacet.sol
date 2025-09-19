// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibAppStorage, AppStorage } from "../libraries/LibAppStorage.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakingFacet {
    // --- 事件 ---
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);

    // --- 修改器 ---
    modifier updateReward(address _account) {
        AppStorage storage ds = LibAppStorage.layout();
        ds.rewardPerTokenStored = rewardPerToken();
        ds.lastUpdateTime = block.timestamp;
        if (_account != address(0)) {
            ds.rewards[_account] = earned(_account);
            ds.userRewardPerTokenPaid[_account] = ds.rewardPerTokenStored;
        }
        _;
    }

    // --- 外部函数 ---

    /// @notice 初始化质押合约的参数 (只能调用一次)
    function initStaking(address _stakingToken, address _rewardsToken, uint256 _rewardsRate) external {
        AppStorage storage ds = LibAppStorage.layout();
        require(ds.stakingToken == address(0), "StakingFacet: Already initialized");
        ds.stakingToken = _stakingToken;
        ds.rewardsToken = _rewardsToken;
        ds.rewardsRate = _rewardsRate;
    }
    
    /// @notice 质押代币
    function stake(uint256 _amount) external updateReward(msg.sender) {
        AppStorage storage ds = LibAppStorage.layout();
        require(_amount > 0, "StakingFacet: Amount must be > 0");
        ds.stakedBalances[msg.sender] += _amount;
        ds.totalSupply += _amount;
        IERC20(ds.stakingToken).transferFrom(msg.sender, address(this), _amount);
        emit Staked(msg.sender, _amount);
    }

    /// @notice 取消质押
    function unstake(uint256 _amount) external updateReward(msg.sender) {
        AppStorage storage ds = LibAppStorage.layout();
        require(_amount > 0, "StakingFacet: Amount must be > 0");
        require(ds.stakedBalances[msg.sender] >= _amount, "StakingFacet: Insufficient staked balance");
        ds.stakedBalances[msg.sender] -= _amount;
        ds.totalSupply -= _amount;
        IERC20(ds.stakingToken).transfer(msg.sender, _amount);
        emit Unstaked(msg.sender, _amount);
    }

    /// @notice 领取奖励
    function claimRewards() external updateReward(msg.sender) {
        AppStorage storage ds = LibAppStorage.layout();
        uint256 reward = ds.rewards[msg.sender];
        require(reward > 0, "StakingFacet: No rewards to claim");
        ds.rewards[msg.sender] = 0;
        IERC20(ds.rewardsToken).transfer(msg.sender, reward);
        emit RewardsClaimed(msg.sender, reward);
    }
    
    function rewardsRate() external view returns (uint256) {
        return LibAppStorage.layout().rewardsRate;
    }

    // --- 视图函数 ---

    /// @notice 查看用户的质押余额
    function stakedBalanceOf(address _account) external view returns (uint256) {
        return LibAppStorage.layout().stakedBalances[_account];
    }
    
    /// @notice 查看用户赚取的奖励
    function earned(address _account) public view returns (uint256) {
        AppStorage storage ds = LibAppStorage.layout();
        return ds.stakedBalances[_account] *
            (rewardPerToken() - ds.userRewardPerTokenPaid[_account]) / 1e18 +
            ds.rewards[_account];
    }

    // --- 内部函数 ---

    /// @notice 计算每单位代币的累计奖励
    function rewardPerToken() internal view returns (uint256) {
        AppStorage storage ds = LibAppStorage.layout();
        if (ds.totalSupply == 0) {
            return ds.rewardPerTokenStored;
        }
        return ds.rewardPerTokenStored +
            (block.timestamp - ds.lastUpdateTime) * ds.rewardsRate * 1e18 / ds.totalSupply;
    }
}