/* global ethers */
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function replaceMessageFacet () {
  const diamondAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' // 确保这是你的 Diamond 地址

  console.log(`Upgrading Diamond at: ${diamondAddress}`)
  
  // 1. 部署 V2 版本的 Facet
  const MessageFacetV2 = await ethers.getContractFactory('MessageFacetV2')
  const messageFacetV2 = await MessageFacetV2.deploy()
  await messageFacetV2.deployed()
  console.log(`MessageFacetV2 deployed: ${messageFacetV2.address}`)

  // 2. 准备 cut 指令 (关键修改)
  
  // 定义需要替换和需要新增的函数签名
  const functionsToReplace = [
    'setMessage(string)',
    'getMessage()'
  ]
  const functionsToAdd = [
    'clearMessage()'
  ]
  
  // 从 Facet V2 中分别获取它们的 selectors
  const selectorsToReplace = getSelectors(messageFacetV2).get(functionsToReplace)
  const selectorsToAdd = getSelectors(messageFacetV2).get(functionsToAdd)
  
  // 构建包含两种操作的 cut 数组
  const cut = [
    {
      facetAddress: messageFacetV2.address,
      action: FacetCutAction.Replace, // 对已有函数执行“替换”
      functionSelectors: selectorsToReplace
    },
    {
      facetAddress: messageFacetV2.address,
      action: FacetCutAction.Add,      // 对新函数执行“添加”
      functionSelectors: selectorsToAdd
    }
  ]

  console.log('Prepared Diamond Cut:', JSON.stringify(cut, null, 2))

  // 3. 执行 diamondCut
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress)
  const tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x')
  await tx.wait()
  console.log('✅ Diamond cut complete: MessageFacet replaced and extended.')

  // 4. 验证 (验证逻辑不变)
  console.log('\nVerifying upgrade...')
  const messageFacetOnDiamond = await ethers.getContractAt('MessageFacetV2', diamondAddress)
  
  await (await messageFacetOnDiamond.setMessage('New Message')).wait()
  const msg = await messageFacetOnDiamond.getMessage()
  console.log(`getMessage returned: "${msg}"`)
  if (msg.startsWith('V2:')) {
    console.log('✅ setMessage behavior is V2.')
  } else {
    throw new Error('Upgrade failed: setMessage behavior is not V2.')
  }
  
  await (await messageFacetOnDiamond.clearMessage()).wait()
  const clearedMsg = await messageFacetOnDiamond.getMessage()
  if (clearedMsg === '') {
    console.log('✅ New function clearMessage() works.')
  } else {
    throw new Error('Upgrade failed: clearMessage() did not work.')
  }
}

if (require.main === module) {
  replaceMessageFacet()
    .then(() => process.exit(0))
    .catch(error => { console.error(error); process.exit(1) })
}