// We require the Hardhat Runtime Environment explicitly here
const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
  // Get factory address from command line or environment
  const factoryAddress = process.env.FACTORY_ADDRESS;
  
  if (!factoryAddress) {
    throw new Error("FACTORY_ADDRESS environment variable is not set. Please set it to the address of the deployed EdgenSwapFactory.");
  }
  
  console.log(`Using EdgenSwapFactory at: ${factoryAddress}`);
  
  // Get token addresses from command line or environment
  const tokenAAddress = process.env.TOKEN_A_ADDRESS;
  const tokenBAddress = process.env.TOKEN_B_ADDRESS;
  
  if (!tokenAAddress || !tokenBAddress) {
    throw new Error("TOKEN_A_ADDRESS and TOKEN_B_ADDRESS environment variables must be set.");
  }
  
  console.log(`Creating pair for tokens: ${tokenAAddress} and ${tokenBAddress}`);
  
  // Get the network configuration
  const networkName = hre.network.name;
  console.log(`Network: ${networkName}`);
  
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
  console.log(`Using address: ${signer.address}`);
  
  // Get the factory contract instance
  const factory = await hre.ethers.getContractAt("EdgenSwapFactory", factoryAddress, signer);
  
  // Check if pair already exists
  const existingPair = await factory.getPair(tokenAAddress, tokenBAddress);
  
  if (existingPair !== hre.ethers.constants.AddressZero) {
    console.log(`Pair already exists at: ${existingPair}`);
    return existingPair;
  }
  
  // Create the pair
  console.log("Creating new pair...");
  const tx = await factory.createPair(tokenAAddress, tokenBAddress);
  console.log(`Transaction hash: ${tx.hash}`);
  console.log("Waiting for transaction confirmation...");
  await tx.wait();
  
  // Get the new pair address
  const pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
  console.log(`Pair created at: ${pairAddress}`);
  
  return pairAddress;
}

// Execute the function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 