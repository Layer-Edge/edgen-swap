// Verification script for EdgenSwap contracts
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const networkName = hre.network.name;
  console.log(`Verifying contracts on ${networkName}...`);
  
  // Check if we have deployment records
  const deploymentPath = path.join(__dirname, "../deployments", networkName);
  
  // Get contract addresses and constructor args from command line or from deployment files
  let erc20Address, factoryAddress, feeSetterAddress;
  
  // Try to get addresses from command line
  for (const arg of process.argv) {
    if (arg.startsWith("--erc20=")) {
      erc20Address = arg.split("=")[1];
    }
    if (arg.startsWith("--factory=")) {
      factoryAddress = arg.split("=")[1];
    }
    if (arg.startsWith("--feeSetter=")) {
      feeSetterAddress = arg.split("=")[1];
    }
  }
  
  // If not provided in command line, try to get from deployment files
  if (fs.existsSync(deploymentPath)) {
    if (!erc20Address && fs.existsSync(path.join(deploymentPath, "EdgenSwapERC20.json"))) {
      const erc20Data = JSON.parse(fs.readFileSync(path.join(deploymentPath, "EdgenSwapERC20.json"), "utf8"));
      erc20Address = erc20Data.address;
      console.log(`Found EdgenSwapERC20 address from deployment: ${erc20Address}`);
    }
    
    if (!factoryAddress && fs.existsSync(path.join(deploymentPath, "EdgenSwapFactory.json"))) {
      const factoryData = JSON.parse(fs.readFileSync(path.join(deploymentPath, "EdgenSwapFactory.json"), "utf8"));
      factoryAddress = factoryData.address;
      feeSetterAddress = factoryData.constructorArguments[0];
      console.log(`Found EdgenSwapFactory address from deployment: ${factoryAddress}`);
      console.log(`Found fee setter address from deployment: ${feeSetterAddress}`);
    }
  }
  
  // Verify contracts with delay and retries
  async function verifyWithRetries(address, constructorArguments) {
    if (!address) {
      console.log("Skipping verification - address not provided");
      return;
    }
    
    console.log(`Waiting for contract ${address} to be deployed and indexed...`);
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
    
    return verified;
  }
  
  // Verify EdgenSwapERC20
  if (erc20Address) {
    await verifyWithRetries(erc20Address, []);
  }
  
  // Verify EdgenSwapFactory
  if (factoryAddress && feeSetterAddress) {
    await verifyWithRetries(factoryAddress, [feeSetterAddress]);
  }
}

// Execute the verification
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });