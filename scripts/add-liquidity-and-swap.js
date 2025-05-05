// We require the Hardhat Runtime Environment explicitly here
const hre = require("hardhat");

async function main() {
  // Get addresses from environment
  const factoryAddress = process.env.FACTORY_ADDRESS;
  const tokenAAddress = process.env.TOKEN_A_ADDRESS;
  const tokenBAddress = process.env.TOKEN_B_ADDRESS;
  
  if (!factoryAddress || !tokenAAddress || !tokenBAddress) {
    throw new Error("FACTORY_ADDRESS, TOKEN_A_ADDRESS, and TOKEN_B_ADDRESS environment variables must be set.");
  }
  
  console.log(`Using UniswapV2Factory at: ${factoryAddress}`);
  console.log(`Token A: ${tokenAAddress}`);
  console.log(`Token B: ${tokenBAddress}`);
  
  // Get contract instances
  const [signer] = await hre.ethers.getSigners();
  const factory = await hre.ethers.getContractAt("UniswapV2Factory", factoryAddress, signer);
  const tokenA = await hre.ethers.getContractAt("ERC20Mock", tokenAAddress, signer);
  const tokenB = await hre.ethers.getContractAt("ERC20Mock", tokenBAddress, signer);
  
  // Get or create the pair
  let pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
  
  if (pairAddress === hre.ethers.constants.AddressZero) {
    console.log("Creating new pair...");
    const tx = await factory.createPair(tokenAAddress, tokenBAddress);
    await tx.wait();
    pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
  }
  
  console.log(`Using pair at: ${pairAddress}`);
  const pair = await hre.ethers.getContractAt("UniswapV2Pair", pairAddress, signer);
  
  // Check token order
  const token0Address = await pair.token0();
  const token1Address = await pair.token1();
  console.log(`Pair tokens: token0=${token0Address}, token1=${token1Address}`);
  
  // Add liquidity
  const token0 = token0Address === tokenAAddress ? tokenA : tokenB;
  const token1 = token1Address === tokenAAddress ? tokenA : tokenB;
  
  const token0Amount = hre.ethers.utils.parseEther("10");
  const token1Amount = hre.ethers.utils.parseEther("40");
  
  // Transfer tokens to the pair
  console.log(`Transferring ${hre.ethers.utils.formatEther(token0Amount)} ${await token0.symbol()} and ${hre.ethers.utils.formatEther(token1Amount)} ${await token1.symbol()} to the pair...`);
  
  await token0.transfer(pairAddress, token0Amount);
  await token1.transfer(pairAddress, token1Amount);
  
  // Call mint to add liquidity
  console.log("Minting liquidity tokens...");
  const mintTx = await pair.mint(signer.address);
  await mintTx.wait();
  
  // Get liquidity position
  const liquidityBalance = await pair.balanceOf(signer.address);
  console.log(`Liquidity tokens minted: ${hre.ethers.utils.formatEther(liquidityBalance)}`);
  
  // Perform a swap
  const swapAmount = hre.ethers.utils.parseEther("1");
  console.log(`Performing swap with ${hre.ethers.utils.formatEther(swapAmount)} ${await token0.symbol()}...`);
  
  // Transfer tokens to the pair for swapping
  await token0.transfer(pairAddress, swapAmount);
  
  // Calculate expected output amount (simplified calculation)
  const reserves = await pair.getReserves();
  const [reserve0, reserve1] = [reserves[0], reserves[1]];
  
  // Calculate output amount based on constant product formula
  // We need to account for 0.3% fee, so we use 997 instead of 1000
  const outputAmount = reserve1.mul(swapAmount).mul(997).div(reserve0.mul(1000).add(swapAmount.mul(997)));
  
  console.log(`Expected output amount: ${hre.ethers.utils.formatEther(outputAmount)} ${await token1.symbol()}`);
  
  // Perform the swap
  const swapTx = await pair.swap(0, outputAmount, signer.address, "0x");
  await swapTx.wait();
  
  console.log("Swap completed successfully!");
  
  // Check final balances
  const token0Balance = await token0.balanceOf(signer.address);
  const token1Balance = await token1.balanceOf(signer.address);
  
  console.log(`Final balances - ${await token0.symbol()}: ${hre.ethers.utils.formatEther(token0Balance)}, ${await token1.symbol()}: ${hre.ethers.utils.formatEther(token1Balance)}`);
}

// Execute the function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 