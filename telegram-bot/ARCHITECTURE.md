# PortalSwap Telegram Bot - Project Structure

\`\`\`
telegram-bot/
│
├── package.json                  # Dependencies: telegraf, ethers, @polkadot/util-crypto
├── .env.example                  # Environment template
├── .env                          # Your config (add BOT_TOKEN here)
├── README.md                     # Full documentation
│
└── src/
    ├── index.js                  # Main entry point
    │                             # - Bot initialization
    │                             # - /start command
    │                             # - Route all actions
    │                             # - Text message handler (import wallet + amount inputs)
    │
    ├── utils/
    │   ├── ss58.js               # SS58 address mapping
    │   │                         # - evmToSS58(address) → 5... address
    │   │                         # - Uses 0xEE padding (12 bytes) + encodeAddress(prefix 42)
    │   │
    │   ├── wallet.js             # Wallet management
    │   │                         # - createWallet(userId) → new random wallet
    │   │                         # - importWallet(userId, privateKey) → load existing
    │   │                         # - getWalletSession(userId) → retrieve from Map
    │   │                         # - getWalletSigner(userId, provider) → ethers.Wallet instance
    │   │
    │   └── contracts.js          # Blockchain utilities
    │                             # - getProvider() → JsonRpcProvider for Portaldot
    │                             # - Contract ABIs (Router, Staking, ERC20, WPOT)
    │                             # - CONTRACTS object (all addresses)
    │                             # - Helper functions: formatTokenAmount, parseTokenAmount
    │
    ├── keyboards/
    │   └── index.js              # Telegraf inline keyboards
    │                             # - getInitialMenu() → Create | Import
    │                             # - getMainMenu() → Balance | Swap | Stake | Portfolio | Help
    │                             # - getTokenSelectionKeyboard(context) → Token picker
    │                             # - getConfirmationKeyboard(action) → Confirm | Cancel
    │                             # - getStakingMenu() → Deposit | Withdraw | Claim | Info
    │
    └── handlers/
        ├── balance.js            # Balance handler
        │                         # - Fetch native + token balances
        │                         # - Display formatted amounts
        │
        ├── swap.js               # Swap flow (multi-step)
        │                         # - handleSwapStart() → Select FROM token
        │                         # - handleTokenSelection() → Select TO token
        │                         # - handleSwapAmountInput() → User types amount (text message)
        │                         # - Preview via router.getAmountsOut()
        │                         # - handleSwapConfirm() → Approve + execute swap
        │                         # - Supports: native→token, token→native, token→token
        │
        └── staking.js            # Staking operations
                                  # - handleStakeMenu() → Staking menu
                                  # - handleStakeInfo() → Display stake + rewards
                                  # - handleStakeDeposit() → Stake flow
                                  # - handleStakeWithdraw() → Unstake flow
                                  # - handleStakeClaimRewards() → Claim rewards
                                  # - handleStakeAmountInput() → User types amount (text message)
                                  # - Confirm + execute via staking contract
\`\`\`

## Data Flow

### Wallet Creation
\`\`\`
User clicks "Create Wallet"
  → wallet.js: createWallet(userId)
  → ethers.Wallet.createRandom()
  → Store in userSessions Map
  → ss58.js: evmToSS58(address)
  → Display both addresses + private key
  → Show main menu
\`\`\`

### Wallet Import
\`\`\`
User clicks "Import Wallet"
  → Bot prompts for private key
  → User sends text message with key
  → index.js text handler detects private key format
  → wallet.js: importWallet(userId, privateKey)
  → new ethers.Wallet(privateKey)
  → Store in userSessions Map
  → ss58.js: evmToSS58(address)
  → Display both addresses
  → Show main menu
\`\`\`

### Swap Flow
\`\`\`
User clicks "Swap"
  → swap.js: handleSwapStart()
  → Store session: { step: 'select_from', ... }
  → Show token selection keyboard
  → User picks FROM token
  → swap.js: handleTokenSelection()
  → Update session: { step: 'select_to', fromToken: {...} }
  → Show token selection keyboard
  → User picks TO token
  → Update session: { step: 'enter_amount', ... }
  → Prompt for amount
  → User types amount (text message)
  → swap.js: handleSwapAmountInput()
  → contracts.js: getRouterContract().getAmountsOut()
  → Display preview + confirmation
  → User clicks "Confirm"
  → swap.js: handleSwapConfirm()
  → wallet.js: getWalletSigner() → ethers.Wallet with provider
  → If token swap: approve() first
  → Execute swap: swapExactTokensForTokens() / swapExactETHForTokens() / swapExactTokensForETH()
  → Wait for receipt
  → Display success with tx hash
  → Clear swap session
\`\`\`

### Balance Check
\`\`\`
User clicks "Check Balance"
  → balance.js: handleBalance()
  → wallet.js: getWalletSession(userId) → get address
  → contracts.js: getProvider()
  → provider.getBalance(address) → native balance
  → Loop through tokens:
    → getTokenContract(address, provider)
    → contract.balanceOf(address)
    → formatTokenAmount(balance, decimals)
  → Display all balances
\`\`\`

### Staking
\`\`\`
User clicks "Stake"
  → staking.js: handleStakeMenu()
  → Show staking options
  → User picks "Stake tPOT"
  → staking.js: handleStakeDeposit()
  → Store session: { action: 'deposit', step: 'amount' }
  → Prompt for amount
  → User types amount (text message)
  → staking.js: handleStakeAmountInput()
  → Display confirmation
  → User clicks "Confirm"
  → staking.js: handleStakeDepositConfirm()
  → contracts.js: getStakingContract(signer)
  → contract.stake(amount)
  → Wait for receipt
  → Display success
  → Clear staking session
\`\`\`

## Session Storage

**Current**: In-memory JavaScript `Map`

\`\`\`javascript
// src/utils/wallet.js
const userSessions = new Map();

userSessions.set(userId, {
  privateKey: '0x...',
  address: '0x...',
  createdAt: timestamp
});
\`\`\`

**Production**: Replace with Redis/database

\`\`\`javascript
// Example with Redis
import Redis from 'ioredis';
const redis = new Redis();

async function createWallet(userId) {
  const wallet = ethers.Wallet.createRandom();
  
  await redis.hset(\`user:\${userId}\`, {
    privateKey: encrypt(wallet.privateKey), // Encrypt!
    address: wallet.address,
    createdAt: Date.now()
  });
  
  await redis.expire(\`user:\${userId}\`, 3600); // 1 hour session
  
  return wallet;
}
\`\`\`

## Key Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| \`telegraf\` | Telegram Bot API framework | ^4.16.3 |
| \`ethers\` | Ethereum library (works with any EVM) | ^6.13.0 |
| \`@polkadot/util-crypto\` | SS58 encoding for substrate addresses | ^12.6.2 |
| \`@polkadot/util\` | Low-level utilities (hexToU8a, u8aConcat) | ^12.6.2 |
| \`dotenv\` | Environment variable loader | ^16.4.5 |

## Environment Variables

\`\`\`env
# Bot
BOT_TOKEN=                        # From @BotFather

# Network
RPC_URL=https://test-evm-rpc-v3.portaldot.dev
CHAIN_ID=420420777

# Contracts
ROUTER_ADDRESS=0xc17510Df29ae5E4C6C2A46CCB03197edd0963f2B
FACTORY_ADDRESS=0xC631805C297c4233B33c30aF91245058902C1D18
WPOT_ADDRESS=0xf67cE92096E4E171060B71bF0cca0DA9f9548c03
STAKING_ADDRESS=0xC3A38DEb577a345900B7F2d903faDC2E4328D831
FAUCET_ADDRESS=0x2A9DFCC235d7169a9C0817eE0e27e51A6df95be0

# Test Tokens
PUSDT_ADDRESS=0xe0114Adc0a2072B602C645f5a07EeFA1eaDBDbc2
PDAI_ADDRESS=0x83DF1D2fD7E110c93234911E1798A6415F536D96
PWBTC_ADDRESS=0x35fdB379dd79c8D1AbaB5ed65192cfc0F0ec7bb2
PLINK_ADDRESS=0xDFCd9E24Bc91b4886CDF773944C2FC311ea9e766
\`\`\`

## Next Steps

1. **Copy `.env.example` to `.env`**
2. **Get bot token from [@BotFather](https://t.me/BotFather)**
3. **Run `npm install`**
4. **Run `npm start`**
5. **Message your bot `/start`**

For production deployment, see the Production Checklist in README.md.
