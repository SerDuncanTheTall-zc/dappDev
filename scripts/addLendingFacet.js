/* global ethers */
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js');

async function addLendingFacet () {
    const diamondAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'; // 确保这是你的 Diamond 地址
    const [owner] = await ethers.getSigners();

    // =================================================================
    // --- 关键修改区域开始 ---
    // 1. 部署所有基础设施合约
    console.log('Deploying specific mock tokens...');
    
    // 部署 CoinLillard.sol 作为 WETH 的模拟
    const CoinLillard = await ethers.getContractFactory('CoinLillard');
    const weth = await CoinLillard.deploy(); // Lillard 合约构造函数无需参数
    await weth.deployed();

    // 部署 CoinCJMCCO.sol 作为 DAI 的模拟
    const CoinCJMCCO = await ethers.getContractFactory('CoinCJMCCO');
    const dai = await CoinCJMCCO.deploy(); // CJMCCO 合约构造函数无需参数
    await dai.deployed();
    
    // MockPriceOracle 的部署保持不变
    const MockPriceOracle = await ethers.getContractFactory('MockPriceOracle');
    const oracle = await MockPriceOracle.deploy();
    await oracle.deployed();

    console.log(`CoinLillard (as WETH) deployed: ${weth.address}`);
    console.log(`CoinCJMCCO (as DAI) deployed: ${dai.address}`);
    console.log(`MockPriceOracle deployed: ${oracle.address}`);
    // --- 关键修改区域结束 ---
    // =================================================================


    // 2. 在预言机中设置价格 (1 WETH = $2000, 1 DAI = $1)
    await oracle.setPrice(weth.address, 2000 * 10**8); // 价格带 8 位小数
    await oracle.setPrice(dai.address, 1 * 10**8);

    // 3. 部署 LendingFacet
    const LendingFacet = await ethers.getContractFactory('LendingFacet');
    const lendingFacet = await LendingFacet.deploy();
    await lendingFacet.deployed();
    console.log(`LendingFacet deployed: ${lendingFacet.address}`);

    // 4. 准备 cut 指令和初始化
    const cut = [{
        facetAddress: lendingFacet.address,
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(lendingFacet)
    }];
    
    // 假设你在 LendingFacet 中增加了一个 setPriceOracle 的初始化函数
    const lendingInterface = new ethers.utils.Interface(LendingFacet.interface.format(ethers.utils.FormatTypes.full));
    const functionCall = lendingInterface.encodeFunctionData('setPriceOracle', [oracle.address]);
    
    // 5. 执行 DiamondCut
    const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress);
    const tx = await diamondCut.diamondCut(cut, lendingFacet.address, functionCall);
    await tx.wait();
    console.log('✅ Diamond cut complete: LendingFacet added.');

    // 6. 透过 Diamond 地址调用新功能，来支持代币
    console.log('Configuring supported tokens...');
    const lendingFacetOnDiamond = await ethers.getContractAt('LendingFacet', diamondAddress);
    await (await lendingFacetOnDiamond.supportToken(weth.address, 8000)).wait(); // 80% 抵押率
    await (await lendingFacetOnDiamond.supportToken(dai.address, 7500)).wait(); // 75% 抵押率
    console.log('✅ CoinLillard (WETH) and CoinCJMCCO (DAI) are now supported tokens.');
}

if (require.main === module) {
  addLendingFacet().catch(console.error);
}