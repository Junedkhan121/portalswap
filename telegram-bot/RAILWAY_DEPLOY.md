# Railway Deployment Guide

## Quick Deploy (5 minutes)

### Step 1: Push to GitHub

```bash
cd C:\Users\juned\Desktop\swap\swap
git add telegram-bot/
git commit -m "Add Telegram bot for Railway"
git push origin main
```

### Step 2: Deploy on Railway

1. Go to: https://railway.app
2. Click **"Login"** → Sign in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your **PortalSwap** repository
5. Railway will ask which folder to deploy:
   - Select **`telegram-bot`** folder (or set root path to `/telegram-bot`)

### Step 3: Add Environment Variables

In Railway dashboard:

1. Click **"Variables"** tab
2. Click **"Add Variable"** for each:

```env
BOT_TOKEN=your_bot_token_from_botfather
PORTALDOT_EVM_RPC=https://test-evm-rpc-v3.portaldot.dev
PORTALDOT_CHAIN_ID=420420777
WPOT_ADDRESS=0xf67cE92096E4E171060B71bF0cca0DA9f9548c03
ROUTER_ADDRESS=0xc17510Df29ae5E4C6C2A46CCB03197edd0963f2B
STAKING_ADDRESS=0xC3A38DEb577a345900B7F2d903faDC2E4328D831
PUSDT_ADDRESS=0xB25a66C8B96257df97f9E1d41d62a0f65e43e5c6
PDAI_ADDRESS=0x32Bf9c68E92e9cB5AA3e4E7dF0B27bF4B02E7E2E
PWBTC_ADDRESS=0x58b05cA3E3c8CC35F86AE3aB7d1F5FA77b4ca4E3
PLINK_ADDRESS=0x9d4f25B7C7dC90e9d8C4B2bB5d5C4a3b8c5aA3E4
```

### Step 4: Configure Root Path (if Railway deploys the whole repo)

If Railway didn't detect the `telegram-bot` folder:

1. Go to **"Settings"** tab
2. Find **"Root Directory"**
3. Set to: `telegram-bot`
4. Click **"Save"**
5. Railway will auto-redeploy

### Step 5: Check Logs

1. Click **"Deployments"** tab
2. Click the latest deployment
3. Watch logs → should see:
   ```
   ✅ Bot started successfully!
   Bot username: @YourBotName
   ```

---

## Monitoring

**View Logs:**
- Railway dashboard → Deployments → Click latest → View logs

**Check if Bot is Up:**
- Open Telegram
- Send `/start` to your bot
- Should respond immediately

**Restart Bot:**
- Railway dashboard → Click "..." menu → "Restart"

---

## Cost

- **Free tier**: $5 credit/month
- **Bot usage**: ~$2-3/month (plenty left over)
- **If you run out**: Add a credit card for $5/month (still very cheap)

---

## Troubleshooting

**Bot doesn't start:**
```bash
# Check Railway logs for errors
# Most common: missing BOT_TOKEN variable
```

**"Cannot find module":**
```bash
# Railway dashboard → Settings → Build Command
# Set to: npm install --production
```

**Bot responds slowly:**
```bash
# Normal for free tier (shared CPU)
# Upgrade to Hobby plan ($5/mo) for dedicated resources
```

---

## Alternative: Fly.io (100% Free)

If you want truly free 24/7:

### Setup Fly.io

1. **Install Fly CLI:**
   ```powershell
   powershell -Command "irm https://fly.io/install.ps1 | iex"
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Create Dockerfile** (already done, see below)

4. **Deploy:**
   ```bash
   cd C:\Users\juned\Desktop\swap\swap\telegram-bot
   fly launch --name portalswap-bot --region sin
   ```

5. **Set secrets:**
   ```bash
   fly secrets set BOT_TOKEN="your_token"
   fly secrets set PORTALDOT_EVM_RPC="https://test-evm-rpc-v3.portaldot.dev"
   fly secrets set PORTALDOT_CHAIN_ID="420420777"
   # ... add all other env vars
   ```

6. **Deploy:**
   ```bash
   fly deploy
   ```

---

## Comparison

| Service | Cost | Setup Time | 24/7 | Sleeps? | Best For |
|---------|------|------------|------|---------|----------|
| **Railway** | $5/mo free credit | 5 min | ✅ | ❌ | Easiest, recommended |
| **Fly.io** | Free forever | 10 min | ✅ | ❌ | Truly free |
| **Render** | Free | 3 min | ✅ | ✅ (after 15 min) | Not good for bots |
| **PM2 (local)** | Free | 2 min | ❌ | N/A | Only when PC is on |

---

## My Recommendation

**Use Railway.app** — it's the perfect balance of:
- Easy setup (5 minutes)
- Free tier is enough
- No sleep/downtime
- Great dashboard
- Auto-deploy on git push

Start with Railway. If you run out of free credit, switch to Fly.io (takes 10 min to migrate).
