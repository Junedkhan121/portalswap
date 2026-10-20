# Setup Guide — Zero to Deployed

This guide assumes you have never deployed a smart contract. Follow it top to bottom.

## What you need

1. **Node.js 18 or newer** — download from https://nodejs.org (pick the LTS version). After installing, open a terminal and run `node --version` to confirm.
2. **A wallet** — MetaMask (https://metamask.io) or OKX Wallet. Both work.
3. **Testnet tokens** — tPOTv3 is the native gas token. Join the [Portaldot Discord](https://discord.gg/portaldot) and use the faucet channel. You need a small amount just for gas.

## Step 1 — Add the network to your wallet

Open MetaMask → click the network dropdown → **Add network** → **Add a network manually**, then enter:

| Field | Value |
|---|---|
| Network name | PortaldotV3 Testnet |
| RPC URL | https://test-evm-rpc-v3.portaldot.dev |
| Chain ID | 420420777 |
| Currency symbol | tPOTv3 |
| Block explorer | leave blank |

Save it and switch to that network.

## Step 2 — Create a deployer wallet

Do **not** use your main wallet. Create a fresh account in MetaMask just for this project, and fund it with testnet tPOTv3. Then export its private key:

MetaMask → click the three dots → **Account details** → **Show private key** → enter your password → copy it.

## Step 3 — Install the project

Open a terminal in the `PortalSwap` folder and run:

```bash
npm install
cd frontend
npm install
cd ..
```

This takes a few minutes.

## Step 4 — Put your private key in `.env`

In the `PortalSwap` folder, copy `.env.example` to a new file called `.env`, then open it and replace the placeholder:

```
PRIVATE_KEY=abc123yourkeywithoutthe0xprefix
```

Important: paste it without the leading `0x`. Never commit this file — `.gitignore` already excludes it.

## Step 5 — Compile

```bash
npx hardhat compile
```

You should see `Compiled N Solidity files successfully`. If you get errors, check that you're in the `PortalSwap` folder (the one containing `hardhat.config.js`).

## Step 6 — Deploy

```bash
npx hardhat run scripts/deploy.js --network portaldotTestnet
```

This prints addresses for WPOT, Factory, Router, pUSDT, pDAI, pWBTC, and pLINK, and writes them to `deployed-addresses.json`. Keep the terminal output — you need these addresses in the next step.

## Step 7 — Connect the frontend to your contracts

Open `frontend/src/utils/addresses.js`. Replace these three lines with the addresses from step 6:

```js
export const ADDRESSES = {
  WPOT: "0x...",     // paste WPOT address
  Factory: "0x...",  // paste Factory address
  Router: "0x...",   // paste Router address
};
```

Then in the `TOKENS` array below, paste the token addresses into the `pUSDT`, `pDAI`, `pWBTC`, and `pLINK` entries (`address:` field). Leave `tPOTv3` and `WPOT` alone — those are handled automatically.

## Step 8 — (Recommended) Seed initial liquidity

An empty DEX can't be demoed. This script adds three pools using your deployer account's test tokens:

```bash
npx hardhat run scripts/seed.js --network portaldotTestnet
```

The two POT pools need real tPOTv3, so the script reads your balance first and spends at most 60 tPOTv3 (30 per pool), always keeping 0.5 POT back for gas. If the faucet only gave you a little, it scales the pools down; if you want deeper pools, ask for more from the faucet and run:

```bash
SEED_POT=200 npx hardhat run scripts/seed.js --network portaldotTestnet
```

The third pool (pUSDT/pDAI) is token-only, so it gets created even with barely any POT. On Windows PowerShell the prefix syntax differs slightly — use `$env:SEED_POT="200"; npx hardhat run scripts/seed.js --network portaldotTestnet`.

## Step 9 — Run the app

```bash
cd frontend
npm run dev
```

Open http://localhost:3000. Connect your wallet. If it doesn't switch automatically, click **Wrong Network** in the header.

## Step 10 — Try it

1. Go to the **Faucet** tab and mint some pUSDT and pDAI.
2. Go to **Swap**, enter an amount, and swap.
3. Go to **Liquidity**, add a pair, then remove part of it.
4. Check **Analytics** to see your pools listed with a price chart.

## Common problems

**"insufficient funds for gas"** — your deployer wallet has no tPOTv3. Get some from Discord.

**"nonce too low" or a stuck transaction** — MetaMask → Settings → Advanced → Clear activity tab data, then retry.

**Frontend shows "Deploy contracts first"** — you didn't paste the addresses into `addresses.js`, or you pasted them into the wrong fields.

**Swap fails with INSUFFICIENT_OUTPUT_AMOUNT** — the pool has no liquidity, or price moved past your slippage. Run `seed.js` or raise slippage in the gear icon.

**Wallet won't add the network** — add it manually using the table in Step 1 instead of letting the app prompt you.

## Deploying the frontend for the demo

The judges need a URL, not `localhost`. The easiest option:

1. Create a free account at https://vercel.com
2. Push this project to a GitHub repo (make sure `.env` is not included)
3. In Vercel, **Add New Project** → import the repo
4. Set **Root Directory** to `frontend`
5. Framework preset: Vite. Build command `npm run build`, output directory `dist`
6. Deploy

You get a public URL you can submit to DoraHacks.
