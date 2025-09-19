/* global ethers */
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function addAirdropFacets () {
  const diamondAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' // 確保這是你的 Diamond 地址
  
  // 為了測試，我們可以部署一個假的 ERC20 代幣合約作為空投代幣
  // 在真實場景中，這裡應該是你的項目代幣地址
  const ERC20Mock = await ethers.getContractFactory('ERC20Mock') // 假設你有一個 ERC20Mock.sol 用於測試
  const airdropToken = await ERC20Mock.deploy("AirdropToken", "ADT", ethers.utils.parseEther('1000000'))
  await airdropToken.deployed()
  console.log(`Airdrop Token (ERC20Mock) deployed at: ${airdropToken.address}`)


  // 1. 部署所有新的 Facets 和 Init 合約
  const AirdropPushFacet = await ethers.getContractFactory('AirdropPushFacet')
  const airdropPushFacet = await AirdropPushFacet.deploy()
  await airdropPushFacet.deployed()
  console.log(`AirdropPushFacet deployed: ${airdropPushFacet.address}`)

  const AirdropPullFacet = await ethers.getContractFactory('AirdropPullFacet')
  const airdropPullFacet = await AirdropPullFacet.deploy()
  await airdropPullFacet.deployed()
  console.log(`AirdropPullFacet deployed: ${airdropPullFacet.address}`)

  const InitAirdrop = await ethers.getContractFactory('InitAirdrop')
  const initAirdrop = await InitAirdrop.deploy()
  await initAirdrop.deployed()
  console.log(`InitAirdrop deployed: ${initAirdrop.address}`)


  // 2. 準備 cut 指令，合併兩個 Facet 的所有函數
  const pushSelectors = getSelectors(airdropPushFacet)
  const pullSelectors = getSelectors(airdropPullFacet)

  const cut = [
    {
      facetAddress: airdropPushFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: pushSelectors
    },
    {
      facetAddress: airdropPullFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: pullSelectors
    }
  ]
  
  // 3. 準備初始化函數調用
  const initInterface = new ethers.utils.Interface(InitAirdrop.interface.format(ethers.utils.FormatTypes.full))
  const functionCall = initInterface.encodeFunctionData('init', [airdropToken.address])

  // 4. 執行 diamondCut
  console.log('Performing Diamond Cut to add Airdrop facets and initialize...')
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress)
  const tx = await diamondCut.diamondCut(cut, initAirdrop.address, functionCall)
  await tx.wait()
  console.log('✅ Diamond cut complete.')
}

if (require.main === module) {
  addAirdropFacets()
    .then(() => process.exit(0))
    .catch(error => { console.error(error); process.exit(1) })
}