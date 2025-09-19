/* global ethers */
/* eslint prefer-const: "off" */

const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function addMessageFacet () {
  // ***************** IMPORTANT *****************
  // 你需要在这里填入你第一次部署时得到的 Diamond 合约地址
  const diamondAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' 
  // *********************************************

  console.log(`Upgrading Diamond at address: ${diamondAddress}`)

  // 1. 部署新的 Facet 合约
  const MessageFacet = await ethers.getContractFactory('MessageFacet')
  const messageFacet = await MessageFacet.deploy()
  await messageFacet.deployed()
  console.log('MessageFacet deployed:', messageFacet.address)

  // 2. 准备 "cut" 指令
  const cut = [
    {
      facetAddress: messageFacet.address,
      action: FacetCutAction.Add, // Action 是 "Add"
      functionSelectors: getSelectors(messageFacet)
    }
  ]
  console.log('Diamond Cut prepared:', cut)

  // 3. 执行 diamondCut
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress)
  const tx = await diamondCut.diamondCut(
    cut,
    ethers.constants.AddressZero, // _init 地址，这里是 address(0)
    '0x'                        // _calldata，这里是空字节 "0x"
  )
  console.log('Diamond cut tx: ', tx.hash)
  const receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut')

//   // 4. (可选但推荐) 与新添加的函数交互来验证
//   console.log('\nVerifying new functions on diamond...')
  // 使用 MessageFacet 的 ABI，但地址是 Diamond 的地址
  const messageFacetOnDiamond = await ethers.getContractAt('MessageFacet', diamondAddress)

  // 调用 setMessage
  const newMessage = 'Hello Di22222amond!'
  console.log(`Calling setMessage with: "${newMessage}"`)
  const setTx = await messageFacetOnDiamond.setMessage(newMessage)
  await setTx.wait()
  
//   // 调用 getMessage
  const returnedMessage = await messageFacetOnDiamond.getMessage()
  console.log(`getMessage returned: "${returnedMessage}"`)
  
  if (returnedMessage === newMessage) {
    console.log('✅ Verification successful!')
  } else {
    console.log('❌ Verification failed!')
  }
}

if (require.main === module) {
  addMessageFacet()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}