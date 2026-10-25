# Cloud Hosting Options (Free Tier)

If you want to host the bot on a remote server instead of your PC.

---

## Option A: Railway.app (Recommended) ⭐

### Free Tier
- ✅ $5 free credit/month
- ✅ Enough for a small bot (24/7)
- ✅ Auto-deploy from GitHub
- ✅ Free custom domain

### Setup Steps

1. **Prepare your code:**
   ```bash
   cd C:\Users\juned\Desktop\swap\swap\telegram-bot
   git add .
   git commit -m "Add Telegram bot"
   git push
   ```

2. **Go to Railway:**
   - Visit: https://railway.app
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your PortalSwap repo

3. **Configure:**
   - Click "Variables"
   - Add all variables from your `.env`:
     ```
     BOT_TOKEN=your_token_here
     PORTALDOT_EVM_RPC=https://test-evm-rpc-v3.portaldot.dev
     PORTALDOT_CHAIN_ID=420420777
     ```

4. **Deploy:**
   - Railway will auto-detect Node.js and run `npm start`
   - Wait 1-2 minutes
   - Check logs to confirm bot started

---

## Option B: Render.com

### Free Tier
- ✅ Completely free
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ 750 hours/month limit

### Setup

1. Visit: https://render.com
2. New → Background Worker
3. Connect GitHub repo
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables

**Note:** Free tier sleeps, so responses may be slow.

---

## Option C: Fly.io

### Free Tier
- ✅ 3 shared VMs free
- ✅ 160 GB transfer/month
- ✅ True 24/7 (no sleep)

### Setup

1. **Install Fly CLI:**
   ```bash
   powershell -Command "irm https://fly.io/install.ps1 | iex"
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Create app:**
   ```bash
   cd C:\Users\juned\Desktop\swap\swap\telegram-bot
   fly launch
   ```
   - Choose app name: `portalswap-bot`
   - Choose region closest to you
   - Don't deploy yet

4. **Set secrets:**
   ```bash
   fly secrets set BOT_TOKEN="your_token_here"
   fly secrets set PORTALDOT_EVM_RPC="https://test-evm-rpc-v3.portaldot.dev"
   fly secrets set PORTALDOT_CHAIN_ID="420420777"
   ```

5. **Deploy:**
   ```bash
   fly deploy
   ```

---

## Option D: Google Cloud Run (Always Free)

### Free Tier
- ✅ 2 million requests/month
- ✅ 180,000 vCPU-seconds/month
- ⚠️ Requires credit card

### Setup

Too complex for a quick guide, but possible. Railway or Fly.io are simpler.

---

## Comparison

| Service  | 24/7 | Free Tier | Easy Setup | Best For |
|----------|------|-----------|------------|----------|
| PM2 (local) | ✅ | ✅ (local) | ⭐⭐⭐ | Your own PC |
| Railway  | ✅ | $5/mo | ⭐⭐⭐ | Quick cloud deploy |
| Fly.io   | ✅ | ✅ | ⭐⭐ | Free 24/7 cloud |
| Render   | ❌ (sleeps) | ✅ | ⭐⭐⭐ | Testing only |

---

## My Recommendation

**For your use case (hackathon demo):**
1. **PM2 on your PC** (easiest, works now)
2. **Railway.app** if you need cloud (simple, reliable)
3. **Fly.io** if you want truly free cloud 24/7

Start with PM2 for now since your bot is already working locally.
