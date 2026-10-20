const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying PortalSwap contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // 1. Deploy WPOT
  console.log("\n--- Deploying WPOT ---");
  const WPOT = await hre.ethers.getContractFactory("WPOT");
  const wpot = await WPOT.deploy();
  await wpot.waitForDeployment();
  const wpotAddress = await wpot.getAddress();
  console.log("WPOT deployed to:", wpotAddress);

  // 2. Deploy Factory
  console.log("\n--- Deploying PortalSwapFactory ---");
  const Factory = await hre.ethers.getContractFactory("PortalSwapFactory");
  const factory = await Factory.deploy(deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("Factory deployed to:", factoryAddress);

  // 3. Deploy Router
  console.log("\n--- Deploying PortalSwapRouter ---");
  const Router = await hre.ethers.getContractFactory("PortalSwapRouter");
  const router = await Router.deploy(factoryAddress, wpotAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("Router deployed to:", routerAddress);

  // 4. Deploy test tokens
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
  console.log("\n========================================");
  console.log("  PortalSwap Deployment Complete!");
  console.log("========================================");
  console.log("Network: PortaldotV3 Testnet (Chain ID: 420420777)");
  console.log("========================================");
  const addresses = {
    WPOT: wpotAddress,
    Factory: factoryAddress,
    Router: routerAddress,
    pUSDT: pUSDTAddress,
    pDAI: pDAIAddress,
    pWBTC: pWBTCAddress,
    pLINK: pLINKAddress,
  };
  console.log(JSON.stringify(addresses, null, 2));

  // Write addresses to a file for the frontend to consume
  const fs = require("fs");
  fs.writeFileSync(
    "./deployed-addresses.json",
    JSON.stringify({ chainId: 420420777, ...addresses }, null, 2)
  );
  console.log("\nAddresses saved to deployed-addresses.json");
  console.log("Copy the addresses to frontend/src/utils/addresses.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
