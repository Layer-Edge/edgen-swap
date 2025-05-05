const { ethers } = require("hardhat");

// Helper for expanding a number to 18 decimals
function expandTo18Decimals(n) {
  return ethers.utils.parseEther(n.toString());
}

// Helper for calculating CREATE2 addresses
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

// Helper for getting the approval digest for permit
async function getApprovalDigest(
  token,
  approve = {
    owner: ethers.constants.AddressZero,
    spender: ethers.constants.AddressZero,
    value: ethers.constants.Zero
  },
  nonce,
  deadline
) {
  const name = await token.name();
  const DOMAIN_SEPARATOR = await token.DOMAIN_SEPARATOR();
  const PERMIT_TYPEHASH = await token.PERMIT_TYPEHASH();
  
  return ethers.utils.keccak256(
    ethers.utils.solidityPack(
      ["bytes1", "bytes1", "bytes32", "bytes32"],
      [
        "0x19",
        "0x01",
        DOMAIN_SEPARATOR,
        ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ["bytes32", "address", "address", "uint256", "uint256", "uint256"],
            [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
          )
        )
      ]
    )
  );
}

// Helper for mining a block at a specific timestamp
async function mineBlock(timestamp) {
  console.log('mining block at timestamp', timestamp)
  await ethers.provider.send("evm_mine", [timestamp]);
}

// Helper for encoding price
function encodePrice(reserve0, reserve1) {
  return [
    reserve1.mul(ethers.BigNumber.from(2).pow(112)).div(reserve0),
    reserve0.mul(ethers.BigNumber.from(2).pow(112)).div(reserve1)
  ];
}

// Helper for getting a signature from a digest
async function getSignatureFromDigest(digest, wallet) {
  const signingKey = new ethers.utils.SigningKey(wallet.privateKey);
  const signature = signingKey.signDigest(digest);
  return {
    v: signature.v,
    r: signature.r,
    s: signature.s
  };
}

module.exports = {
  expandTo18Decimals,
  getCreate2Address,
  getApprovalDigest,
  mineBlock,
  encodePrice,
  getSignatureFromDigest
}; 