const { expect } = require("chai");
const { ethers } = require("hardhat");
const { pairFixture } = require("./shared/fixtures");
const { expandTo18Decimals, mineBlock, encodePrice } = require("./shared/utilities");

describe("UniswapV2Pair", function () {
  // Constants
  const MINIMUM_LIQUIDITY = ethers.BigNumber.from(10).pow(3);
  const overrides = { gasLimit: 9999999 };

  // Test accounts and contracts
  let factory;
  let token0;
  let token1;
  let pair;
  let wallet;
  let other;

  async function addLiquidity(token0Amount, token1Amount) {
    await token0.transfer(pair.address, token0Amount);
    await token1.transfer(pair.address, token1Amount);
    await pair.mint(wallet.address, overrides);
  }

  beforeEach(async function () {
    [wallet, other] = await ethers.getSigners();
    

    // Load the fixture
    const fixture = await pairFixture();
    factory = fixture.factory;
    token0 = fixture.token0;
    token1 = fixture.token1;
    pair = fixture.pair;
  });

  it("mint", async function () {
    const token0Amount = expandTo18Decimals(1);
    const token1Amount = expandTo18Decimals(4);
    await token0.transfer(pair.address, token0Amount);
    await token1.transfer(pair.address, token1Amount);

    const expectedLiquidity = expandTo18Decimals(2);
    await expect(pair.mint(wallet.address, overrides))
      .to.emit(pair, "Transfer")
      .withArgs(ethers.constants.AddressZero, ethers.constants.AddressZero, MINIMUM_LIQUIDITY)
      .to.emit(pair, "Transfer")
      .withArgs(ethers.constants.AddressZero, wallet.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
      .to.emit(pair, "Sync")
      .withArgs(token0Amount, token1Amount)
      .to.emit(pair, "Mint")
      .withArgs(wallet.address, token0Amount, token1Amount);

    expect(await pair.totalSupply()).to.eq(expectedLiquidity);
    expect(await pair.balanceOf(wallet.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY));
    expect(await token0.balanceOf(pair.address)).to.eq(token0Amount);
    expect(await token1.balanceOf(pair.address)).to.eq(token1Amount);
    const reserves = await pair.getReserves();
    expect(reserves[0]).to.eq(token0Amount);
    expect(reserves[1]).to.eq(token1Amount);
  });

  const swapTestCases = [
    [1, 5, 10, "1662497915624478906"],
    [1, 10, 5, "453305446940074565"],
    [2, 5, 10, "2851015155847869602"],
    [2, 10, 5, "831248957812239453"],
    [1, 10, 10, "906610893880149131"],
    [1, 100, 100, "987158034397061298"],
    [1, 1000, 1000, "996006981039903216"]
  ].map(a => a.map(n => (typeof n === "string" ? ethers.BigNumber.from(n) : expandTo18Decimals(n))));

  swapTestCases.forEach((swapTestCase, i) => {
    it(`getInputPrice:${i}`, async function () {
      const [swapAmount, token0Amount, token1Amount, expectedOutputAmount] = swapTestCase;
      await addLiquidity(token0Amount, token1Amount);
      await token0.transfer(pair.address, swapAmount);
      await expect(pair.swap(0, expectedOutputAmount.add(1), wallet.address, "0x", overrides))
        .to.be.revertedWith("UniswapV2: K");
      await pair.swap(0, expectedOutputAmount, wallet.address, "0x", overrides);
    });
  });

  it("swap:token0", async function () {
    const token0Amount = expandTo18Decimals(5);
    const token1Amount = expandTo18Decimals(10);
    await addLiquidity(token0Amount, token1Amount);

    const swapAmount = expandTo18Decimals(1);
    const expectedOutputAmount = ethers.BigNumber.from("1662497915624478906");
    await token0.transfer(pair.address, swapAmount);
    await expect(pair.swap(0, expectedOutputAmount, wallet.address, "0x", overrides))
      .to.emit(token1, "Transfer")
      .withArgs(pair.address, wallet.address, expectedOutputAmount)
      .to.emit(pair, "Sync")
      .withArgs(token0Amount.add(swapAmount), token1Amount.sub(expectedOutputAmount))
      .to.emit(pair, "Swap")
      .withArgs(wallet.address, swapAmount, 0, 0, expectedOutputAmount, wallet.address);

    const reserves = await pair.getReserves();
    expect(reserves[0]).to.eq(token0Amount.add(swapAmount));
    expect(reserves[1]).to.eq(token1Amount.sub(expectedOutputAmount));
    expect(await token0.balanceOf(pair.address)).to.eq(token0Amount.add(swapAmount));
    expect(await token1.balanceOf(pair.address)).to.eq(token1Amount.sub(expectedOutputAmount));
    const totalSupplyToken0 = await token0.totalSupply();
    const totalSupplyToken1 = await token1.totalSupply();
    expect(await token0.balanceOf(wallet.address)).to.eq(totalSupplyToken0.sub(token0Amount).sub(swapAmount));
    expect(await token1.balanceOf(wallet.address)).to.eq(totalSupplyToken1.sub(token1Amount).add(expectedOutputAmount));
  });

  it("swap:token1", async function () {
    const token0Amount = expandTo18Decimals(5);
    const token1Amount = expandTo18Decimals(10);
    await addLiquidity(token0Amount, token1Amount);

    const swapAmount = expandTo18Decimals(1);
    const expectedOutputAmount = ethers.BigNumber.from("453305446940074565");
    await token1.transfer(pair.address, swapAmount);
    await expect(pair.swap(expectedOutputAmount, 0, wallet.address, "0x", overrides))
      .to.emit(token0, "Transfer")
      .withArgs(pair.address, wallet.address, expectedOutputAmount)
      .to.emit(pair, "Sync")
      .withArgs(token0Amount.sub(expectedOutputAmount), token1Amount.add(swapAmount))
      .to.emit(pair, "Swap")
      .withArgs(wallet.address, 0, swapAmount, expectedOutputAmount, 0, wallet.address);

    const reserves = await pair.getReserves();
    expect(reserves[0]).to.eq(token0Amount.sub(expectedOutputAmount));
    expect(reserves[1]).to.eq(token1Amount.add(swapAmount));
    expect(await token0.balanceOf(pair.address)).to.eq(token0Amount.sub(expectedOutputAmount));
    expect(await token1.balanceOf(pair.address)).to.eq(token1Amount.add(swapAmount));
    const totalSupplyToken0 = await token0.totalSupply();
    const totalSupplyToken1 = await token1.totalSupply();
    expect(await token0.balanceOf(wallet.address)).to.eq(totalSupplyToken0.sub(token0Amount).add(expectedOutputAmount));
    expect(await token1.balanceOf(wallet.address)).to.eq(totalSupplyToken1.sub(token1Amount).sub(swapAmount));
  });

  it("swap:gas", async function () {
    const token0Amount = expandTo18Decimals(5);
    const token1Amount = expandTo18Decimals(10);
    await addLiquidity(token0Amount, token1Amount);

    // ensure that setting price{0,1}CumulativeLast for the first time doesn't affect our gas math
    const blockTimestamp = (await pair.getReserves())[2];
    await mineBlock(blockTimestamp + 1);
    await pair.sync(overrides);

    const swapAmount = expandTo18Decimals(1);
    const expectedOutputAmount = ethers.BigNumber.from("453305446940074565");
    await token1.transfer(pair.address, swapAmount);
    await mineBlock(blockTimestamp + 10);
    const tx = await pair.swap(expectedOutputAmount, 0, wallet.address, "0x", overrides);
    const receipt = await tx.wait();
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
  });

  it("burn", async function () {
    const token0Amount = expandTo18Decimals(3);
    const token1Amount = expandTo18Decimals(3);
    await addLiquidity(token0Amount, token1Amount);

    const expectedLiquidity = expandTo18Decimals(3);
    await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY));
    await expect(pair.burn(wallet.address, overrides))
      .to.emit(pair, "Transfer")
      .withArgs(pair.address, ethers.constants.AddressZero, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
      .to.emit(token0, "Transfer")
      .withArgs(pair.address, wallet.address, token0Amount.sub(MINIMUM_LIQUIDITY))
      .to.emit(token1, "Transfer")
      .withArgs(pair.address, wallet.address, token1Amount.sub(MINIMUM_LIQUIDITY))
      .to.emit(pair, "Sync")
      .withArgs(MINIMUM_LIQUIDITY, MINIMUM_LIQUIDITY)
      .to.emit(pair, "Burn")
      .withArgs(wallet.address, token0Amount.sub(MINIMUM_LIQUIDITY), token1Amount.sub(MINIMUM_LIQUIDITY), wallet.address);

    expect(await pair.balanceOf(wallet.address)).to.eq(0);
    expect(await pair.totalSupply()).to.eq(MINIMUM_LIQUIDITY);
    expect(await token0.balanceOf(pair.address)).to.eq(MINIMUM_LIQUIDITY);
    expect(await token1.balanceOf(pair.address)).to.eq(MINIMUM_LIQUIDITY);
    const totalSupplyToken0 = await token0.totalSupply();
    const totalSupplyToken1 = await token1.totalSupply();
    expect(await token0.balanceOf(wallet.address)).to.eq(totalSupplyToken0.sub(MINIMUM_LIQUIDITY));
    expect(await token1.balanceOf(wallet.address)).to.eq(totalSupplyToken1.sub(MINIMUM_LIQUIDITY));
  });

  it("price{0,1}CumulativeLast", async function () {
    const token0Amount = expandTo18Decimals(3);
    const token1Amount = expandTo18Decimals(3);
    await addLiquidity(token0Amount, token1Amount);

    // Get the initial block timestamp and mine a new block with timestamp+1
    const blockTimestamp = (await pair.getReserves())[2];
    await pair.sync(overrides);

    console.log('block timestamp after sync', (await pair.getReserves())[2])

    // Calculate expected initial price and verify
    const initialPrice = encodePrice(token0Amount, token1Amount);
    
    // Verify initial price
    expect(await pair.price0CumulativeLast()).to.eq(initialPrice[0]);
    expect(await pair.price1CumulativeLast()).to.eq(initialPrice[1]);
    expect((await pair.getReserves())[2]).to.eq(blockTimestamp + 1);

    // Add tokens to change the price
    const swapAmount = expandTo18Decimals(3);
    await token0.transfer(pair.address, swapAmount);
    
    // Mine a block 10 seconds later
    await mineBlock(blockTimestamp + 9);
    
    // Swap to a new price eagerly instead of syncing
    await pair.swap(0, expandTo18Decimals(1), wallet.address, "0x", overrides);
  
    // Verify price accumulation for 10 seconds
    expect(await pair.price0CumulativeLast()).to.eq(initialPrice[0].mul(10));
    expect(await pair.price1CumulativeLast()).to.eq(initialPrice[1].mul(10));
    expect((await pair.getReserves())[2]).to.eq(blockTimestamp + 10);

    // Mine a block 20 seconds after the initial block
    await mineBlock(blockTimestamp + 19);
    await pair.sync(overrides);

    // New price after adding tokens and swapping
    const reserve0 = expandTo18Decimals(6); // 3 initial + 3 added
    const reserve1 = expandTo18Decimals(2); // 3 initial - 1 swapped out
    const newPrice = encodePrice(reserve0, reserve1);
    
    // Price should accumulate for 10 more seconds at the new rate
    expect(await pair.price0CumulativeLast()).to.eq(initialPrice[0].mul(10).add(newPrice[0].mul(10)));
    expect(await pair.price1CumulativeLast()).to.eq(initialPrice[1].mul(10).add(newPrice[1].mul(10)));
    expect((await pair.getReserves())[2]).to.eq(blockTimestamp + 20);
  });

  it("feeTo:off", async function () {
    const token0Amount = expandTo18Decimals(1000);
    const token1Amount = expandTo18Decimals(1000);
    await addLiquidity(token0Amount, token1Amount);

    const swapAmount = expandTo18Decimals(1);
    const expectedOutputAmount = ethers.BigNumber.from("996006981039903216");
    await token1.transfer(pair.address, swapAmount);
    await pair.swap(expectedOutputAmount, 0, wallet.address, "0x", overrides);

    const expectedLiquidity = expandTo18Decimals(1000);
    await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY));
    await pair.burn(wallet.address, overrides);
    expect(await pair.totalSupply()).to.eq(MINIMUM_LIQUIDITY);
  });

  it("feeTo:on", async function () {
    await factory.setFeeTo(other.address);

    const token0Amount = expandTo18Decimals(1000);
    const token1Amount = expandTo18Decimals(1000);
    await addLiquidity(token0Amount, token1Amount);

    const swapAmount = expandTo18Decimals(1);
    const expectedOutputAmount = ethers.BigNumber.from("996006981039903216");
    await token1.transfer(pair.address, swapAmount);
    await pair.swap(expectedOutputAmount, 0, wallet.address, "0x", overrides);

    const expectedLiquidity = expandTo18Decimals(1000);
    await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY));
    await pair.burn(wallet.address, overrides);
    expect(await pair.totalSupply()).to.eq(MINIMUM_LIQUIDITY.add("249750499251388"));
    expect(await pair.balanceOf(other.address)).to.eq("249750499251388");

    // using 1000 here instead of the symbolic MINIMUM_LIQUIDITY because the amounts only happen to be equal...
    // ...because the initial liquidity amounts were equal
    expect(await token0.balanceOf(pair.address)).to.eq(ethers.BigNumber.from(1000).add("249501683697445"));
    expect(await token1.balanceOf(pair.address)).to.eq(ethers.BigNumber.from(1000).add("250000187312969"));
  });
}); 