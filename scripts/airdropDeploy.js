const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const airdropList = require('./airdrop-list.json');

// 1. 創建葉子節點
const leaves = airdropList.map(item => 
    keccak256(Buffer.concat([
        Buffer.from(item.address.replace('0x', ''), 'hex'),
        Buffer.from(item.amount.padStart(64, '0'), 'hex') // 確保 amount 是 32 字節長
    ]))
);

// 2. 創建 Merkle Tree
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

// 3. 獲取 Merkle Root
const root = tree.getRoot().toString('hex');
console.log('Merkle Root:', '0x' + root);

// --- 以下是為特定用戶生成 Proof 的示例 ---
// 假設我們要為第一個用戶生成 proof
const user = airdropList[0];
const userLeaf = keccak256(Buffer.concat([
    Buffer.from(user.address.replace('0x', ''), 'hex'),
    Buffer.from(user.amount.padStart(64, '0'), 'hex')
]));
const proof = tree.getHexProof(userLeaf);
console.log(`Proof for ${user.address}:`, proof);