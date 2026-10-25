# PortalSwap Telegram Bot

Telegram bot for **PortalSwap DEX** on Portaldot V3 Testnet with full SS58 address mapping support.

## Features

✅ **Wallet Management**
- Create new EVM wallets
- Import existing wallets via private key
- Display both EVM (`0x...`) and SS58 (`5...`) addresses
- SS58 mapping using Portaldot's 0xEE padding rule

✅ **DEX Operations**
- Check native and token balances
- Multi-step conversational swap flow
- Stake tPOT tokens for rewards
- Claim staking rewards

✅ **Security**
- In-session wallet storage (production: use encrypted database)
- Private key warnings
- Transaction confirmations

## Architecture

```
telegram-bot/
├── package.json
├── .env.example
├── src/
│   ├── index.js              # Main bot entry point
│   ├── utils/
│   │   ├── ss58.js           # SS58 address mapping (0xEE padding)
│   │   ├── wallet.js         # Wallet creation, import, session management
│   │   └── contracts.js      # Ethers.js provider, contract ABIs, utilities
│   ├── keyboards/
│   │   └── index.js          # Telegraf inline keyboard layouts
│   └── handlers/
│       ├── balance.js        # Balance checking
│       ├── swap.js           # Token swap flow
│       └── staking.js        # Staking operations
```

## Setup

### 1. Prerequisites

- Node.js ≥ 18
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

### 2. Installation

\`\`\`bash
cd telegram-bot
npm install
\`\`\`

### 3. Configuration

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and add your bot token:

\`\`\`env
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
\`\`\`

All contract addresses and network config are pre-filled for Portaldot V3 Testnet.

### 4. Run

**Option A: Standard (stops when you close CMD)**
\`\`\`bash
npm start

# Development mode with auto-reload
npm run dev
\`\`\`

**Option B: 24/7 Background (PM2)** ⭐
\`\`\`bash
# Easy way: double-click start-pm2.bat
# OR manually:
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save

# Auto-start on Windows boot
pm2 startup
\`\`\`

**Option C: Cloud Hosting**

Deploy to Railway, Fly.io, or Render. See [CLOUD_HOSTING.md](./CLOUD_HOSTING.md).

Full PM2 guide: [PM2_SETUP.md](./PM2_SETUP.md)

## Usage Flow

### Initial Setup

1. User sends `/start`
2. Bot presents two options:
   - **Create New Wallet**: Generates fresh wallet + displays EVM & SS58 addresses + private key
   - **Import Wallet**: User sends private key → bot loads wallet

### Main Menu (after authentication)

- **💰 Check Balance**: Shows native tPOTv3 and all test token balances
- **🔄 Swap Tokens**: 3-step flow
  1. Select FROM token
  2. Select TO token
  3. Enter amount → preview → confirm → execute
- **⚡ Stake tPOT**: Deposit/withdraw/claim rewards from staking contract
- **🔑 Show Keys**: Display both addresses and private key

## SS58 Address Mapping

Portaldot uses a specific EVM ↔ SS58 mapping rule:

1. Take 20-byte EVM address: `0x1234...abcd`
2. Pad with 12 bytes of `0xEE` prefix: `[0xEE × 12] + [20-byte address]` = 32 bytes
3. Encode as SS58 with prefix 42 (generic substrate): `5ABC...xyz`

**Why?** Portaldot V3 is a WASM-based EVM layer on Substrate. Transfers to pay for gas (tPOTv3) happen on the substrate side using SS58 addresses, while contract interactions use standard EVM addresses.

The bot automatically displays both formats so users know:
- **EVM address** → for MetaMask, contract calls, DEX operations
- **SS58 address** → for receiving testnet gas from faucets/transfers

Implementation: `src/utils/ss58.js` using `@polkadot/util-crypto`

## Contract Integration

All contract addresses are in `.env`:

- **Router**: Swap execution (PortalSwapRouter)
- **Staking**: tPOT staking (PortalSwapStaking)
- **WPOT**: Wrapped native token
- **Test Tokens**: pUSDT, pDAI, pWBTC, pLINK

ABIs are minimal interfaces in `src/utils/contracts.js` — only the functions the bot needs.

## Session Management

**Current implementation**: In-memory `Map` storage (ephemeral)

**Production recommendations**:
- Use Redis for session persistence
- Encrypt private keys at rest
- Implement session timeouts
- Add rate limiting per user

Replace the `Map` in `src/utils/wallet.js` with your chosen backend.

## Swap Flow Details

\`\`\`
User clicks "Swap"
  → Select FROM token (tPOTv3, pUSDT, pDAI, pWBTC, pLINK)
  → Select TO token (validation: cannot be same as FROM)
  → User types amount (text message)
  → Bot calls router.getAmountsOut() for preview
  → User confirms
  → Bot approves tokens (if ERC-20 → anything)
  → Bot executes swap via router
  → Displays transaction hash
\`\`\`

Native swaps (tPOTv3 → token) use `swapExactETHForTokens` with `{ value: amountIn }`.

Token → native uses `swapExactTokensForETH` after approval.

Token → token uses `swapExactTokensForTokens` after approval.

## Staking Flow

\`\`\`
User clicks "Stake"
  → Staking menu: Deposit | Withdraw | Claim | Info
  → User picks action → enters amount
  → Confirmation → execute via staking contract
\`\`\`

Rewards accrue per the `PortalSwapStaking` contract logic. The bot reads `pendingRewards()` and allows one-click claims.

## Production Checklist

Before mainnet or public deployment:

- [ ] Replace in-memory sessions with encrypted database/Redis
- [ ] Add user authentication layer
- [ ] Implement rate limiting (prevent spam/abuse)
- [ ] Add transaction gas estimation
- [ ] Store transaction history per user
- [ ] Add admin commands (stats, broadcast, maintenance mode)
- [ ] Deploy on VPS with PM2 or Docker
- [ ] Set up monitoring (Sentry, logs)
- [ ] Add multi-language support
- [ ] Implement referral/analytics tracking

## Security Notes

⚠️ **This bot stores private keys in plaintext in-memory.** Suitable for testnet only.

For production:
- Use hardware wallets or custodial wallet APIs
- Never log private keys
- Validate all user input
- Use webhook mode instead of polling for better security
- Implement 2FA for high-value operations

## Troubleshooting

**Bot doesn't respond:**
- Check `BOT_TOKEN` in `.env`
- Verify RPC URL is reachable: `curl https://test-evm-rpc-v3.portaldot.dev`

**Swap fails:**
- Ensure user has sufficient balance + gas
- Check pair liquidity on portalswap.live
- Verify token addresses in `.env`

**SS58 address looks wrong:**
- Must start with `5` (prefix 42)
- Length should be 47-48 characters
- Double-check the padding logic uses `0xEE` × 12 bytes

## Links

- **Live DEX**: [portalswap.live](https://portalswap.live)
- **GitHub**: [github.com/Junedkhan121/PortalSwap](https://github.com/Junedkhan121/PortalSwap)
- **Portaldot Docs**: [docs.portaldot.dev](https://docs.portaldot.dev)

## License

MIT
