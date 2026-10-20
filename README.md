# PortalSwap — AMM DEX on Portaldot V3.0

PortalSwap is a decentralized exchange (DEX) built on the **Portaldot Network V3.0 Testnet** featuring an automated market maker (AMM) based on the constant product formula (x * y = k). It enables permissionless token swaps, liquidity provision, and real-time pool analytics.

> Built for the **Portaldot Hacker House 2026** — Ecosystem DApps Track

## Features

- **Token Swap** — Swap between ERC-20 tokens and native tPOTv3 with a 0.3% fee
- **Liquidity Pools** — Add and remove liquidity to earn trading fees
- **Price Charts** — Real-time token price visualization using lightweight-charts
- **Pool Analytics** — View pool reserves, TVL, and all active pairs
- **Testnet Faucet** — Mint test tokens (pUSDT, pDAI, pWBTC, pLINK) for free
- **Wallet Support** — MetaMask, OKX Wallet, and any EVM-compatible wallet
- **Auto Network Switch** — Automatically prompts to add/switch to Portaldot V3 Testnet

## Architecture

```
PortalSwap/
├── contracts/            # Solidity smart contracts
│   ├── PortalSwapFactory.sol    # Creates and tracks trading pairs
│   ├── PortalSwapPair.sol       # Core AMM pair with reserves and swap logic
│   ├── PortalSwapRouter.sol     # User-facing entry point for swaps & liquidity
│   ├── PortalSwapLibrary.sol    # Price calculation helpers
│   ├── PortalSwapERC20.sol      # LP token with EIP-2612 permit
│   ├── WPOT.sol                 # Wrapped POT (WETH equivalent)
│   ├── interfaces/              # Contract interfaces
│   └── tokens/
│       └── MockERC20.sol        # Test ERC-20 with public faucet
├── frontend/             # React + Vite frontend
│   ├── src/
│   │   ├── components/          # UI components (Swap, Liquidity, Analytics, Faucet)
│   │   ├── hooks/               # React hooks (useWallet, useContract)
│   │   └── utils/               # ABIs, addresses, network config
│   └── ...
├── scripts/              # deploy.js, seed.js (deployment + demo liquidity)
├── test/                 # Contract tests
├── hardhat.config.js     # Hardhat config with Portaldot V3 network
├── SETUP.md              # Step-by-step guide written for first-time deployers
└── README.md
```

> New to Solidity or Hardhat? Follow **[SETUP.md](SETUP.md)** instead of this file — it walks through every command in order, including creating a throwaway deployer wallet.

## Tech Stack

| Layer          | Technology                    |
| -------------- | ----------------------------- |
| Smart Contracts| Solidity 0.8.20               |
| Framework      | Hardhat                       |
| Frontend       | React 18 + Vite               |
| Styling        | Tailwind CSS                  |
| Web3           | ethers.js v6                  |
| Charts         | lightweight-charts            |
| Network        | Portaldot V3.0 Testnet (EVM)  |

## Network Details

| Property         | Value                                    |
| ---------------- | ---------------------------------------- |
| Network Name     | PortaldotV3 Testnet                      |
| RPC URL          | https://test-evm-rpc-v3.portaldot.dev    |
| Chain ID         | 420420777                                |
| Currency Symbol  | tPOTv3                                   |
| Block Explorer   | —                                        |

## Quick Start

### Prerequisites

- Node.js >= 18
- A wallet with testnet tPOTv3 tokens (join [Portaldot Discord](https://discord.gg/portaldot) for faucet)

### 1. Install Dependencies

```bash
# Root — smart contracts
npm install

# Frontend
cd frontend && npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your deployer private key
```

### 3. Compile Contracts

```bash
npx hardhat compile
```

### 4. Deploy to Portaldot V3 Testnet

```bash
npx hardhat run scripts/deploy.js --network portaldotTestnet
```

This deploys: WPOT, Factory, Router, and 4 test tokens (pUSDT, pDAI, pWBTC, pLINK).

Copy the printed addresses into `frontend/src/utils/addresses.js`.

### 5. Seed Demo Pools (optional but recommended)

```bash
npx hardhat run scripts/seed.js --network portaldotTestnet
```

Creates three pools with liquidity — tPOTv3/pUSDT, tPOTv3/pDAI and pUSDT/pDAI — so the swap UI and analytics charts show real data on first load. Without this the DEX works, but every chart is empty until you add liquidity yourself.

### 6. Run the Contract Tests

```bash
npm test
```

Six tests cover pair creation, liquidity minting, the 0.3% swap fee, liquidity removal, native POT swaps through WPOT, and the k-invariant revert. They run on Hardhat's in-memory network — no testnet funds needed.

### 7. Start Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3000, connect your wallet, and start swapping!

## How It Works

### Constant Product AMM

PortalSwap uses the **x * y = k** invariant. When a user swaps token A for token B, the product of reserves must remain constant (minus the 0.3% fee).

**Swap formula:**
```
amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
```

### Liquidity Provision

Liquidity providers deposit equal value of two tokens and receive LP tokens representing their pool share. They earn 0.3% of all trades proportional to their share.

### Fee Structure

- **0.3%** trading fee on each swap
- 100% of fees go to liquidity providers (protocol fee can be enabled)

## Contract Security

- Reentrancy protection via lock modifier
- Overflow protection (Solidity 0.8+)
- CREATE2 deterministic pair addresses
- EIP-2612 permit for gasless LP token approvals
- Minimum liquidity lock to prevent first-depositor attack

## Hackathon Submission

**Track:** Ecosystem DApps

**Portaldot V3.0 features used:**
- EVM contract execution
- ERC-20 token standard
- Native token wrapping (WPOT)

## License

MIT
