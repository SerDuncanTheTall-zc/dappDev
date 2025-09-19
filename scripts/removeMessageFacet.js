/* global ethers */
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function removeMessageFacet () {
  const diamondAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' // 确保这是你的 Diamond 地址

  console.log(`Removing functions from Diamond at: ${diamondAddress}`)

  // 1. 获取要移除的函数的选择器
  // 我们需要 MessageFacetV2 的 ABI 来知道要移除哪些函数
  const selectorsToRemove = getSelectors(await ethers.getContractFactory('MessageFacetV2'))
  
  // 2. 准备 cut 指令
  const cut = [{
    facetAddress: ethers.constants.AddressZero, // <-- 关键点1：移除时地址设为 0x0
    action: FacetCutAction.Remove,            // <-- 关键点2：使用 Remove
    functionSelectors: selectorsToRemove
  }]

  // 3. 执行 diamondCut
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress)
  const tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x')
  await tx.wait()
  console.log('✅ Diamond cut complete: Message functions removed.')

  // 4. 验证 (修正后的逻辑)
  console.log('\nVerifying removal...')
  const diamondLoupe = await ethers.getContractAt('IDiamondLoupe', diamondAddress)
  
  // 获取 MessageFacetV2 的所有选择器
  const selectors = getSelectors(await ethers.getContractFactory('MessageFacetV2'))
  
  // *** 关键修改：将 'getMessage()' 放入一个数组中 ***
  const getMessageSelector = selectors.get(['getMessage()'])[0]

  // 调用 facetAddress 并检查返回值
  const facetAddr = await diamondLoupe.facetAddress(getMessageSelector)
  
  console.log(`Querying selector for getMessage() (${getMessageSelector}), returned address: ${facetAddr}`)

  // 正确的验证：返回的地址应该变为零地址
  if (facetAddr === ethers.constants.AddressZero) {
    console.log("✅ Verification successful: Function's facet address is now the zero address.")
  } else {
    throw new Error("❌ Verification failed: Function selector still maps to a non-zero address.")
  }

}

if (require.main === module) {
  removeMessageFacet()
    .then(() => process.exit(0))
    .catch(error => { console.error(error); process.exit(1) })
}