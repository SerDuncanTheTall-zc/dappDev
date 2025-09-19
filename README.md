# 多功能 DeFi 钻石合约 (Multi-Functional DeFi Diamond Contract)

这是一个基于 **EIP-2535 钻石标准** 的多功能、可升级智能合约项目，旨在展示钻石模式在构建复杂 DeFi 应用中的强大能力和灵活性。

## 核心架构：钻石标准 (EIP-2535)

本项目围绕 EIP-2535 钻石标准构建，其核心优势包括：

* **模块化**: 每个独立的功能（如质押、借贷）都被封装在称为 **Facet** 的独立合约中。
* **可升级性**: 可以通过 `diamondCut` 函数，以原子方式（atomic）安全地新增、替换或移除功能，而无需重新部署整个系统。
* **突破合约大小限制**: 通过将逻辑分散到多个 Facet 中，主合约（Diamond）可以无限扩展功能，不受以太坊 24KB 的合约大小限制。
* **共享存储**: 所有 Facet 共享同一个状态存储空间（通过 `LibAppStorage.sol` 统一定义），使得不同功能模块之间可以无缝、高效地互动。

---

## 已实现功能 (Features)

我们在该钻石合约中，以 Facet 的形式逐步整合了以下 DApp 功能：

#### 1. 基础功能
* **所有权管理 (`OwnershipFacet`)**: 基于 OpenZeppelin 的 `Ownable` 模式，管理合约的拥有者权限。
* **钻石结构审查 (`DiamondLoupeFacet`)**: 提供标准的 "Loupe" 功能，允许任何人查询钻石当前拥有哪些 Facet 以及每个 Facet 包含了哪些函数。

#### 2. 消息存储 (`MessageFacet` & `MessageFacetV2`)
* 一个简单的状态管理范例，用于演示钻石升级中最基本的操作。
* 实现了 `setMessage` 和 `getMessage` 函数。
* 通过 `MessageFacetV2` 完整演示了**替换 (Replace)** 和**移除 (Remove)** Facet 的标准流程。

#### 3. 代币质押 (`StakingFacet`)
* 一个功能性的 ERC20 代币质押池。
* 用户可以质押指定的代币（Staking Token）。
* 合约根据时间和总质押量，按比例为用户计算并累积奖励代币（Rewards Token）。
* 用户可以随时领取奖励或取消质押。

#### 4. 代币空投 (Airdrop)
实现了两种业界最主流的空投模式：
* **推送模式 (`AirdropPushFacet`)**:
    * 由项目方（合约拥有者）发起，直接将代币批量发送到白名单用户的钱包。
    * 对用户友好（无需操作），但对项目方 Gas 成本极高，适用于小规模空投。
* **拉取模式 (`AirdropPullFacet`)**:
    * 基于**默克尔树 (Merkle Tree)** 的高效空投方案。
    * 项目方只需在链上存储一个 `bytes32` 的 Merkle Root，Gas 成本极低。
    * 白名单用户凭借自己的 Merkle Proof 主动到合约领取（Claim）空投，自行支付 Gas。
    * 这是大规模空投的行业标准。

#### 5. 去中心化借贷 (`LendingFacet`)
* 一个简化版的 Aave / Compound 模式的借贷协议。
* **核心功能**:
    * **存款 (Deposit)**: 用户存入资产作为抵押品。
    * **借款 (Borrow)**: 用户根据抵押品价值借出其他资产。
    * **提款 (Withdraw)** & **还款 (Repay)**。
* **风险管理**:
    * **价格预言机 (Price Oracle)**: 整合了价格来源机制，兼容本地测试的 `MockPriceOracle` 和 Sepolia 测试网的 **Chainlink** 价格源。
    * **抵押因子 (Collateral Factor)**: 为不同资产设定不同的抵押率。
    * **健康因子 (Health Factor)**: 实现了核心风控逻辑，防止用户在仓位不健康时提取抵押品或借出更多资产。
* **简化说明**: 为聚焦核心逻辑，此 Facet 未实现利息模型和清算机制。

---

## 技术栈 (Tech Stack)
* **Solidity** (`0.8.6`)
* **Hardhat**: 开发、测试和部署框架。
* **Ethers.js**: 与以太坊区块链进行交互。
* **OpenZeppelin Contracts**: 用于 ERC20、Ownable 等标准合约。
* **MerkleTree.js**: 用于在链下生成 Merkle Tree。

---

## 快速开始 (Getting Started)

1.  **克隆项目**
    ```bash
    git clone <YOUR_REPOSITORY_URL>
    ```
2.  **进入目录**
    ```bash
    cd <PROJECT_DIRECTORY>
    ```
3.  **安装依赖**
    ```bash
    npm install
    ```

---

## 使用方法 (Usage)

1.  **编译合约**
    ```bash
    npx hardhat compile
    ```
2.  **启动本地节点**
    ```bash
    npx hardhat node
    ```
3.  **执行部署与升级脚本**
    在**新的终端**中，按顺序执行脚本来部署和扩展你的 Diamond。
    ```bash
    # 部署初始 Diamond
    npx hardhat run scripts/deploy.js --network localhost
    
    # 添加质押功能
    npx hardhat run scripts/addStakingFacet.js --network localhost

    # 添加空投功能
    npx hardhat run scripts/addAirdropFacets.js --network localhost
    
    # ... 执行其他替换或移除脚本
    ```

