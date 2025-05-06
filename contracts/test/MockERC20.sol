pragma solidity =0.5.16;

import '../EdgenSwapERC20.sol';

contract MockERC20 is EdgenSwapERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply) public {
        name = name;
        symbol = symbol;
        _mint(msg.sender, initialSupply);
    }
}
