# PortalSwap Documentation

## Table of Contents
1. [Overview](#overview)
2. [Contract Addresses](#contract-addresses)
3. [Telegram Bot](#telegram-bot)
4. [Address Mapping](#address-mapping)
5. [Network Information](#network-information)
6. [Features](#features)
7. [Security](#security)

---

## Overview

**PortalSwap** is a decentralized exchange (DEX) built on Portaldot V3 Testnet, offering:
- Token swaps with automated market maker (AMM)
- Liquidity provision with LP token rewards
- Native tPOT staking
- Telegram bot for mobile trading
- Address mapping between EVM and SS58 formats

Built on Uniswap V2 architecture with Portal-specific optimizations.

**Live App:** https://portalswap.live
**Telegram Bot:** [@PlSwapbot](https://t.me/PlSwapbot)
**Explorer:** https://scanner-testnet-v3.portaldot.dev

---

## Contract Addresses

All PortalSwap smart contracts with both EVM and SS58 formats:

### Core Protocol

#### WPOT (Wrapped Portal Token)
- **EVM:** `0xf67cE92096E4E171060B71bF0cca0DA9f9548c03`
- **SS58:** `5Hdtk3kJiQhAdb1oaZXNC8Yi5a8xbcm1GLA5miFsj9J9rqP7`
- Wrapped version of native tPOT for ERC20 compatibility in liquidity pairs

#### Factory Contract
- **EVM:** `0xC631805C297c4233B33c30aF91245058902C1D18`
- **SS58:** `5GYa3Tz8A12RcKHLSVfRMSsK598629k4AaazwTsVqNMiw89o`
- Creates and manages trading pairs

#### Router Contract  
- **EVM:** `0xc17510Df29ae5E4C6C2A46CCB03197edd0963f2B`
- **SS58:** `5GSMsgu7uv6mnaVd6LazM2gQa6aj1CvfpQkP9JpC5otpPxMd`
- Handles swaps, liquidity adds/removes, and optimal routing

#### tPOT Faucet
- **EVM:** `0x2A9DFCC235d7169a9C0817eE0e27e51A6df95be0`
- **SS58:** `5D2aoNfbwuVQinQNrGDz2VP8VCj4DoGKh19kpRjD9bY198jG`
- Distributes test tokens (pUSDT, pDAI, pWBTC, pLINK) for testing

#### tPOT Staking
- **EVM:** `0xC3A38DEb577a345900B7F2d903faDC2E4328D831`
- **SS58:** `5GVDnDmfQswL6gdZ8o4HcWnrMSZXHd4JZxwBKbMRLwJjc8sW`
- Stake tPOT to track TVL and earn future rewards

### Supported Test Tokens

#### pUSDT (Portal USDT)
- **EVM:** `0xe0114Adc0a2072B602C645f5a07EeFA1eaDBDbc2`
- **SS58:** `5H8VijCEfjB6p2EU2ySZSDWQ8NVCvxg2rGv8q1EAuTMzAmD5`
- **Decimals:** 6

#### pDAI (Portal DAI)
- **EVM:** `0x83DF1D2fD7E110c93234911E1798A6415F536D96`
- **SS58:** `5F3cQfL4cqY3wvcgfePUQnXnh8BbjokMzy3WdRLvEVVAXAX4`
- **Decimals:** 18

#### pWBTC (Portal Wrapped BTC)
- **EVM:** `0x35fdB379dd79c8D1AbaB5ed65192cfc0F0ec7bb2`
- **SS58:** `5DHVm2w8At2Gu71xieMDD2xSNX9wqCiBaRrasQMrKNZdivQj`
- **Decimals:** 8

#### pLINK (Portal Chainlink)
- **EVM:** `0xDFCd9E24Bc91b4886CDF773944C2FC311ea9e766`
- **SS58:** `5H89cimAbyGgLLUKkzbWnRoUMqguCsQiSuHSxAxMXBYTwLNQ`
- **Decimals:** 18

---

## Telegram Bot

**Bot Handle:** [@PlSwapbot](https://t.me/PlSwapbot)

### Features

🔑 **Wallet Management**
- Create non-custodial EVM wallets
- Import existing wallets via private key
- Dual address support (EVM + SS58)
- Session-only key storage (never on servers)

💱 **Token Trading**
- Instant token swaps with live quotes
- Support for tPOT, pUSDT, pDAI, pWBTC, pLINK
- Slippage protection
- Transaction confirmations

💰 **Staking & Rewards**
- Stake native tPOT
- Track staking position
- Withdraw anytime

💸 **Transfers**
- Send tPOT to any SS58 or EVM address
- Fast native token transfers

🪙 **Faucet Integration**
- Claim test tokens directly from bot
- Donate tPOT back to faucet

🗺️ **Address Mapper** (New!)
- Convert any EVM address to Portal (SS58) format
- Educational tool explaining the encoding process
- Step-by-step breakdown of address conversion
- Useful for testnet faucets

📊 **Portfolio**
- Real-time token balances
- Portfolio overview

### Quick Start

1. Open [@PlSwapbot](https://t.me/PlSwapbot)
2. Send `/start`
3. Create or import wallet
4. Get testnet tPOT from [Portal Discord](https://discord.gg/portaldot)
5. Claim test tokens in bot
6. Start trading!

---

## Address Mapping

PortalSwap uses **two address formats** for the same account:

### EVM Format (0x...)
- **Use for:** Smart contract interactions, swaps, staking, liquidity
- **Example:** `0xf67cE92096E4E171060B71bF0cca0DA9f9548c03`
- Standard Ethereum-compatible format

### SS58 Format (5...)
- **Use for:** Testnet faucets, native Portal operations
- **Example:** `5Hdtk3kJiQhAdb1oaZXNC8Yi5a8xbcm1GLA5miFsj9J9rqP7`
- Substrate-native format with Portal prefix (42)

### How to Convert

**Option 1: Telegram Bot** (Recommended)
1. Open [@PlSwapbot](https://t.me/PlSwapbot)
2. Click "🗺️ Address Mapper"
3. Send any EVM address
4. Get SS58 equivalent + detailed explanation

**Option 2: Manual Conversion**
```javascript
import { encodeAddress } from '@polkadot/util-crypto';

const evmAddress = '0xf67cE92096E4E171060B71bF0cca0DA9f9548c03';
const hexAddr = evmAddress.slice(2); // Remove 0x
const addressBytes = Buffer.from(hexAddr, 'hex');
const ss58Address = encodeAddress(addressBytes, 42); // Portal prefix
// Result: 5Hdtk3kJiQhAdb1oaZXNC8Yi5a8xbcm1GLA5miFsj9J9rqP7
```

### Technical Details

**SS58 Encoding Process:**
1. Extract hex bytes from EVM address
2. Add Portal network prefix (42)
3. Encode with Base58 + checksum
4. Result starts with "5" (Portal identifier)

**Key Points:**
- Both formats control the **same account**
- Same **private key** for both
- **Same balance** visible in both formats
- Purely mathematical encoding, no separate wallets

See [ADDRESS_MAPPING.md](https://github.com/Junedkhan121/portalswap-telegram-bot/blob/main/ADDRESS_MAPPING.md) for deep-dive.

---

## Network Information

### Portaldot V3 Testnet

- **Network Name:** Portal V3 Testnet
- **Chain ID:** 420420777
- **RPC URL:** https://test-evm-rpc-v3.portaldot.dev
- **Explorer:** https://scanner-testnet-v3.portaldot.dev
- **Currency Symbol:** tPOTv3
- **Native Token:** tPOT (test Portal Token)

### Add to MetaMask

**Automatic:**
Click "Connect Wallet" on https://portalswap.live

**Manual:**
1. Open MetaMask → Networks → Add Network
2. Enter details above
3. Save

---

## Features

### 🔄 Token Swaps
- Swap any supported token pair
- Real-time pricing via AMM
- Slippage tolerance settings (0.5%, 1%, 5%, custom)
- Minimum output guarantees
- Transaction deadline protection

### 💧 Liquidity Provision
- Add liquidity to any pair
- Earn trading fees (0.3% of volume)
- Receive LP tokens representing share
- Remove liquidity anytime
- Auto-balance display and max buttons

### ⚡ Staking
- Stake native tPOT
- Track total value locked (TVL)
- View staking position
- Withdraw anytime
- Future rewards distribution

### 📊 Portfolio
- View all token holdings
- Real-time balance updates
- Clean, simple interface

### 🚰 Faucet
- Get free test tokens
- Available: pUSDT, pDAI, pWBTC, pLINK
- Cooldown period per token
- Telegram bot integration

---

## Security

### Smart Contracts
- ✅ Based on battle-tested Uniswap V2
- ✅ Open source and verified
- ✅ No admin keys or upgradability
- ✅ Non-custodial (you control your keys)

### Testnet Warning
⚠️ **For Testing Only**
- All contracts are on **testnet**
- Do **not** use real funds
- Test tokens have **no value**
- Contracts may be reset

### Best Practices
- Never share your private key
- Always verify transaction details
- Start with small amounts
- Use hardware wallets for mainnet (when available)
- Double-check contract addresses

---

## Developer Integration

### Adding PortalSwap to Your dApp

```javascript
// Contract addresses
const CONTRACTS = {
  WPOT: '0xf67cE92096E4E171060B71bF0cca0DA9f9548c03',
  FACTORY: '0xC631805C297c4233B33c30aF91245058902C1D18',
  ROUTER: '0xc17510Df29ae5E4C6C2A46CCB03197edd0963f2B',
  FAUCET: '0x2A9DFCC235d7169a9C0817eE0e27e51A6df95be0',
  STAKING: '0xC3A38DEb577a345900B7F2d903faDC2E4328D831'
};

// Token addresses
const TOKENS = {
  PUSDT: '0xe0114Adc0a2072B602C645f5a07EeFA1eaDBDbc2',
  PDAI: '0x83DF1D2fD7E110c93234911E1798A6415F536D96',
  PWBTC: '0x35fdB379dd79c8D1AbaB5ed65192cfc0F0ec7bb2',
  PLINK: '0xDFCd9E24Bc91b4886CDF773944C2FC311ea9e766'
};

// Network config
const PORTAL_TESTNET = {
  chainId: 420420777,
  rpcUrl: 'https://test-evm-rpc-v3.portaldot.dev',
  explorer: 'https://scanner-testnet-v3.portaldot.dev'
};
```

### Swap Integration Example

```javascript
import { ethers } from 'ethers';

const routerABI = [...]; // Uniswap V2 Router ABI
const router = new ethers.Contract(CONTRACTS.ROUTER, routerABI, signer);

// Swap exact tokens for tokens
await router.swapExactTokensForTokens(
  amountIn,
  amountOutMin,
  [tokenInAddress, tokenOutAddress],
  recipient,
  deadline
);
```

---

## Support & Community

- **Website:** https://portalswap.live
- **Telegram Bot:** [@PlSwapbot](https://t.me/PlSwapbot)
- **GitHub:** https://github.com/Junedkhan121/PortalSwap
- **Explorer:** https://scanner-testnet-v3.portaldot.dev
- **Discord:** https://discord.gg/portaldot
- **DoraHacks:** [PortalSwap Submission](https://dorahacks.io/hackathon/portaldot-hacker-house-2026/detail)

---

## Future Roadmap

### Phase 1: Testnet (Current)
- ✅ Core DEX functionality
- ✅ Telegram bot
- ✅ Address mapping
- ✅ Staking contract

### Phase 2: Enhanced Features
- 📋 Limit orders
- 📋 Charts and analytics
- 📋 Transaction history in Portfolio
- 📋 Advanced routing

### Phase 3: Mainnet Launch
- 📋 Audit completion
- 📋 Liquidity mining program
- 📋 Governance token
- 📋 DAO formation

---

## License

MIT License - See [LICENSE](./LICENSE) for details

---

**Built with ❤️ for Portaldot Hacker House 2026**
