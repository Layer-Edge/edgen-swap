# Uniswap V2

[![Actions Status](https://github.com/Uniswap/uniswap-v2-core/workflows/CI/badge.svg)](https://github.com/Uniswap/uniswap-v2-core/actions)
[![Version](https://img.shields.io/npm/v/@uniswap/v2-core)](https://www.npmjs.com/package/@uniswap/v2-core)

In-depth documentation on Uniswap V2 is available at [uniswap.org](https://uniswap.org/docs).

The built contract artifacts can be browsed via [unpkg.com](https://unpkg.com/browse/@uniswap/v2-core@latest/).

# Local Development

The following assumes the use of `node@>=10`.

## Install Dependencies

`yarn`

## Compile Contracts

`yarn compile`

## Run Tests

`yarn test`

# EdgenSwap

A Uniswap V2 fork for the Base network.

## Deployment Instructions

EdgenSwap uses a unified deployment process that works across all networks defined in your `hardhat.config.js`. The deployment script handles network-specific safety checks and provides options for contract verification.

### Prerequisites

1. Create a `.env` file in the project root with the following variables:
   ```
   PRIVATE_KEY=your_wallet_private_key
   BASESCAN_API_KEY=your_basescan_api_key
   BASE_MAINNET_RPC_URL=https://mainnet.base.org
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   FEE_SETTER_ADDRESS=address_for_fee_control (required for mainnet)
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Deployment Commands

The unified deployment script supports the following networks already configured in `hardhat.config.js`:
- Base Sepolia (testnet)
- Base Mainnet

#### Deploy to Base Sepolia (Testnet)

```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

To deploy AND verify contracts:

```bash
npx hardhat run scripts/deploy.js --network baseSepolia --verify
```

#### Deploy to Base Mainnet

For mainnet deployments, you MUST set the `FEE_SETTER_ADDRESS` in your `.env` file:

```bash
npx hardhat run scripts/deploy.js --network baseMainnet
```

To deploy AND verify contracts:

```bash
npx hardhat run scripts/deploy.js --network baseMainnet --verify
```

### Verification Only

If you need to verify previously deployed contracts:

```bash
npx hardhat verify --network baseSepolia CONTRACT_ADDRESS CONSTRUCTOR_ARGS
```

Example:
```bash
npx hardhat verify --network baseSepolia 0xYourFactoryAddress "0xFeeSetter"
```

### Deployment Safety Features

The deployment script includes several safety features:
- Mainnet confirmation prompts to prevent accidental deployments
- Gas price checks before mainnet deployment
- Required fee setter address for mainnet deployments
- Deployment records saved to `deployments/{network}/*.json`
- Verification with retry logic

### Adding New Networks

To add support for additional networks:

1. Add the network configuration to `hardhat.config.js`
2. Add the appropriate API key for verification
3. Use the existing deployment command with your new network name

## Contract Addresses

Deployed contract addresses can be found in the `deployments/{network}/` directory after running the deployment script.
