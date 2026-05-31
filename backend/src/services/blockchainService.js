const { ethers } = require('ethers');
require('dotenv').config();

// ─── ABI of the DiplomaVerification Smart Contract ────────────────────────────
// This must match exactly what is deployed on-chain (Task 1 team provides this)
const CONTRACT_ABI = [
  // ajouterDiplome(bytes32 hash, string studentId, string studentName, string degree, string university, uint256 graduationDate)
  {
    inputs: [
      { internalType: 'bytes32', name: 'diplomaHash', type: 'bytes32' },
      { internalType: 'string', name: 'studentId', type: 'string' },
      { internalType: 'string', name: 'studentName', type: 'string' },
      { internalType: 'string', name: 'degree', type: 'string' },
      { internalType: 'string', name: 'university', type: 'string' },
      { internalType: 'uint256', name: 'graduationDate', type: 'uint256' },
    ],
    name: 'ajouterDiplome',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // verifierDiplome(bytes32 hash) returns (bool)
  {
    inputs: [{ internalType: 'bytes32', name: 'diplomaHash', type: 'bytes32' }],
    name: 'verifierDiplome',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  // getDiplome(bytes32 hash) returns (studentId, studentName, degree, university, graduationDate, isValid)
  {
    inputs: [{ internalType: 'bytes32', name: 'diplomaHash', type: 'bytes32' }],
    name: 'getDiplome',
    outputs: [
      { internalType: 'string', name: 'studentId', type: 'string' },
      { internalType: 'string', name: 'studentName', type: 'string' },
      { internalType: 'string', name: 'degree', type: 'string' },
      { internalType: 'string', name: 'university', type: 'string' },
      { internalType: 'uint256', name: 'graduationDate', type: 'uint256' },
      { internalType: 'bool', name: 'isValid', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

// ─── Provider & Contract Setup ────────────────────────────────────────────────
let provider;
let contract;
let signer;

function getProvider() {
  if (!provider) {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return provider;
}

function getContract() {
  if (!contract) {
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('CONTRACT_ADDRESS not set in .env');
    }

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not set in .env');
    }

    const prov = getProvider();
    signer = new ethers.Wallet(privateKey, prov);
    contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
  }
  return contract;
}

// ─── Blockchain Service Functions ─────────────────────────────────────────────

/**
 * Add a diploma to the blockchain
 * @param {string} diplomaHash - 0x-prefixed hex hash (32 bytes)
 * @param {Object} diplomaData - Diploma information
 * @returns {Object} - Transaction receipt
 */
async function ajouterDiplome(diplomaHash, diplomaData) {
  try {
    const ct = getContract();

    // Convert hex string to bytes32
    const hashBytes32 = ethers.zeroPadValue(diplomaHash, 32);

    // Convert graduation date to Unix timestamp
    const graduationTimestamp = Math.floor(
      new Date(diplomaData.graduationDate).getTime() / 1000
    );

    console.log(`[Blockchain] Sending transaction: ajouterDiplome(${diplomaHash})`);

    const tx = await ct.ajouterDiplome(
      hashBytes32,
      diplomaData.studentId,
      diplomaData.studentName,
      diplomaData.degree,
      diplomaData.university,
      graduationTimestamp
    );

    console.log(`[Blockchain] Transaction sent: ${tx.hash}`);

    // Wait for 1 confirmation
    const receipt = await tx.wait(1);

    console.log(`[Blockchain] Confirmed in block: ${receipt.blockNumber}`);

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed',
    };
  } catch (error) {
    console.error('[Blockchain] Error in ajouterDiplome:', error.message);
    throw new Error(`Blockchain error: ${error.message}`);
  }
}

/**
 * Verify a diploma exists on the blockchain
 * @param {string} diplomaHash - 0x-prefixed hex hash
 * @returns {boolean}
 */
async function verifierDiplome(diplomaHash) {
  try {
    const ct = getContract();
    const hashBytes32 = ethers.zeroPadValue(diplomaHash, 32);

    const isValid = await ct.verifierDiplome(hashBytes32);
    console.log(`[Blockchain] verifierDiplome(${diplomaHash}) = ${isValid}`);

    return isValid;
  } catch (error) {
    console.error('[Blockchain] Error in verifierDiplome:', error.message);
    throw new Error(`Blockchain verification error: ${error.message}`);
  }
}

/**
 * Get full diploma data from the blockchain
 * @param {string} diplomaHash - 0x-prefixed hex hash
 * @returns {Object} diploma data
 */
async function getDiplome(diplomaHash) {
  try {
    const ct = getContract();
    const hashBytes32 = ethers.zeroPadValue(diplomaHash, 32);

    const result = await ct.getDiplome(hashBytes32);

    return {
      studentId: result[0],
      studentName: result[1],
      degree: result[2],
      university: result[3],
      graduationDate: new Date(Number(result[4]) * 1000).toISOString().split('T')[0],
      isValid: result[5],
    };
  } catch (error) {
    console.error('[Blockchain] Error in getDiplome:', error.message);
    throw new Error(`Blockchain fetch error: ${error.message}`);
  }
}

/**
 * Test blockchain connectivity
 * @returns {Object} network info
 */
async function testConnection() {
  try {
    const prov = getProvider();
    const network = await prov.getNetwork();
    const blockNumber = await prov.getBlockNumber();

    return {
      connected: true,
      networkName: network.name,
      chainId: network.chainId.toString(),
      latestBlock: blockNumber,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
}

module.exports = {
  ajouterDiplome,
  verifierDiplome,
  getDiplome,
  testConnection,
};
