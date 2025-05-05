# UniswapV2 Hardhat Tests

This directory contains unit tests for the Uniswap V2 Core contracts using Hardhat and ethers.js v5.7.

## Directory Structure

- `UniswapV2Factory.test.js`: Tests for the factory contract
- `UniswapV2Pair.test.js`: Tests for the pair contract
- `UniswapV2ERC20.test.js`: Tests for the ERC20 implementation
- `shared/`: Helper utilities and fixtures
  - `utilities.js`: Common utility functions
  - `fixtures.js`: Test fixtures for deploying contracts

## Running the Tests

To run the tests, first make sure you have installed the dependencies from the `package-hardhat.json` file:

```bash
# Copy the Hardhat package.json
cp package-hardhat.json package.json

# Install dependencies
npm install
```

Then run the tests with:

```bash
# Run all tests
npx hardhat test test-hardhat/*.test.js

# Run a specific test
npx hardhat test test-hardhat/UniswapV2Pair.test.js
```

## Test Coverage

The tests cover all core functionality of the Uniswap V2 contracts:

1. **Factory**:
   - Pair creation
   - Fee setting
   - Access control

2. **Pair**:
   - Adding liquidity (mint)
   - Removing liquidity (burn)
   - Swapping tokens
   - Price calculations
   - Protocol fee collection

3. **ERC20**:
   - Basic token functions
   - Permit functionality
   - Domain separator and EIP-712

These tests have been migrated from the original Waffle tests to use Hardhat and ethers.js v5.7. 