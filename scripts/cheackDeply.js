// scripts/checkDeployer.js
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("脚本将使用以下地址进行部署和交易：");
  console.log("Deployer Address:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });