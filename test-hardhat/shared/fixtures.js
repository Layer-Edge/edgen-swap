const { ethers } = require("hardhat");
const { expandTo18Decimals } = require("./utilities");

// Fixture for deploying the factory
async function factoryFixture() {
  const [wallet] = await ethers.getSigners();
  
  const EdgenSwapFactory = await ethers.getContractFactory("EdgenSwapFactory");
  const factory = await EdgenSwapFactory.deploy(wallet.address);
  await factory.deployed();
  
  return { factory };
}

// Fixture for deploying the factory and a pair
async function pairFixture() {
  const [wallet] = await ethers.getSigners();
  
  // First deploy the factory
  const { factory } = await factoryFixture();
  
  // Deploy test tokens
  const ERC20 = await ethers.getContractFactory("ERC20");
  const tokenA = await ERC20.deploy(expandTo18Decimals(10000));
  await tokenA.deployed();
  
  const tokenB = await ERC20.deploy(expandTo18Decimals(10000));
  await tokenB.deployed();
  
  // Create the pair
  await factory.createPair(tokenA.address, tokenB.address);
  const pairAddress = await factory.getPair(tokenA.address, tokenB.address);
  const pair = await ethers.getContractAt("EdgenSwapPair", pairAddress);
  
  // Determine token0 and token1
  const token0Address = await pair.token0();
  const token0 = tokenA.address === token0Address ? tokenA : tokenB;
  const token1 = tokenA.address === token0Address ? tokenB : tokenA;
  
  return { factory, token0, token1, pair };
}

module.exports = {
  factoryFixture,
  pairFixture
}; 