pragma solidity =0.5.16;

import '../EdgenSwapERC20.sol';

contract ERC20 is EdgenSwapERC20 {
    constructor(uint _totalSupply) public {
        _mint(msg.sender, _totalSupply);
    }
}
