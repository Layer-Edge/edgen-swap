// We require the Hardhat Runtime Environment explicitly here
const hre = require("hardhat");

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
  
  // Create a signer with private key
  const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
    ? process.env.PRIVATE_KEY 
    : `0x${process.env.PRIVATE_KEY}`;
  const signer = new hre.ethers.Wallet(privateKey, hre.ethers.provider);
  
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