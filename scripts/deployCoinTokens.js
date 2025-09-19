/* global ethers */

async function main() {
  // 1. 獲取部署者帳戶
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  const balance = await deployer.getBalance();
  console.log(`Account balance: ${ethers.utils.formatEther(balance)} ETH`);
  console.log("----------------------------------------------------");

  // 2. 部署 CoinCJMCCO 合約
  console.log("Deploying CoinCJMCCO (Mccollum)...");
  const CoinCJMCCO = await ethers.getContractFactory("CoinCJMCCO");
  const coinCJMCCO = await CoinCJMCCO.deploy();
  await coinCJMCCO.deployed();
  console.log(`✅ CoinCJMCCO deployed to: ${coinCJMCCO.address}`);
  
  console.log("----------------------------------------------------");

  // 3. 部署 CoinLillard 合約
  console.log("Deploying CoinLillard...");
  const CoinLillard = await ethers.getContractFactory("CoinLillard");
  const coinLillard = await CoinLillard.deploy();
  await coinLillard.deployed();
  console.log(`✅ CoinLillard deployed to: ${coinLillard.address}`);
  console.log("----------------------------------------------------");
  
  console.log("All mock tokens deployed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });