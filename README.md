# PortalSwap — AMM DEX on Portaldot V3 Testnet

> **Live at [portalswap.live](https://portalswap.live)**

PortalSwap is a fully on-chain, non-custodial AMM DEX built on the **Portaldot V3 Testnet**. It uses the constant-product formula (x·y = k) for permissionless swaps, LP provisioning, staking, and real-time pool analytics.

> Built for **Portaldot Hacker House 2026** — Ecosystem DApps Track

---

## Features

| Tab | What it does |
|---|---|
| **Swap** | Swap tPOTv3 ↔ ERC-20 or ERC-20 ↔ ERC-20 with a 0.3% fee and live price-impact preview |
| **Liquidity** | Add / remove liquidity, see your LP share, earn 0.3% trading fees |
| **Analytics** | Full-chain price history chart per pool (scans all Sync events from block 0), reserves, TVL |
| **Portfolio** | Token balances, LP positions, total portfolio value in tPOTv3 |
| **Tx History** | Real-time log of swaps, liquidity adds/removes, faucet claims — persists per wallet |
| **Stake** | Stake tPOTv3 to earn staking rewards via the PortalSwapStaking contract |
| **Faucet** | Mint pUSDT, pDAI, pWBTC, pLINK for free — no gas tricks needed |
| **Docs** | In-app contract addresses, AMM explainer, and network setup guide |

---

## Deployed Contracts (Portaldot V3 Testnet · chainId 420420777)

| Contract | Address |
|---|---|
| **WPOT** (Wrapped POT) | `0xf67cE92096E4E171060B71bF0cca0DA9f9548c03` |
| **PortalSwapFactory** | `0xC631805C297c4233B33c30aF91245058902C1D18` |
| **PortalSwapRouter** | `0xc17510Df29ae5E4C6C2A46CCB03197edd0963f2B` |
| **PortalSwapFaucet** | `0x2A9DFCC235d7169a9C0817eE0e27e51A6df95be0` |
| **PortalSwapStaking** | `0xC3A38DEb577a345900B7F2d903faDC2E4328D831` |

### Test Tokens

| Symbol | Name | Address | Decimals |
|---|---|---|---|
| **pUSDT** | Portal USDT | `0xe0114Adc0a2072B602C645f5a07EeFA1eaDBDbc2` | 6 |
| **pDAI** | Portal DAI | `0x83DF1D2fD7E110c93234911E1798A6415F536D96` | 18 |
| **pWBTC** | Portal Wrapped BTC | `0x35fdB379dd79c8D1AbaB5ed65192cfc0F0ec7bb2` | 8 |
| **pLINK** | Portal LINK | `0xDFCd9E24Bc91b4886CDF773944C2FC311ea9e766` | 18 |

---

## Network

| Property | Value |
|---|---|
| Network Name | PortaldotV3 Testnet |
| RPC URL | `https://test-evm-rpc-v3.portaldot.dev` |
| Chain ID | `420420777` |
| Currency Symbol | `tPOTv3` |
| EVM Version | `paris` (no PUSH0 — WASM EVM) |

The app auto-prompts MetaMask / OKX Wallet to add and switch to this network on first connect.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.20 (evmVersion: paris) |
| Contract Framework | Hardhat |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + CSS custom properties |
| Web3 | ethers.js v6 |
| Charts | lightweight-charts v4 |
| Toasts | react-hot-toast |
| Hosting | Vercel — auto-deploy from `main` branch |
| Domain | portalswap.live (registered through 2027) |

---

## Project Structure

```
PortalSwap/
├── contracts/
│   ├── PortalSwapFactory.sol       # Pair registry + CREATE2 deployment
│   ├── PortalSwapPair.sol          # Core AMM (x·y=k, 0.3% fee, LP tokens)
│   ├── PortalSwapRouter.sol        # User entry-point: swap, addLiquidity, removeLiquidity
│   ├── PortalSwapLibrary.sol       # getAmountOut / getAmountIn helpers
│   ├── PortalSwapERC20.sol         # LP token + EIP-2612 permit
│   ├── WPOT.sol                    # Wrapped native token
│   ├── PortalSwapStaking.sol       # Single-asset tPOTv3 staking with rewards
│   ├── PortalSwapFaucet.sol        # Drips test tokens on demand
│   ├── interfaces/
│   └── tokens/
│       └── MockERC20.sol           # Mintable test ERC-20
├── frontend/
│   ├── index.html                  # Non-blocking font load, meta/OG tags
│   ├── vite.config.js              # Vendor chunk splitting, build config
│   └── src/
│       ├── App.jsx                 # Tab routing + React.lazy / Suspense
│       ├── index.css               # Design tokens, responsive breakpoints
│       ├── components/
│       │   ├── SwapCard.jsx
│       │   ├── LiquidityCard.jsx
│       │   ├── AnalyticsCard.jsx   # Full-chain Sync event scan, price chart
│       │   ├── PortfolioCard.jsx   # Balances, LP positions, real-time tx history
│       │   ├── StakeCard.jsx
│       │   ├── FaucetCard.jsx
│       │   ├── DocsCard.jsx
│       │   ├── Header.jsx
│       │   └── Footer.jsx
│       ├── hooks/
│       │   └── useWallet.js
│       └── utils/
│           ├── addresses.js        # All contract addresses + token list
│           └── abis.js
├── scripts/
│   ├── deploy.js                   # Deploy WPOT + Factory + Router + test tokens
│   ├── deploy-faucet.js            # Deploy PortalSwapFaucet separately
│   ├── deploy-staking.js           # Deploy PortalSwapStaking separately
│   └── seed.js                     # Seed demo pools with liquidity
├── test/                           # Hardhat contract tests
├── hardhat.config.js
├── SETUP.md                        # Step-by-step first-time deployer guide
└── README.md
```

---

## Quick Start — Use the Live App

Just open **[portalswap.live](https://portalswap.live)** in any browser, connect MetaMask or OKX Wallet, and the app will prompt you to add the Portaldot V3 Testnet automatically.

To get test tokens: use the **Faucet** tab inside the app — no Discord or external faucet needed.

---

## Local Development

The contracts are already deployed — you only need to run the frontend locally.

### 1. Clone and install

```bash
git clone https://github.com/Junedkhan121/PortalSwap.git
cd PortalSwap/frontend
npm install
```

### 2. Start dev server

```bash
npm run dev
# → http://localhost:3000
```

### 3. Build for production

```bash
npm run build
# Output: frontend/dist/
```

---

## Re-deploying Contracts (optional)

Only needed if you want a fresh deployment. The live site already has all contracts deployed and pools seeded.

### Prerequisites

- Node.js ≥ 18
- Deployer wallet funded with tPOTv3 for gas

```bash
# Install root dependencies
npm install

# Copy and fill in your deployer private key
cp .env.example .env
```

### Deploy core (WPOT + Factory + Router + test tokens)

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network portaldotTestnet
```

Paste the printed addresses into `frontend/src/utils/addresses.js`.

### Deploy faucet

```bash
npx hardhat run scripts/deploy-faucet.js --network portaldotTestnet
```

Update `ADDRESSES.tPotFaucet` in `addresses.js`.

### Deploy staking

```bash
npx hardhat run scripts/deploy-staking.js --network portaldotTestnet
```

Update `ADDRESSES.tPotStaking` in `addresses.js`.

### Seed demo pools

```bash
npx hardhat run scripts/seed.js --network portaldotTestnet
```

Creates tPOTv3/pUSDT, tPOTv3/pDAI, and pUSDT/pDAI pools so the analytics chart and swap UI show real data on first load.

### Run contract tests

```bash
npm test
```

Six tests cover: pair creation, liquidity minting, 0.3% swap fee, liquidity removal, native POT swaps via WPOT, and k-invariant revert. All run on Hardhat's in-memory network — no testnet funds needed.

---

## How the AMM Works

### Constant Product Formula

```
x · y = k
```

When you swap token A for token B, reserves shift so the product stays constant. The 0.3% fee is taken from the input amount before the invariant check, so fees accumulate inside the pool for LPs.

**Swap output:**

```
amountOut = (amountIn × 997 × reserveOut) / (reserveIn × 1000 + amountIn × 997)
```

### Liquidity Provision

Deposit equal value of two tokens → receive LP tokens representing your pool share. Withdraw any time to reclaim tokens plus accrued fees.

### Staking

Deposit tPOTv3 into `PortalSwapStaking` to earn staking rewards. Withdraw principal + rewards at any time.

---

## Security

- Reentrancy lock on all state-changing pair functions
- Solidity 0.8.x built-in overflow/underflow protection
- CREATE2 deterministic pair addresses (no front-running pair creation)
- EIP-2612 permit on LP tokens (gasless approvals)
- Minimum liquidity permanently locked on first deposit (prevents first-depositor attack)
- EVM version `paris` — no PUSH0 opcode (required for Portaldot WASM-EVM compatibility)

---

## Frontend Performance

- **Lazy loading** — SwapCard is the only eagerly-loaded component; all other tabs load on demand via `React.lazy` + `Suspense`
- **Vendor chunk splitting** — separate cache chunks for `react`, `ethers`, `lightweight-charts`, `react-hot-toast`
- **Non-blocking fonts** — Google Fonts loaded with `media="print"` swap pattern; never delays first paint
- **DNS prefetch** for RPC endpoint on page load
- **Mobile responsive** — fluid font size, 44 px touch targets, horizontal-scroll tab nav, clamp()-based spacing

---

## Deployment (Vercel)

- Vercel project: `portalswap` → auto-deploys from `main` branch
- Root Directory in Vercel set to `frontend`
- `frontend/vercel.json` handles SPA fallback routing
- Custom domain: `portalswap.live` (DNS A record → Vercel)

To deploy a new version:

```bash
git add .
git commit -m "your message"
git push origin main
# Vercel picks it up automatically — no manual deploy needed
```

---

## Hackathon Submission

**Event:** Portaldot Hacker House 2026
**Track:** Ecosystem DApps
**Live URL:** https://portalswap.live
**Repo:** https://github.com/Junedkhan121/PortalSwap

Portaldot V3 features used: EVM contract execution, ERC-20 token standard, native token wrapping (WPOT ↔ tPOTv3), on-chain AMM liquidity pools, staking rewards contract.

---

## License

MIT
