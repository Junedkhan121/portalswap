// ============================================================
// CONTRACT ADDRESSES — Update after deploying to Portaldot V3
// Run: npx hardhat run scripts/deploy.js --network portaldotTestnet
// Then paste the output addresses here
// ============================================================

export const CHAIN_ID = 420420777;
export const CHAIN_NAME = "PortaldotV3 Testnet";
export const RPC_URL = "https://test-evm-rpc-v3.portaldot.dev";
export const NATIVE_SYMBOL = "tPOTv3";
export const BLOCK_EXPLORER = ""; // Add if available

// Replace these with your deployed contract addresses
export const ADDRESSES = {
  WPOT: "0xf67cE92096E4E171060B71bF0cca0DA9f9548c03",
  Factory: "0xC631805C297c4233B33c30aF91245058902C1D18",
  Router: "0xc17510Df29ae5E4C6C2A46CCB03197edd0963f2B",
  // Deployed separately — run: npx hardhat run scripts/deploy-faucet.js --network portaldotTestnet
  tPotFaucet: "0x2A9DFCC235d7169a9C0817eE0e27e51A6df95be0",
};

// Test tokens (deployed alongside core contracts)
export const TOKENS = [
  {
    symbol: "tPOTv3",
    name: "Portaldot V3 (Native)",
    address: "NATIVE",
    decimals: 18,
    logo: "🔷",
    isNative: true,
  },
  {
    symbol: "WPOT",
    name: "Wrapped POT",
    address: "0xf67cE92096E4E171060B71bF0cca0DA9f9548c03",
    decimals: 18,
    logo: "🟣",
  },
  {
    symbol: "pUSDT",
    name: "Portal USDT",
    address: "0xe0114Adc0a2072B602C645f5a07EeFA1eaDBDbc2",
    decimals: 6,
    logo: "💵",
    mintable: true,
  },
  {
    symbol: "pDAI",
    name: "Portal DAI",
    address: "0x83DF1D2fD7E110c93234911E1798A6415F536D96",
    decimals: 18,
    logo: "🟡",
    mintable: true,
  },
  {
    symbol: "pWBTC",
    name: "Portal Wrapped BTC",
    address: "0x35fdB379dd79c8D1AbaB5ed65192cfc0F0ec7bb2",
    decimals: 8,
    logo: "🟠",
    mintable: true,
  },
  {
    symbol: "pLINK",
    name: "Portal LINK",
    address: "0xDFCd9E24Bc91b4886CDF773944C2FC311ea9e766",
    decimals: 18,
    logo: "🔗",
    mintable: true,
  },
];

export const NETWORK_CONFIG = {
  chainId: `0x${CHAIN_ID.toString(16)}`,
  chainName: CHAIN_NAME,
  nativeCurrency: {
    name: "Portaldot V3 Test Token",
    symbol: NATIVE_SYMBOL,
    decimals: 18,
  },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: BLOCK_EXPLORER ? [BLOCK_EXPLORER] : [],
};
