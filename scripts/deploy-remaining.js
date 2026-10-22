const hre = require("hardhat");

// ── Already deployed ──────────────────────────────────────────────────────────
const WPOT_ADDRESS    = "0xf67cE92096E4E171060B71bF0cca0DA9f9548c03";
const FACTORY_ADDRESS = "0xC631805C297c4233B33c30aF91245058902C1D18";
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying remaining contracts with:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(
    await hre.ethers.provider.getBalance(deployer.address)
  ), "tPOTv3\n");

  console.log("Reusing WPOT:   ", WPOT_ADDRESS);
  console.log("Reusing Factory:", FACTORY_ADDRESS);

  // 1. Router
  console.log("\n--- Deploying PortalSwapRouter ---");
  const Router = await hre.ethers.getContractFactory("PortalSwapRouter");
  const router = await Router.deploy(FACTORY_ADDRESS, WPOT_ADDRESS);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("Router deployed to:", routerAddress);

  // 2. Mock tokens
  console.log("\n--- Deploying Test Tokens ---");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");

  const pUSDT = await MockERC20.deploy("Portal USDT", "pUSDT", 6, hre.ethers.parseUnits("1000000", 6));
  await pUSDT.waitForDeployment();
  const pUSDTAddress = await pUSDT.getAddress();
  console.log("pUSDT deployed to:", pUSDTAddress);

  const pDAI = await MockERC20.deploy("Portal DAI", "pDAI", 18, hre.ethers.parseEther("1000000"));
  await pDAI.waitForDeployment();
  const pDAIAddress = await pDAI.getAddress();
  console.log("pDAI deployed to:", pDAIAddress);

  const pWBTC = await MockERC20.deploy("Portal Wrapped BTC", "pWBTC", 8, hre.ethers.parseUnits("100", 8));
  await pWBTC.waitForDeployment();
  const pWBTCAddress = await pWBTC.getAddress();
  console.log("pWBTC deployed to:", pWBTCAddress);

  const pLINK = await MockERC20.deploy("Portal LINK", "pLINK", 18, hre.ethers.parseEther("1000000"));
  await pLINK.waitForDeployment();
  const pLINKAddress = await pLINK.getAddress();
  console.log("pLINK deployed to:", pLINKAddress);

  // Summary
  const addresses = {
    WPOT:    WPOT_ADDRESS,
    Factory: FACTORY_ADDRESS,
    Router:  routerAddress,
    pUSDT:   pUSDTAddress,
    pDAI:    pDAIAddress,
    pWBTC:   pWBTCAddress,
    pLINK:   pLINKAddress,
  };

  console.log("\n========================================");
  console.log("  PortalSwap — All Contracts Ready!");
  console.log("========================================");
  console.log(JSON.stringify(addresses, null, 2));

  const fs = require("fs");
  fs.writeFileSync(
    "./deployed-addresses.json",
    JSON.stringify({ chainId: 420420777, ...addresses }, null, 2)
  );
  console.log("\nAddresses saved to deployed-addresses.json");
  console.log("Copy them into frontend/src/utils/addresses.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
