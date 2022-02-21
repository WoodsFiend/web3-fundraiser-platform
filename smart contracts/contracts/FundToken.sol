// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FundToken is ERC20Capped, ERC20Burnable, Ownable, AccessControl {
   
    event Minted(address indexed user, uint256 amount, uint256 timestamp);
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(uint256 _cap) ERC20("FundUs", "FUND") ERC20Capped(_cap) {
        //pre-mint 100 for test
        _mint(msg.sender, 100 * 10**18);
        _setupRole(DEFAULT_ADMIN_ROLE, address(msg.sender));
    }

    //Called by utility contract to mint new tokens as rewards
    function mint(address _receiver, uint256 _amount) external {
        require(hasRole(MINTER_ROLE, msg.sender), "This address is not permitted to mint tokens");
        require(_receiver != address(0), "Cannot mint to the zero address");
        _mint(_receiver, _amount);
        emit Minted(_receiver, _amount, block.timestamp);
    }

    function grantMinterRole(address _account) public onlyOwner{
        _grantRole(MINTER_ROLE, _account);
    }
    function revokeMinterRole(address _account) public onlyOwner{
        _revokeRole(MINTER_ROLE, _account);
    }
    function _mint(address _receiver, uint256 _amount) internal virtual override(ERC20, ERC20Capped) {
        require(ERC20.totalSupply() + _amount <= cap(), "ERC20Capped: cap exceeded");
        super._mint(_receiver, _amount);
    }
}