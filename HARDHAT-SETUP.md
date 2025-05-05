# UniswapV2 Hardhat Testing Environment - Setup Summary

This document summarizes the Hardhat setup created for testing the UniswapV2 contracts.

## Files Created

### Configuration Files

- **hardhat.config.js**: Main Hardhat configuration with network settings for local and fork testing
- **package-hardhat.json**: Package dependencies for Hardhat with ethers 5.7
- **.env.example**: (BLOCKED BY GIT IGNORE) Template for environment variables

### Contract Files

- **contracts/test/ERC20Mock.sol**: Test ERC20 token implementation for testing

### Deployment Scripts

- **scripts/deploy.js**: Deploys the UniswapV2Factory contract
- **scripts/create-pair.js**: Creates a trading pair between two tokens
- **scripts/deploy-test-tokens.js**: Deploys test ERC20 tokens for testing pairs
- **scripts/add-liquidity-and-swap.js**: Adds liquidity to a pair and performs swaps

### Test Files

- **test-hardhat/unit-test.js**: Regular unit tests for UniswapV2 contracts
- **test-hardhat/fork-test.js**: Fork tests that interact with mainnet contracts

### Documentation

- **HARDHAT-README.md**: Instructions for using the Hardhat environment

## Environment Variables

The following environment variables are used in the scripts:

```
# Required for mainnet forking
MAINNET_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/your-api-key

# Optional for testing with accounts
PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000

# Contract addresses (after deployment)
FACTORY_ADDRESS=
TOKEN_A_ADDRESS=
TOKEN_B_ADDRESS=

# Enable forking in tests
FORK=true
```

## Installation

To use this setup:

```bash
# Copy the Hardhat package.json file
cp package-hardhat.json package.json

# Install dependencies
yarn install
```

## Available Commands

- `yarn compile`: Compile the contracts
- `yarn test`: Run the unit tests
- `yarn test:fork`: Run tests on a mainnet fork
- `yarn node`: Start a local Hardhat node
- `yarn deploy:local`: Deploy to the local node

## Features Implemented

1. **Local Testing**: Unit tests for all contracts covering:
   - Factory deployment and configuration
   - Pair creation
   - Liquidity provision and removal
   - Token swaps
   - Protocol fee collection

2. **Fork Testing**:
   - Interacting with real mainnet contracts
   - Impersonating accounts with token balances
   - Comparing our implementation with the real Uniswap V2

3. **Deployment Scripts**:
   - Factory deployment
   - Pair creation
   - Adding liquidity
   - Performing swaps

All this has been implemented without modifying any of the original Solidity contracts. 