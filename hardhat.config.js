require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();


// Load environment variables with fallbacks
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "https://eth-mainnet.alchemyapi.io/v2/your-api-key";
const BASE_MAINNET_RPC_URL = process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org";
const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.5.16",
    settings: {
      optimizer: {
        enabled: true,
        runs: 999999
      },
      evmVersion: "istanbul"
    }
  },
  networks: {
    // Local development networks
    hardhat: {
      forking: {
        url: MAINNET_RPC_URL,
        blockNumber: 14390000, // Use a specific mainnet block for consistent testing
        enabled: process.env.FORK === "true"
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // Base Networks - Production and Testing
    baseSepolia: {
      url: BASE_SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 84532,
      gasPrice: 'auto',
      verify: {
        etherscan: {
          apiKey: process.env.BASESCAN_API_KEY
        }
      }
    },
    baseMainnet: {
      url: BASE_MAINNET_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 8453,
      gasPrice: 'auto',
      verify: {
        etherscan: {
          apiKey: process.env.BASESCAN_API_KEY
        }
      }
    }
    // To add additional networks, copy the pattern above and adjust parameters
    // Then use the network name in the command: npx hardhat run scripts/deploy.js --network newNetworkName
  },
  // Verification settings for all networks
  etherscan: {
    apiKey: {
      // Base Mainnet and Base Sepolia
      base: process.env.BASESCAN_API_KEY,
      baseSepolia: process.env.BASESCAN_API_KEY
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test-hardhat",
    cache: "./cache-hardhat",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 60000
  }
}; 