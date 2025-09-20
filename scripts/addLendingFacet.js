/* global ethers */
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js');

async function addLendingFacet () {
    const diamondAddress = 'YOUR_SEPOLIA_DIAMOND_ADDRESS'; 
    const [owner] = await ethers.getSigners();


    //    直接定义 Sepolia 网络上真实存在的地址
    console.log('Using real addresses on Sepolia network...');
    
    // Sepolia 上的 WETH 和 DAI 地址 (请从 Etherscan 确认)
    const wethAddress = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'; 
    const daiAddress = '0x68194a729C24503B198AaA4F96D692579b49132e';
    
    // Sepolia 上的 Chainlink 价格源地址
    const ethUsdFeedAddress = '0x694AA1769357215DE4FAC081bf1f309aDC325306';
    const daiUsdFeedAddress = '0x14866185B1962B63C3Ea131897d2e7148AAe5695';

    console.log(`Using WETH at: ${wethAddress}`);
    console.log(`Using DAI at: ${daiAddress}`);
    console.log(`Using ETH/USD feed at: ${ethUsdFeedAddress}`);
    console.log(`Using DAI/USD feed at: ${daiUsdFeedAddress}`);


    // 2. 部署 LendingFacet (这一步不变)
    const LendingFacet = await ethers.getContractFactory('LendingFacet');
    const lendingFacet = await LendingFacet.deploy();
    await lendingFacet.deployed();
    console.log(`LendingFacet deployed: ${lendingFacet.address}`);

    // 3. 执行 DiamondCut (不再需要初始化调用，因为我们会手动设置)
    const cut = [{
        facetAddress: lendingFacet.address,
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(lendingFacet)
    }];
    
    const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress);
    const tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x');
    await tx.wait();
    console.log('✅ Diamond cut complete: LendingFacet added.');

    // 4. 通过 Diamond 地址调用管理功能，配置支持的代币和价格源
    console.log('Configuring supported tokens and price feeds...');
    const lendingFacetOnDiamond = await ethers.getContractAt('LendingFacet', diamondAddress);
    
    // 支持 WETH 并设置其价格源
    await (await lendingFacetOnDiamond.supportToken(wethAddress, 8000)).wait(); // 80% 抵押率
    await (await lendingFacetOnDiamond.setPriceFeed(wethAddress, ethUsdFeedAddress)).wait();
    console.log(`✅ WETH (collateral factor 80%) supported with feed ${ethUsdFeedAddress}`);

    // 支持 DAI 并设置其价格源
    await (await lendingFacetOnDiamond.supportToken(daiAddress, 7500)).wait(); // 75% 抵押率
    await (await lendingFacetOnDiamond.setPriceFeed(daiAddress, daiUsdFeedAddress)).wait();
    console.log(`✅ DAI (collateral factor 75%) supported with feed ${daiUsdFeedAddress}`);

}

if (require.main === module) {
  addLendingFacet().catch(console.error);
}