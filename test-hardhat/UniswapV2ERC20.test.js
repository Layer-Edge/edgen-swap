const { expect } = require("chai");
const { ethers } = require("hardhat");
const { getSignatureFromDigest } = require("./shared/utilities");

describe("UniswapV2ERC20", function () {
  const TOTAL_SUPPLY = ethers.utils.parseEther("10000");
  const TEST_AMOUNT = ethers.utils.parseEther("10");
  
  let token;
  let wallet;
  let other;
  
  beforeEach(async function () {
    [wallet, other] = await ethers.getSigners();
    
    // Deploy the ERC20 implementation (Use ERC20 contract from the core repo directly)
    const ERC20 = await ethers.getContractFactory("ERC20");
    token = await ERC20.deploy(TOTAL_SUPPLY);
    await token.deployed();
  });
  
  it("name, symbol, decimals, totalSupply, balanceOf, DOMAIN_SEPARATOR, PERMIT_TYPEHASH", async function () {
    const name = await token.name();
    expect(name).to.eq("Uniswap V2");
    expect(await token.symbol()).to.eq("UNI-V2");
    expect(await token.decimals()).to.eq(18);
    expect(await token.totalSupply()).to.eq(TOTAL_SUPPLY);
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY);
    
    // Get chain ID properly
    const chainId = (await ethers.provider.getNetwork()).chainId;
    
    // Domain separator is a hash of domain data
    const domainSeparator = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "bytes32", "bytes32", "uint256", "address"],
        [
          ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
          ),
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name)),
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")),
          chainId,
          token.address
        ]
      )
    );
    expect(await token.DOMAIN_SEPARATOR()).to.eq(domainSeparator);
    
    const PERMIT_TYPEHASH = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)")
    );
    expect(await token.PERMIT_TYPEHASH()).to.eq(PERMIT_TYPEHASH);
  });
  
  it("approve", async function () {
    await expect(token.approve(other.address, TEST_AMOUNT))
      .to.emit(token, "Approval")
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
      
    expect(await token.allowance(wallet.address, other.address)).to.eq(TEST_AMOUNT);
  });
  
  it("transfer", async function () {
    await expect(token.transfer(other.address, TEST_AMOUNT))
      .to.emit(token, "Transfer")
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
      
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT));
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT);
  });
  
  it("transfer:fail", async function () {
    await expect(token.transfer(other.address, TOTAL_SUPPLY.add(1)))
      .to.be.reverted; // ds-math-sub-underflow
      
    await expect(token.connect(other).transfer(wallet.address, 1))
      .to.be.reverted; // ds-math-sub-underflow
  });
  
  it("transferFrom", async function () {
    await token.approve(other.address, TEST_AMOUNT);
    
    await expect(token.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT))
      .to.emit(token, "Transfer")
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
      
    expect(await token.allowance(wallet.address, other.address)).to.eq(0);
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT));
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT);
  });
  
  it("transferFrom:max", async function () {
    await token.approve(other.address, ethers.constants.MaxUint256);
    
    await expect(token.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT))
      .to.emit(token, "Transfer")
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
      
    expect(await token.allowance(wallet.address, other.address)).to.eq(ethers.constants.MaxUint256);
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT));
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT);
  });
  
  it("permit", async function () {
    const nonce = await token.nonces(wallet.address);
    const deadline = ethers.constants.MaxUint256;
    const chainId = (await ethers.provider.getNetwork()).chainId;
    
    // Create the approval digest
    const name = await token.name();
    const DOMAIN_SEPARATOR = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "bytes32", "bytes32", "uint256", "address"],
        [
          ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
          ),
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name)),
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1")),
          chainId,
          token.address
        ]
      )
    );
    
    const PERMIT_TYPEHASH = await token.PERMIT_TYPEHASH();
    
    const digest = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ["bytes1", "bytes1", "bytes32", "bytes32"],
        [
          "0x19",
          "0x01",
          DOMAIN_SEPARATOR,
          ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              ["bytes32", "address", "address", "uint256", "uint256", "uint256"],
              [PERMIT_TYPEHASH, wallet.address, other.address, TEST_AMOUNT, nonce, deadline]
            )
          )
        ]
      )
    );
    
    // Sign the digest
    const { v, r, s } = await getSignatureFromDigest(digest, wallet);
    
    await expect(token.permit(wallet.address, other.address, TEST_AMOUNT, deadline, v, r, s))
      .to.emit(token, "Approval")
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
      
    expect(await token.allowance(wallet.address, other.address)).to.eq(TEST_AMOUNT);
    expect(await token.nonces(wallet.address)).to.eq(1);
  });
}); 