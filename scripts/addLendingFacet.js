/* global ethers */
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function addLendingFacet () {
    const diamondAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' // 確保這是你的 Diamond 地址
    const [owner] = await ethers.getSigners()

    // 1. 部署所有基礎設施合約
    console.log('Deploying mocks...')
    const ERC20Mock = await ethers.getContractFactory('ERC20Mock')
    const weth = await ERC20Mock.deploy("Wrapped Ether", "WETH")
    await weth.deployed()
    const dai = await ERC20Mock.deploy("Dai Stablecoin", "DAI")
    await dai.deployed()
    
    const MockPriceOracle = await ethers.getContractFactory('MockPriceOracle')
    const oracle = await MockPriceOracle.deploy(owner.address)
    await oracle.deployed()
    console.log(`Mock WETH deployed: ${weth.address}`)
    console.log(`Mock DAI deployed: ${dai.address}`)
    console.log(`MockPriceOracle deployed: ${oracle.address}`)

    // 2. 在預言機中設置價格 (1 WETH = $2000, 1 DAI = $1)
    await oracle.setPrice(weth.address, 2000 * 10**8) // 價格帶 8 位小數
    await oracle.setPrice(dai.address, 1 * 10**8)

    // 3. 部署 LendingFacet
    const LendingFacet = await ethers.getContractFactory('LendingFacet')
    const lendingFacet = await LendingFacet.deploy()
    await lendingFacet.deployed()
    console.log(`LendingFacet deployed: ${lendingFacet.address}`)

    // 4. 準備 cut 指令和初始化
    const cut = [{
        facetAddress: lendingFacet.address,
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(lendingFacet)
    }]
    // 我們需要在 AppStorage 中設置預言機地址
    // 這裡我們直接在 LendingFacet 中加入一個 initLending 函數來做初始化
    const lendingInterface = new ethers.utils.Interface(LendingFacet.interface.format(ethers.utils.FormatTypes.full))
    const functionCall = lendingInterface.encodeFunctionData('setPriceOracle', [oracle.address])
    
    // 5. 執行 DiamondCut
    const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress)
    const tx = await diamondCut.diamondCut(cut, lendingFacet.address, functionCall)
    await tx.wait()
    console.log('✅ Diamond cut complete: LendingFacet added.')

    // 6. 透過 Diamond 地址調用新功能，來支持代幣
    console.log('Configuring supported tokens...')
    const lendingFacetOnDiamond = await ethers.getContractAt('LendingFacet', diamondAddress)
    await (await lendingFacetOnDiamond.supportToken(weth.address, 8000)).wait() // 80% 抵押率
    await (await lendingFacetOnDiamond.supportToken(dai.address, 7500)).wait() // 75% 抵押率
    console.log('✅ WETH and DAI are now supported tokens.')
}

// 為了讓上面的腳本運行，你需要在 LendingFacet 中增加一個 `setPriceOracle` 函數
// 並在 `LibAppStorage` 中增加 IPriceOracle 接口的定義
// (提示：為簡潔，此處未展示 Init 合約，而是直接在 Facet 中加入了初始化函數)

if (require.main === module) {
  addLendingFacet().catch(console.error)
}