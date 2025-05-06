# EdgenSwap Core - Hardhat Testing Environment

This directory contains Hardhat scripts and tests for the EdgenSwap Core contracts.

## Setup

To use the Hardhat environment, you'll need to install the dependencies:

```bash
# Copy the Hardhat package.json file
cp package-hardhat.json package.json
# Install dependencies
yarn install
```

## Compile

Compile the contracts with Hardhat:

```bash
yarn compile
```

## Run Tests

Run the regular unit tests:

```bash
yarn test
```

### Fork Tests

To run fork tests that interact with mainnet contracts, you'll need to:

1. Create a `.env` file with the following variables:
   ```
   MAINNET_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/your-api-key
   PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
   ```

2. Run the fork tests:
   ```bash
   yarn test:fork
   ```

## Local Development

Start a local Hardhat node:

```bash
yarn node
```

## Deployment Scripts

Deploy the EdgenSwapFactory to the local node:

```bash
yarn deploy:local
```

Deploy test tokens:

```bash
# Set FACTORY_ADDRESS environment variable after deployment
export FACTORY_ADDRESS=0x...
yarn hardhat run scripts/deploy-test-tokens.js --network localhost
```

Create a pair between two tokens:

```bash
# Set TOKEN_A_ADDRESS and TOKEN_B_ADDRESS environment variables
export TOKEN_A_ADDRESS=0x...
export TOKEN_B_ADDRESS=0x...
yarn hardhat run scripts/create-pair.js --network localhost
```

Add liquidity and perform a swap:

```bash
yarn hardhat run scripts/add-liquidity-and-swap.js --network localhost
```

## Testing on Different Networks

The provided Hardhat config supports both local testing and mainnet forking for comprehensive testing:

1. Local tests create and use fresh contracts for isolated testing
2. Fork tests interact with existing mainnet contracts to validate compatibility

## Scripts Directory

- `deploy.js`: Deploys the EdgenSwapFactory contract
- `deploy-test-tokens.js`: Deploys test ERC20 tokens for testing
- `create-pair.js`: Creates a pair between two tokens using the factory
- `add-liquidity-and-swap.js`: Adds liquidity to a pair and performs a swap

Note: All original Solidity contracts remain unchanged. Only testing infrastructure has been added. 