// Unified deployment script for EdgenSwap contracts on any network
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Check for verification flag
  let shouldVerify = true;
  
  // Get network details
  const networkName = hre.network.name;
  console.log("Starting deployment to", networkName);
  console.log("Verification:", shouldVerify ? "Enabled" : "Disabled");
  
  // Safety checks for mainnet deployments
  if (networkName.includes("mainnet") || networkName === "base") {
    console.warn("WARNING: You're deploying to a MAINNET. REAL FUNDS WILL BE USED.");
    
    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    await new Promise((resolve) => {
      readline.question(`Are you ABSOLUTELY SURE you want to deploy to ${networkName}? (yes/no) `, (answer) => {
        readline.close();
        if (answer.toLowerCase() !== 'yes') {
          console.log('Deployment aborted');
          process.exit(0);
        }
        resolve();
      });
    });
    
    // Check fee setter address is set for mainnet
    if (!process.env.FEE_SETTER_ADDRESS) {
      console.error("ERROR: FEE_SETTER_ADDRESS environment variable is not set");
      console.error("For mainnet deployment, you must explicitly set a fee setter address");
      process.exit(1);
    }
    
    // Double check gas price is reasonable
    const gasPrice = await hre.ethers.provider.getGasPrice();
    const gasPriceGwei = hre.ethers.utils.formatUnits(gasPrice, "gwei");
    console.log(`Current gas price: ${gasPriceGwei} Gwei`);
    
    const gasReadline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    await new Promise((resolve) => {
      gasReadline.question(`Continue with gas price of ${gasPriceGwei} Gwei? (yes/no) `, (answer) => {
        gasReadline.close();
        if (answer.toLowerCase() !== 'yes') {
          console.log('Deployment aborted');
          process.exit(0);
        }
        resolve();
      });
    });
  }
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  // Get fee setter address from env or use deployer as default for non-mainnet
  const feeSetterAddress = process.env.FEE_SETTER_ADDRESS || deployer.address;
  console.log(`Fee setter address: ${feeSetterAddress}`);
  
  // Create deployments directory if it doesn't exist
  const deploymentPath = path.join(__dirname, "../deployments", networkName);
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  // Helper function to save deployment info
  const saveDeployment = (name, address, args) => {
    fs.writeFileSync(
      path.join(deploymentPath, `${name}.json`),
      JSON.stringify({
        address,
        constructorArguments: args,
        timestamp: new Date().toISOString(),
      }, null, 2)
    );
    console.log(`${name} deployment info saved to: ${path.join(deploymentPath, `${name}.json`)}`);
  };
  
  // Helper function for verification with delay and retries
  const verifyContract = async (address, constructorArguments, contractName) => {
    // Skip verification if flag not provided
    if (!shouldVerify) {
      console.log("Skipping verification. Use --verify flag to verify contracts.");
      return;
    }
    
    console.log(`Waiting for contract ${address} to be deployed on the blockchain...`);
    // Wait for 30 seconds to ensure the contract is deployed and indexed
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    let verified = false;
    let retries = 5;
    
    while (!verified && retries > 0) {
      try {
        console.log(`Attempting to verify contract at ${address}`);
        await hre.run("verify:verify", {
          address,
          constructorArguments,
          contract: contractName,
        });
        verified = true;
        console.log(`Contract verified successfully at ${address}`);
      } catch (error) {
        console.log(`Verification attempt failed: ${error.message}`);
        if (error.message.includes("Already Verified")) {
          console.log("Contract already verified");
          verified = true;
        } else {
          retries--;
          if (retries > 0) {
            console.log(`Retrying in 30 seconds... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 30000));
          }
        }
      }
    }
    
    if (!verified) {
      console.log(`Failed to verify contract after multiple attempts. Please verify manually.`);
    }
  };
  
  // Deploy EdgenSwapERC20 first for testing (optional since it's not directly instantiated by users)
  console.log("Deploying EdgenSwapERC20 test instance...");
  const EdgenSwapERC20 = await hre.ethers.getContractFactory("EdgenSwapERC20");
  const erc20 = await EdgenSwapERC20.deploy();
  await erc20.deployed();
  
  console.log(`EdgenSwapERC20 test instance deployed to: ${erc20.address}`);
  
  // Save deployment info
  saveDeployment("EdgenSwapERC20", erc20.address, []);
  
  // Verify EdgenSwapERC20
  await verifyContract(erc20.address, [], "contracts/EdgenSwapERC20.sol:EdgenSwapERC20");
  
  // Deploy the EdgenSwapFactory
  console.log("Deploying EdgenSwapFactory...");
  const EdgenSwapFactory = await hre.ethers.getContractFactory("EdgenSwapFactory");
  const factory = await EdgenSwapFactory.deploy(feeSetterAddress);
  await factory.deployed();
  
  console.log(`EdgenSwapFactory deployed to: ${factory.address}`);
  console.log(`Fee to setter set to: ${feeSetterAddress}`);
  
  // Save deployment info
  saveDeployment("EdgenSwapFactory", factory.address, [feeSetterAddress]);
  
  // Verify EdgenSwapFactory
  await verifyContract(factory.address, [feeSetterAddress], "contracts/EdgenSwapFactory.sol:EdgenSwapFactory");
  
  // Display summary of deployments
  console.log("\n=== Deployment Summary ===");
  console.log(`Network: ${networkName}`);
  console.log(`EdgenSwapERC20 (test): ${erc20.address}`);
  console.log(`EdgenSwapFactory: ${factory.address}`);
  console.log(`Fee Setter: ${feeSetterAddress}`);
  
  // Return deployment addresses
  return {
    erc20: erc20.address,
    factory: factory.address,
    feeSetter: feeSetterAddress
  };
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 