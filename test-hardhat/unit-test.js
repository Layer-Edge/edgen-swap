const { expect } = require("chai");
const { ethers } = require("hardhat");

describe.skip("UniswapV2", function () {
  let factory;
  let tokenA;
  let tokenB;
  let pair;
  let owner;
  let user;
  
  // Constants for testing
  const MINIMUM_LIQUIDITY = ethers.BigNumber.from(10).pow(3);
  
  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    
    // Deploy the factory
    const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
    factory = await UniswapV2Factory.deploy(owner.address);
    await factory.deployed();
    
    // Deploy test tokens
    const ERC20Mock = await ethers.getContractFactory("ERC20");
    
    tokenA = await ERC20Mock.deploy(ethers.utils.parseEther("10000"));
    await tokenA.deployed();
    
    tokenB = await ERC20Mock.deploy( ethers.utils.parseEther("10000"));
    await tokenB.deployed();
    
    // Create the pair
    await factory.createPair(tokenA.address, tokenB.address);
    const pairAddress = await factory.getPair(tokenA.address, tokenB.address);
    
    // Get the pair contract
    pair = await ethers.getContractAt("UniswapV2Pair", pairAddress);
    
    // Determine token0 and token1
    const token0Address = await pair.token0();
    if (token0Address === tokenA.address) {
      [tokenA, tokenB] = [tokenA, tokenB];
    } else {
      [tokenA, tokenB] = [tokenB, tokenA];
    }
  });
  
  describe("UniswapV2Factory", function () {
    it("Should set the correct feeToSetter", async function () {
      expect(await factory.feeToSetter()).to.equal(owner.address);
    });
    
    it("Should have zero feeTo initially", async function () {
      expect(await factory.feeTo()).to.equal(ethers.constants.AddressZero);
    });
    
    it("Should create pair with correct tokens", async function () {
      const token0 = await pair.token0();
      const token1 = await pair.token1();
      
      // token0 should be the smaller address
      expect(token0.toLowerCase() < token1.toLowerCase()).to.be.true;
      
      // Check that tokens are set correctly
      expect(token0).to.equal(await pair.token0());
      expect(token1).to.equal(await pair.token1());
    });
    
    it("Should revert when creating the same pair again", async function () {
      await expect(factory.createPair(tokenA.address, tokenB.address))
        .to.be.revertedWith("UniswapV2: PAIR_EXISTS");
    });
    
    it("Should revert when creating pair with identical tokens", async function () {
      await expect(factory.createPair(tokenA.address, tokenA.address))
        .to.be.revertedWith("UniswapV2: IDENTICAL_ADDRESSES");
    });
    
    it("Should only allow feeToSetter to change feeTo", async function () {
      await expect(factory.connect(user).setFeeTo(user.address))
        .to.be.revertedWith("UniswapV2: FORBIDDEN");
      
      await factory.setFeeTo(owner.address);
      expect(await factory.feeTo()).to.equal(owner.address);
    });
    
    it("Should only allow feeToSetter to change feeToSetter", async function () {
      await expect(factory.connect(user).setFeeToSetter(user.address))
        .to.be.revertedWith("UniswapV2: FORBIDDEN");
      
      await factory.setFeeToSetter(user.address);
      expect(await factory.feeToSetter()).to.equal(user.address);
      
      // Now the original owner can't change it anymore
      await expect(factory.setFeeToSetter(owner.address))
        .to.be.revertedWith("UniswapV2: FORBIDDEN");
    });
  });
  
  describe("UniswapV2Pair", function () {
    it("Should mint liquidity tokens correctly", async function () {
      const token0Amount = ethers.utils.parseEther("1");
      const token1Amount = ethers.utils.parseEther("4");
      
      await tokenA.transfer(pair.address, token0Amount);
      await tokenB.transfer(pair.address, token1Amount);
      
      // Expected liquidity is sqrt(token0Amount * token1Amount)
      const expectedLiquidity = ethers.utils.parseEther("2"); // sqrt(1 * 4) = 2
      
      await expect(pair.mint(owner.address))
        .to.emit(pair, "Transfer")
        .withArgs(ethers.constants.AddressZero, ethers.constants.AddressZero, MINIMUM_LIQUIDITY)
        .to.emit(pair, "Transfer")
        .withArgs(ethers.constants.AddressZero, owner.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        .to.emit(pair, "Sync")
        .withArgs(token0Amount, token1Amount)
        .to.emit(pair, "Mint")
        .withArgs(owner.address, token0Amount, token1Amount);
      
      expect(await pair.totalSupply()).to.equal(expectedLiquidity);
      expect(await pair.balanceOf(owner.address)).to.equal(expectedLiquidity.sub(MINIMUM_LIQUIDITY));
    });
    
    it("Should swap tokens correctly", async function () {
      // First add liquidity
      const token0Amount = ethers.utils.parseEther("5");
      const token1Amount = ethers.utils.parseEther("10");
      
      await tokenA.transfer(pair.address, token0Amount);
      await tokenB.transfer(pair.address, token1Amount);
      await pair.mint(owner.address);
      
      // Then perform a swap
      const swapAmount = ethers.utils.parseEther("1");
      // Expected output based on x * y = k formula with 0.3% fee
      // (token1Reserve * swapAmount * 0.997) / (token0Reserve + swapAmount * 0.997)
      const expectedOutputAmount = ethers.utils.parseEther("1.662497915624478906");
      
      await tokenA.transfer(pair.address, swapAmount);
      
      await expect(pair.swap(0, expectedOutputAmount, owner.address, "0x"))
        .to.emit(tokenB, "Transfer")
        .withArgs(pair.address, owner.address, expectedOutputAmount)
        .to.emit(pair, "Sync")
        .withArgs(token0Amount.add(swapAmount), token1Amount.sub(expectedOutputAmount))
        .to.emit(pair, "Swap")
        .withArgs(owner.address, swapAmount, 0, 0, expectedOutputAmount, owner.address);
      
      const reserves = await pair.getReserves();
      expect(reserves[0]).to.equal(token0Amount.add(swapAmount));
      expect(reserves[1]).to.equal(token1Amount.sub(expectedOutputAmount));
    });
    
    it("Should burn liquidity tokens correctly", async function () {
      // First add liquidity
      const token0Amount = ethers.utils.parseEther("3");
      const token1Amount = ethers.utils.parseEther("3");
      
      await tokenA.transfer(pair.address, token0Amount);
      await tokenB.transfer(pair.address, token1Amount);
      await pair.mint(owner.address);
      
      const expectedLiquidity = ethers.utils.parseEther("3");
      
      // Transfer LP tokens to the pair for burning
      await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY));
      
      await expect(pair.burn(owner.address))
        .to.emit(pair, "Transfer")
        .withArgs(pair.address, ethers.constants.AddressZero, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
        .to.emit(tokenA, "Transfer")
        .withArgs(pair.address, owner.address, token0Amount.sub(MINIMUM_LIQUIDITY))
        .to.emit(tokenB, "Transfer")
        .withArgs(pair.address, owner.address, token1Amount.sub(MINIMUM_LIQUIDITY))
        .to.emit(pair, "Sync")
        .withArgs(MINIMUM_LIQUIDITY, MINIMUM_LIQUIDITY)
        .to.emit(pair, "Burn")
        .withArgs(owner.address, token0Amount.sub(MINIMUM_LIQUIDITY), token1Amount.sub(MINIMUM_LIQUIDITY), owner.address);
      
      expect(await pair.balanceOf(owner.address)).to.equal(0);
      expect(await pair.totalSupply()).to.equal(MINIMUM_LIQUIDITY);
    });
    
    it("Should collect protocol fees when feeTo is set", async function () {
      // Set feeTo to collect protocol fees
      await factory.setFeeTo(user.address);
      
      // Add initial liquidity
      const token0Amount = ethers.utils.parseEther("1000");
      const token1Amount = ethers.utils.parseEther("1000");
      
      await tokenA.transfer(pair.address, token0Amount);
      await tokenB.transfer(pair.address, token1Amount);
      await pair.mint(owner.address);
      
      // Perform a swap to generate fees
      const swapAmount = ethers.utils.parseEther("1");
      const expectedOutputAmount = ethers.utils.parseEther("0.996006981039903216"); // Calculated based on the formula
      
      await tokenA.transfer(pair.address, swapAmount);
      await pair.swap(0, expectedOutputAmount, owner.address, "0x");
      
      // Remove all liquidity
      const liquidityBalance = await pair.balanceOf(owner.address);
      await pair.transfer(pair.address, liquidityBalance);
      await pair.burn(owner.address);
      
      // Check that protocol fee was collected
      expect(await pair.balanceOf(user.address)).to.be.gt(0);
    });
  });
}); 