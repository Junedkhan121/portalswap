// ============================================================
// CONTRACT ADDRESSES — Portaldot V3 Testnet
// ============================================================
// All addresses below are in EVM format (0x...)
// For SS58 format (5...), see DOCS.md
// Both formats represent the SAME account, same private key
// ============================================================

export const CHAIN_ID = 420420777;
export const CHAIN_NAME = "PortaldotV3 Testnet";
export const RPC_URL = "https://test-evm-rpc-v3.portaldot.dev";
export const NATIVE_SYMBOL = "tPOTv3";
export const BLOCK_EXPLORER = "https://scanner-testnet-v3.portaldot.dev";

// Core Protocol Contracts
export const ADDRESSES = {
  // WPOT - Wrapped Portal Token
  // EVM: 0xf67cE92096E4E171060B71bF0cca0DA9f9548c03
  // SS58: 5Hdtk3kJiQhAdb1oaZXNC8Yi5a8xbcm1GLA5miFsj9J9rqP7
  WPOT: "0xf67cE92096E4E171060B71bF0cca0DA9f9548c03",

  // Factory - Creates and manages trading pairs
  // EVM: 0xC631805C297c4233B33c30aF91245058902C1D18
  // SS58: 5GYa3Tz8A12RcKHLSVfRMSsK598629k4AaazwTsVqNMiw89o
  Factory: "0xC631805C297c4233B33c30aF91245058902C1D18",

  // Router - Handles swaps and liquidity operations
  // EVM: 0xc17510Df29ae5E4C6C2A46CCB03197edd0963f2B
  // SS58: 5GSMsgu7uv6mnaVd6LazM2gQa6aj1CvfpQkP9JpC5otpPxMd
  Router: "0xc17510Df29ae5E4C6C2A46CCB03197edd0963f2B",

  // Faucet - Distributes test tokens
  // EVM: 0x2A9DFCC235d7169a9C0817eE0e27e51A6df95be0
  // SS58: 5D2aoNfbwuVQinQNrGDz2VP8VCj4DoGKh19kpRjD9bY198jG
  tPotFaucet: "0x2A9DFCC235d7169a9C0817eE0e27e51A6df95be0",

  // Staking - Stake tPOT for rewards
  // EVM: 0xC3A38DEb577a345900B7F2d903faDC2E4328D831
  // SS58: 5GVDnDmfQswL6gdZ8o4HcWnrMSZXHd4JZxwBKbMRLwJjc8sW
  tPotStaking: "0xC3A38DEb577a345900B7F2d903faDC2E4328D831",
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
    // EVM: 0xf67cE92096E4E171060B71bF0cca0DA9f9548c03
    // SS58: 5Hdtk3kJiQhAdb1oaZXNC8Yi5a8xbcm1GLA5miFsj9J9rqP7
    address: "0xf67cE92096E4E171060B71bF0cca0DA9f9548c03",
    decimals: 18,
    logo: "🟣",
  },
  {
    symbol: "pUSDT",
    name: "Portal USDT",
    // EVM: 0xe0114Adc0a2072B602C645f5a07EeFA1eaDBDbc2
    // SS58: 5H8VijCEfjB6p2EU2ySZSDWQ8NVCvxg2rGv8q1EAuTMzAmD5
    address: "0xe0114Adc0a2072B602C645f5a07EeFA1eaDBDbc2",
    decimals: 6,
    logo: "💵",
    mintable: true,
  },
  {
    symbol: "pDAI",
    name: "Portal DAI",
    // EVM: 0x83DF1D2fD7E110c93234911E1798A6415F536D96
    // SS58: 5F3cQfL4cqY3wvcgfePUQnXnh8BbjokMzy3WdRLvEVVAXAX4
    address: "0x83DF1D2fD7E110c93234911E1798A6415F536D96",
    decimals: 18,
    logo: "🟡",
    mintable: true,
  },
  {
    symbol: "pWBTC",
    name: "Portal Wrapped BTC",
    // EVM: 0x35fdB379dd79c8D1AbaB5ed65192cfc0F0ec7bb2
    // SS58: 5DHVm2w8At2Gu71xieMDD2xSNX9wqCiBaRrasQMrKNZdivQj
    address: "0x35fdB379dd79c8D1AbaB5ed65192cfc0F0ec7bb2",
    decimals: 8,
    logo: "🟠",
    mintable: true,
  },
  {
    symbol: "pLINK",
    name: "Portal LINK",
    // EVM: 0xDFCd9E24Bc91b4886CDF773944C2FC311ea9e766
    // SS58: 5H89cimAbyGgLLUKkzbWnRoUMqguCsQiSuHSxAxMXBYTwLNQ
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
