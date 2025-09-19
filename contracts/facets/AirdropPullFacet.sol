// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6; // 與你的專案版本保持一致

import { LibAppStorage, AppStorage } from "../libraries/LibAppStorage.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract AirdropPullFacet {
    event Pulled(address indexed recipient, uint256 amount);
    event MerkleRootSet(bytes32 indexed newRoot);
    
    function setMerkleRoot(bytes32 _merkleRoot) external {
        AppStorage storage ds = LibAppStorage.layout();
        require(msg.sender == ds.owner, "AirdropPullFacet: Not owner");
        ds.merkleRoot = _merkleRoot;
        emit MerkleRootSet(_merkleRoot);
    }

    function claimPull(uint256 amount, bytes32[] calldata merkleProof) external {
        AppStorage storage ds = LibAppStorage.layout();
        require(ds.merkleRoot != bytes32(0), "Airdrop: Not active");
        require(!ds.hasClaimed[msg.sender], "Airdrop: Already claimed");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        
        bool isValid = MerkleProof.verify(merkleProof, ds.merkleRoot, leaf);
        require(isValid, "Airdrop: Invalid proof");
        
        ds.hasClaimed[msg.sender] = true;

        IERC20(ds.airdropToken).transfer(msg.sender, amount);
        emit Pulled(msg.sender, amount);
    }
}