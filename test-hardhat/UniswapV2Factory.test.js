const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UniswapV2Factory", function () {
  let factory;
  let wallet;
  let other;
  let tokens;
  
  // Helper function - Fixed to handle bytecode properly
  function getCreate2Address(factoryAddress, tokens, bytecode) {
    const [token0, token1] = tokens[0].toLowerCase() < tokens[1].toLowerCase() 
      ? [tokens[0], tokens[1]] 
      : [tokens[1], tokens[0]];
      
    const salt = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["address", "address"],
        [token0, token1]
      )
    );
    
    // This is the proper way to calculate CREATE2 address in ethers v5
    return ethers.utils.getCreate2Address(
      factoryAddress,
      salt,
      ethers.utils.keccak256(bytecode)
    );
  }
  
  beforeEach(async function () {
    [wallet, other] = await ethers.getSigners();
    
    // Deploy the factory
    const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
    factory = await UniswapV2Factory.deploy(wallet.address);
    await factory.deployed();
    
    // Generate test addresses
    tokens = [
      "0x1000000000000000000000000000000000000000",
      "0x2000000000000000000000000000000000000000"
    ];
  });
  
  it("feeTo, feeToSetter, allPairsLength", async function () {
    expect(await factory.feeTo()).to.eq(ethers.constants.AddressZero);
    expect(await factory.feeToSetter()).to.eq(wallet.address);
    expect(await factory.allPairsLength()).to.eq(0);
  });
  
  async function createPair(tokens) {
    // Get pair creation bytecode for CREATE2 address calculation
    const UniswapV2Pair = await ethers.getContractFactory("UniswapV2Pair");
    // Make sure we're using the proper bytecode format
    const bytecode = UniswapV2Pair.bytecode;
    const create2Address = getCreate2Address(factory.address, tokens, bytecode);
    
    // Create the pair and check events
    await expect(factory.createPair(tokens[0], tokens[1]))
      .to.emit(factory, "PairCreated")
      .withArgs(
        tokens[0].toLowerCase() < tokens[1].toLowerCase() ? tokens[0] : tokens[1],
        tokens[0].toLowerCase() < tokens[1].toLowerCase() ? tokens[1] : tokens[0],
        create2Address,
        1
      );
    
    // Test reverse order and duplicates
    await expect(factory.createPair(tokens[0], tokens[1])).to.be.reverted; // UniswapV2: PAIR_EXISTS
    await expect(factory.createPair(tokens[1], tokens[0])).to.be.reverted; // UniswapV2: PAIR_EXISTS
    
    // Check getPair and allPairs functionality
    expect(await factory.getPair(tokens[0], tokens[1])).to.eq(create2Address);
    expect(await factory.getPair(tokens[1], tokens[0])).to.eq(create2Address);
    expect(await factory.allPairs(0)).to.eq(create2Address);
    expect(await factory.allPairsLength()).to.eq(1);
    
    // Get the pair contract and check its properties
    const pair = await ethers.getContractAt("UniswapV2Pair", create2Address);
    expect(await pair.factory()).to.eq(factory.address);
    expect(await pair.token0()).to.eq(tokens[0].toLowerCase() < tokens[1].toLowerCase() ? tokens[0] : tokens[1]);
    expect(await pair.token1()).to.eq(tokens[0].toLowerCase() < tokens[1].toLowerCase() ? tokens[1] : tokens[0]);
  }
  
  it("createPair", async function () {
    await createPair(tokens);
  });
  
  it("createPair:reverse", async function () {
    await createPair(tokens.slice().reverse());
  });
  
  it("createPair:gas", async function () {
    const tx = await factory.createPair(tokens[0], tokens[1]);
    const receipt = await tx.wait();
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
  });
  
  it("setFeeTo", async function () {
    await expect(factory.connect(other).setFeeTo(other.address))
      .to.be.revertedWith("UniswapV2: FORBIDDEN");
      
    await factory.setFeeTo(wallet.address);
    expect(await factory.feeTo()).to.eq(wallet.address);
  });
  
  it("setFeeToSetter", async function () {
    await expect(factory.connect(other).setFeeToSetter(other.address))
      .to.be.revertedWith("UniswapV2: FORBIDDEN");
      
    await factory.setFeeToSetter(other.address);
    expect(await factory.feeToSetter()).to.eq(other.address);
    
    await expect(factory.setFeeToSetter(wallet.address))
      .to.be.revertedWith("UniswapV2: FORBIDDEN");
  });
}); 