---

## 许可证 (License)
本项目采用 [MIT License](LICENSE)。

<br>
<hr>
<br>

# Multi-Functional DeFi Diamond Contract

This is a multi-functional, upgradeable smart contract project based on the **EIP-2535 Diamond Standard**. It is designed to showcase the power and flexibility of the Diamond pattern in building complex DeFi applications.

## Core Architecture: The Diamond Standard (EIP-2535)

This project is built around the EIP-2535 Diamond Standard, which offers several key advantages:

* **Modularity**: Each distinct feature (e.g., Staking, Lending) is encapsulated in a separate contract called a **Facet**.
* **Upgradability**: New features can be added, existing ones replaced, and old ones removed safely and atomically through the `diamondCut` function, without requiring a full system redeployment.
* **Bypassing Contract Size Limit**: By distributing logic across multiple Facets, the main contract (the Diamond) can have virtually unlimited functionality, overcoming the 24KB contract size limit on Ethereum.
* **Shared Storage**: All Facets share a single state storage space, defined centrally in `LibAppStorage.sol`. This allows for seamless and efficient interaction between different functional modules.

---

## Implemented Features

The following DApp functionalities have been progressively integrated into this Diamond contract as Facets:

#### 1. Base Functionality
* **Ownership Management (`OwnershipFacet`)**: Manages contract owner permissions based on OpenZeppelin's `Ownable` pattern.
* **Diamond Loupe (`DiamondLoupeFacet`)**: Provides standard "loupe" functions, allowing anyone to query which Facets the Diamond currently has and which functions belong to each Facet.

#### 2. Message Storage (`MessageFacet` & `MessageFacetV2`)
* A simple state management example to demonstrate the fundamental upgrade operations.
* Implements `setMessage` and `getMessage` functions.
* Fully demonstrates the standard workflows for **Replacing** and **Removing** Facets using `MessageFacetV2`.

#### 3. Token Staking (`StakingFacet`)
* A functional ERC20 token staking pool.
* Users can stake a specified ERC20 token.
* The contract calculates and accrues rewards for stakers over time, distributed proportionally based on their stake.
* Users can claim rewards or unstake their tokens at any time.

#### 4. Token Airdrop
Implements the two most common airdrop patterns in the industry:
* **Push Model (`AirdropPushFacet`)**:
    * Initiated by the project owner to directly transfer tokens to a list of whitelisted user wallets.
    * User-friendly (zero action required from users) but extremely gas-intensive for the owner, suitable for small-scale airdrops.
* **Pull Model (`AirdropPullFacet`)**:
    * An efficient solution based on **Merkle Trees**.
    * The project owner only stores a single `bytes32` Merkle Root on-chain, resulting in minimal gas costs.
    * Whitelisted users generate their unique Merkle Proof off-chain and use it to actively claim their tokens, paying the gas for the claim transaction themselves.
    * This is the industry standard for large-scale airdrops.

#### 5. Decentralized Lending (`LendingFacet`)
* A simplified lending and borrowing protocol inspired by Aave and Compound.
* **Core Functions**:
    * **Deposit**: Users supply assets as collateral.
    * **Borrow**: Users borrow other assets against the value of their collateral.
    * **Withdraw** & **Repay**.
* **Risk Management**:
    * **Price Oracle**: Integrates a price feed mechanism, compatible with a `MockPriceOracle` for local testing and **Chainlink** price feeds for the Sepolia testnet.
    * **Collateral Factor**: Defines different collateral ratios for different assets.
    * **Health Factor**: Implements the core risk logic to prevent users from withdrawing collateral or borrowing more assets if their position becomes unhealthy.
* **Simplifications**: To focus on the core logic, this Facet does not implement an interest rate model or a liquidation mechanism.

---

## Tech Stack
* **Solidity** (`0.8.6`)
* **Hardhat**: Development, testing, and deployment framework.
* **Ethers.js**: For interacting with the Ethereum blockchain.
* **OpenZeppelin Contracts**: For standard contracts like ERC20 and Ownable.
* **MerkleTree.js**: For generating Merkle Trees off-chain.

---

## Getting Started

1.  **Clone the project**
    ```bash
    git clone <YOUR_REPOSITORY_URL>
    ```
2.  **Enter the directory**
    ```bash
    cd <PROJECT_DIRECTORY>
    ```
3.  **Install dependencies**
    ```bash
    npm install
    ```

---

## Usage

1.  **Compile contracts**
    ```bash
    npx hardhat compile
    ```
2.  **Start a local node**
    ```bash
    npx hardhat node
    ```
3.  **Run deployment and upgrade scripts**
    In a **new terminal**, run the scripts in sequence to deploy and extend your Diamond.
    ```bash
    # Deploy the initial Diamond
    npx hardhat run scripts/deploy.js --network localhost
    
    # Add the StakingFacet
    npx hardhat run scripts/addStakingFacet.js --network localhost

    # Add the AirdropFacets
    npx hardhat run scripts/addAirdropFacets.js --network localhost
    
    # ... run other replace or remove scripts
    ```

---

## License
This project is licensed under the [MIT License](LICENSE).