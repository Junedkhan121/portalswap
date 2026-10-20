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
  WPOT: "0x0000000000000000000000000000000000000000",
  Factory: "0x0000000000000000000000000000000000000000",
  Router: "0x0000000000000000000000000000000000000000",
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
    address: ADDRESSES.WPOT,
    decimals: 18,
    logo: "🟣",
  },
  {
    symbol: "pUSDT",
    name: "Portal USDT",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 6,
    logo: "💵",
    mintable: true,
  },
  {
    symbol: "pDAI",
    name: "Portal DAI",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    logo: "🟡",
    mintable: true,
  },
  {
    symbol: "pWBTC",
    name: "Portal Wrapped BTC",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 8,
    logo: "🟠",
    mintable: true,
  },
  {
    symbol: "pLINK",
    name: "Portal LINK",
    address: "0x0000000000000000000000000000000000000000",
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
