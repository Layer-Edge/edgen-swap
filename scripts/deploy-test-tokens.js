// We require the Hardhat Runtime Environment explicitly here
const hre = require("hardhat");

async function main() {
  console.log("Deploying Test ERC20 Tokens...");
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  
  // Deploy a simple ERC20 token for testing
  const ERC20Mock = await hre.ethers.getContractFactory("ERC20Mock");
  
  // Deploy two tokens with initial supply of 10000 tokens (with 18 decimals)
  const initialSupply = hre.ethers.utils.parseEther("10000");
  
  const tokenA = await ERC20Mock.deploy("Token A", "TKNA", initialSupply);
  await tokenA.deployed();
  
  const tokenB = await ERC20Mock.deploy("Token B", "TKNB", initialSupply);
  await tokenB.deployed();
  
  console.log(`Token A deployed to: ${tokenA.address}`);
  console.log(`Token B deployed to: ${tokenB.address}`);
  
  // Log the commands to set these as environment variables
  console.log("\nTo use these tokens, set the following environment variables:");
  console.log(`export TOKEN_A_ADDRESS=${tokenA.address}`);
  console.log(`export TOKEN_B_ADDRESS=${tokenB.address}`);
  
  return { tokenA: tokenA.address, tokenB: tokenB.address };
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 