/**
 * deploy-faucet.js
 * ─────────────────────────────────────────────────────────────────────────
 * Deploy tPotFaucet and seed it with 1 000 tPOTv3 from the deployer wallet.
 *
 * Run:
 *   npx hardhat run scripts/deploy-faucet.js --network portaldotTestnet
 *
 * After deploying, copy the printed address into:
 *   frontend/src/utils/addresses.js  →  ADDRESSES.tPotFaucet
 */

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const provider   = hre.ethers.provider;

  console.log("=================================================");
  console.log("  tPotFaucet Deployment");
  console.log("=================================================");
  console.log("Deployer :", deployer.address);

  const bal = await provider.getBalance(deployer.address);
  console.log("Balance  :", hre.ethers.formatEther(bal), "tPOTv3");

  const seed = hre.ethers.parseEther("1000"); // 1 000 tPOTv3

  if (bal < seed) {
    throw new Error(
      `Deployer balance (${hre.ethers.formatEther(bal)} tPOTv3) is less than ` +
      `the seed amount (1000 tPOTv3). Top up the deployer wallet and retry.`
    );
  }

  console.log("\nDeploying tPotFaucet (seeding with 1 000 tPOTv3)…");
  const Faucet  = await hre.ethers.getContractFactory("tPotFaucet");
  const faucet  = await Faucet.deploy({ value: seed });
  await faucet.waitForDeployment();

  const faucetAddress   = await faucet.getAddress();
  const contractBalance = await provider.getBalance(faucetAddress);

  console.log("\n=================================================");
  console.log("  Deployment complete!");
  console.log("=================================================");
  console.log("Contract address :", faucetAddress);
  console.log("Pool balance     :", hre.ethers.formatEther(contractBalance), "tPOTv3");
  console.log("\nNext step — add to frontend/src/utils/addresses.js:");
  console.log(`\n  tPotFaucet: "${faucetAddress}",\n`);

  // ── Update deployed-addresses.json if it exists ───────────────────────
  const fs = require("fs");
  const jsonPath = "./deployed-addresses.json";
  if (fs.existsSync(jsonPath)) {
    const existing = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    existing.tPotFaucet = faucetAddress;
    fs.writeFileSync(jsonPath, JSON.stringify(existing, null, 2));
    console.log("deployed-addresses.json updated.");
  } else {
    // Write a minimal file so the user has something to reference
    fs.writeFileSync(
      jsonPath,
      JSON.stringify({ chainId: 420420777, tPotFaucet: faucetAddress }, null, 2)
    );
    console.log("deployed-addresses.json created.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
