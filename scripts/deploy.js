// We require the Hardhat Runtime Environment explicitly here
const hre = require("hardhat");

async function main() {
  console.log("Deploying UniswapV2Factory...");
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  // Deploy the UniswapV2Factory
  const UniswapV2Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
  const factory = await UniswapV2Factory.deploy(deployer.address);
  
  await factory.deployed();
  
  console.log(`UniswapV2Factory deployed to: ${factory.address}`);
  console.log(`Fee to setter set to: ${deployer.address}`);
  
  return { factory: factory.address };
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 