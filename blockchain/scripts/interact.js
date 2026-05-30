const { ethers } = require("ethers");
require("dotenv").config();
const contractABI = require("../artifacts/contracts/DiplomaVerification.sol/DiplomaVerification.json").abi;

// Configuration
const CONTRACT_ADDRESS = "0x817365bEb3959EDfce3f745a0ABBd51FfD2524D6";

// Connexion au réseau Sepolia
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);

// Wallet avec clé privée
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Instance du contrat
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

// ================================
// FONCTION 1 : Mint un diplôme
// ================================
async function mintDiploma() {
    console.log("Minting diploma...");

    const tx = await contract.mintDiploma(
        wallet.address,                          // adresse étudiant
        "Ahmed Bennani",                         // nom étudiant
        "Licence Informatique",                  // titre diplôme
        "Universite Hassan II",                  // université
        "Informatique",                          // spécialité
        "2024-06-15",                            // date
        "abc123def456",                          // hash diplôme
        "https://monsite.com/diplome/metadata"   // metadata URI
    );

    await tx.wait();
    console.log("✅ Diploma minted! TX:", tx.hash);
}

// ================================
// FONCTION 2 : Vérifier un diplôme
// ================================
async function verifyDiploma(tokenId, diplomaHash) {
    console.log("Verifying diploma...");

    const result = await contract.verifyDiploma(tokenId, diplomaHash);

    if (result) {
        console.log("✅ Diplôme authentique !");
    } else {
        console.log("❌ Faux diplôme détecté !");
    }

    return result;
}

// ================================
// FONCTION 3 : Récupérer un diplôme
// ================================
async function getDiploma(tokenId) {
    console.log("Getting diploma info...");

    const diploma = await contract.diplomas(tokenId);

    console.log("📄 Diploma Info:");
    console.log("   Student    :", diploma.studentName);
    console.log("   Title      :", diploma.diplomaTitle);
    console.log("   University :", diploma.university);
    console.log("   Date       :", diploma.issueDate);
    console.log("   Valid      :", diploma.valid);
    console.log("   FraudStatus:", diploma.fraudStatus.toString());
    console.log("   FraudScore :", diploma.fraudScore.toString());

    return diploma;
}

// ================================
// FONCTION 4 : Révoquer un diplôme
// ================================
async function revokeDiploma(tokenId) {
    console.log("Revoking diploma...");

    const tx = await contract.revokeDiploma(tokenId);
    await tx.wait();

    console.log("✅ Diploma revoked! TX:", tx.hash);
}

// ================================
// MAIN — Tester tout
// ================================
async function main() {
    console.log("=== Blockchain Diploma System ===");
    console.log("Connected wallet:", wallet.address);

    // Test 1 : Mint
    await mintDiploma();

    // Test 2 : Get
    await getDiploma(0);

    // Test 3 : Verify (valide)
    await verifyDiploma(0, "abc123def456");

    // Test 4 : Verify (faux)
    await verifyDiploma(0, "FAUXHASH999");
}

main().catch(console.error);