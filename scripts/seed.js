const hre = require("hardhat");
const fs = require("fs");

/**
 * Seeds initial liquidity so the DApp has pools to demo immediately.
 * Run after deploy.js:
 *   npx hardhat run scripts/seed.js --network portaldotTestnet
 *
 * POT budget is configurable — by default it spends 60 tPOTv3 total (30 + 30).
 * Override with:  SEED_POT=200 npx hardhat run scripts/seed.js --network portaldotTestnet
 * The script checks your balance first and scales the two POT pools down to fit.
 */
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Seeding with:", deployer.address);
  console.log("POT balance:", hre.ethers.formatEther(balance), "tPOTv3");

  const deployed = JSON.parse(fs.readFileSync("./deployed-addresses.json", "utf8"));
  const { Factory, Router, pUSDT, pDAI } = deployed;

  const router = await hre.ethers.getContractAt("PortalSwapRouter", Router);
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  // Leave a reserve for gas on the three seeding transactions.
  const gasReserve = hre.ethers.parseEther("0.5");
  const requested = hre.ethers.parseEther(process.env.SEED_POT || "60");
  const spendable = balance > gasReserve ? balance - gasReserve : 0n;

  if (spendable === 0n) {
    console.error(
      `\nNo POT available to seed with. Balance is ${hre.ethers.formatEther(balance)} tPOTv3; ` +
        "get testnet tokens from the Portaldot Discord faucet first."
    );
    process.exit(1);
  }

  const budget = requested < spendable ? requested : spendable;
  const potA = budget / 2n;
  const potB = budget - potA;
  console.log("POT allocated to seeding:", hre.ethers.formatEther(budget));

  const approve = async (tokenAddr, amount) => {
    const token = await hre.ethers.getContractAt("MockERC20", tokenAddr);
    const tx = await token.approve(Router, amount);
    await tx.wait();
  };

  // --- Pool 1: tPOTv3 / pUSDT (1:1 by unit, 6 decimals on the token side) ---
  console.log("\n--- Pool 1: tPOTv3 / pUSDT ---");
  if (potA > 0n) {
    const usdtAmount = potA / 10n ** 12n; // 18 dec -> 6 dec
    await approve(pUSDT, usdtAmount);
    const tx = await router.addLiquidityPOT(
      pUSDT,
      usdtAmount,
      0,
      0,
      deployer.address,
      deadline,
      { value: potA }
    );
    await tx.wait();
    console.log(
      `Seeded ${hre.ethers.formatEther(potA)} tPOTv3 + ${hre.ethers.formatUnits(usdtAmount, 6)} pUSDT`
    );
  } else {
    console.log("Skipped — POT budget too small to split across two pools.");
  }

  // --- Pool 2: tPOTv3 / pDAI (1:1) ---
  console.log("\n--- Pool 2: tPOTv3 / pDAI ---");
  if (potB > 0n) {
    await approve(pDAI, potB);
    const tx = await router.addLiquidityPOT(
      pDAI,
      potB,
      0,
      0,
      deployer.address,
      deadline,
      { value: potB }
    );
    await tx.wait();
    console.log(`Seeded ${hre.ethers.formatEther(potB)} tPOTv3 + ${hre.ethers.formatEther(potB)} pDAI`);
  } else {
    console.log("Skipped — POT budget too small.");
  }

  // --- Pool 3: pUSDT / pDAI (token-to-token, costs no POT) ---
  console.log("\n--- Pool 3: pUSDT / pDAI ---");
  const usdt1000 = hre.ethers.parseUnits("1000", 6);
  const dai1000 = hre.ethers.parseEther("1000");
  await approve(pUSDT, usdt1000);
  await approve(pDAI, dai1000);
  let tx = await router.addLiquidity(pUSDT, pDAI, usdt1000, dai1000, 0, 0, deployer.address, deadline);
  await tx.wait();
  console.log("Seeded 1000 pUSDT + 1000 pDAI");

  const factory = await hre.ethers.getContractAt("PortalSwapFactory", Factory);
  const count = await factory.allPairsLength();
  console.log(`\nTotal pools created: ${count}`);
  console.log("Ready to demo — open the frontend and connect your wallet.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
