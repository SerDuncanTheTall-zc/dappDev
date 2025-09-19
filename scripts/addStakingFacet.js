/* global ethers */
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function addStakingFacet () {
  // 填入你已部署的 Diamond 地址
  const diamondAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' // 示例地址，请替换
  
  // 为本地测试准备的模拟代币地址
  // 在真实网络上，你需要部署真实的ERC20代币并使用它们的地址
  const [owner] = await ethers.getSigners()
  const stakingTokenAddress = owner.address // 简单起见，我们用owner地址模拟代币地址
  const rewardsTokenAddress = owner.address // 同上

  // 部署 StakingFacet
  const StakingFacet = await ethers.getContractFactory('StakingFacet')
  const stakingFacet = await StakingFacet.deploy()
  await stakingFacet.deployed()
  console.log(`StakingFacet deployed: ${stakingFacet.address}`)

  // 准备 cut 指令
  const cut = [{
    facetAddress: stakingFacet.address,
    action: FacetCutAction.Add,
    functionSelectors: getSelectors(stakingFacet)
  }]

  // 准备初始化函数调用
  // 我们将调用 StakingFacet 上的 initStaking 函数
  const stakingInterface = new ethers.utils.Interface(StakingFacet.interface.format(ethers.utils.FormatTypes.full))
  const functionCall = stakingInterface.encodeFunctionData('initStaking', [
    stakingTokenAddress,
    rewardsTokenAddress,
    ethers.utils.parseUnits('10', 18) // 每秒奖励10个代币 (10 * 10^18)
  ])
  
  // 执行 diamondCut
  console.log('Performing Diamond Cut to add StakingFacet and initialize...')
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress)
  
  const tx = await diamondCut.diamondCut(cut, stakingFacet.address, functionCall)
  console.log('Diamond cut tx: ', tx.hash)
  const receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('✅ Completed Diamond Cut')

  // 验证
  const stakingFacetOnDiamond = await ethers.getContractAt('StakingFacet', diamondAddress)
  const rate = await stakingFacetOnDiamond.rewardsRate()
  console.log(`\n✅ Verification: Rewards Rate is now ${ethers.utils.formatUnits(rate, 18)} tokens/sec`)
}

if (require.main === module) {
  addStakingFacet()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}