require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

// Fail loudly instead of deploying with zero accounts (which produces a
// confusing "no signers" error deep inside the deploy script).
if (!process.env.PRIVATE_KEY) {
  console.warn(
    "\n[PortalSwap] PRIVATE_KEY is not set. Copy .env.example to .env and paste your " +
      "deployer private key (no 0x prefix) before deploying.\n"
  );
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      // Target the pre-Shanghai EVM. Solidity 0.8.20 defaults to Shanghai and emits
      // PUSH0, which some newer/embedded EVM runtimes (Portaldot's is WASM-backed)
      // do not implement — that would make every deployment revert.
      evmVersion: "paris",
    },
  },
  networks: {
    portaldotTestnet: {
      url: "https://test-evm-rpc-v3.portaldot.dev",
      chainId: 420420777,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 50000000000,   // 50 gwei legacy
      gas: 6000000,
      // Force legacy transactions (type 0) — some testnets reject EIP-1559
      // Remove type, maxFeePerGas, maxPriorityFeePerGas
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
