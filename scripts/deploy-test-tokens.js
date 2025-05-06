// We require the Hardhat Runtime Environment explicitly here
const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
  console.log("Deploying Test ERC20 Tokens...");
  
  // Get the network configuration
  const networkName = hre.network.name;
  console.log(`Deploying to network: ${networkName}`);
  
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;
  
  // Create provider instance from RPC URL
  const provider = rpcUrl 
    ? new ethers.providers.JsonRpcProvider(rpcUrl)
    : hre.ethers.provider; // Fall back to hardhat provider
  
  // Set up the wallet with private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY environment variable is not set");
  }
  
  // Create a signer with private key
  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const signer = new ethers.Wallet(formattedKey, provider);
  console.log(`Deployer address: ${signer.address}`);
  
  // Deploy a simple ERC20 token for testing
  const ERC20Mock = await hre.ethers.getContractFactory("MockERC20", signer);
  
  // Deploy two tokens with initial supply of 10000 tokens (with 18 decimals)
  const initialSupply = hre.ethers.utils.parseEther("10000");
  
  // Deploy tokens
  console.log("Deploying Token A...");
  const tokenA = await ERC20Mock.deploy("Token A", "TKNA", initialSupply);
  await tokenA.deployed();
  
  console.log("Deploying Token B...");
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