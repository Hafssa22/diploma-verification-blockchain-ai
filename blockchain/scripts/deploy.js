const hre = require("hardhat");

async function main() {

    const DiplomaVerification =
        await hre.ethers.getContractFactory(
            "DiplomaVerification"
        );

    const contract =
        await DiplomaVerification.deploy();

    await contract.waitForDeployment();

    console.log(
        "Contract deployed to:",
        await contract.getAddress()
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});