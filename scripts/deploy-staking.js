/**
 * deploy-staking.js
 * ─────────────────────────────────────────────────────────────────────────
 * Deploy tPotStaking on the Portaldot V3 Testnet.
 * tPOTv3 is the native token so no token address is needed in the constructor.
 *
 * Run:
 *   npx hardhat run scripts/deploy-staking.js --network portaldotTestnet
 *
 * After deploying, copy the printed address into:
 *   frontend/src/utils/addresses.js  →  ADDRESSES.tPotStaking
 */

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const bal = await hre.ethers.provider.getBalance(deployer.address);

  console.log("=================================================");
  console.log("  tPotStaking Deployment");
  console.log("=================================================");
  console.log("Deployer :", deployer.address);
  console.log("Balance  :", hre.ethers.formatEther(bal), "tPOTv3");

  const Staking  = await hre.ethers.getContractFactory("tPotStaking");
  const staking  = await Staking.deploy();
  await staking.waitForDeployment();

  const addr = await staking.getAddress();

  console.log("\n=================================================");
  console.log("  Deployment complete!");
  console.log("=================================================");
  console.log("Contract address :", addr);
  console.log("\nAdd to frontend/src/utils/addresses.js:");
  console.log(`\n  tPotStaking: "${addr}",\n`);

  // Update deployed-addresses.json
  const fs = require("fs");
  const jsonPath = "./deployed-addresses.json";
  if (fs.existsSync(jsonPath)) {
    const existing = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    existing.tPotStaking = addr;
    fs.writeFileSync(jsonPath, JSON.stringify(existing, null, 2));
    console.log("deployed-addresses.json updated.");
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
