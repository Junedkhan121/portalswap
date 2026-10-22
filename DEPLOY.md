# Deploying PortalSwap to portalswap.live

The frontend is a static Vite/React bundle — no server, no database. It reads
contract addresses from `frontend/src/utils/addresses.js` at build time and talks
to the Portaldot RPC directly from the browser. So deployment is just
"build the bundle, upload it, point the domain at it".

---

## Part 1 — Buy the domain

1. Go to the registrar checkout and **look at the renewal price**, not just the
   first-year price. `.live` renews around $25–33/yr. The $2 is year one only.
2. Enable **WHOIS privacy** (should be free) so your name/address isn't public.
3. Skip every upsell — hosting, SSL, email, "premium DNS". You need none of them.
4. After purchase, find the **DNS management** panel. You'll come back to it in
   Part 3.

---

## Part 2 — Deploy to Vercel

### 2a. Push the repo first

The deployment pulls from GitHub, so the latest code must be pushed.

```bash
cd PortalSwap

git add .
git commit -m "chore: deployment config + UI fixes"
git push
```

Verify the files that matter are on GitHub:
`vercel.json` (repo root), `.nvmrc`, `frontend/package.json`.

### 2b. Import the project

1. Sign in at <https://vercel.com> with GitHub.
2. **Add New → Project** → pick the `PortalSwap` repo → **Import**.
3. Configure the build:

   | Setting | Value |
   |---|---|
   | Framework Preset | **Vite** (or Other) |
   | Root Directory | **leave as `.` (repo root)** |
   | Build Command | leave default — `vercel.json` supplies it |
   | Output Directory | leave default — `vercel.json` supplies it |
   | Install Command | leave default |

   `vercel.json` already contains:

   ```
   buildCommand:     npm --prefix frontend install && npm --prefix frontend run build
   outputDirectory:  frontend/dist
   ```

   That one file handles the subfolder problem, so you do **not** need to set
   Root Directory to `frontend`. Setting it to `frontend` *and* keeping this
   `vercel.json` will break the build (paths get doubled). Pick one: root
   directory `.` with the config file, which is what's committed.

4. **Environment variables:** none needed. Contract addresses are compiled into
   the bundle from `addresses.js`, and the RPC URL is public.

5. Click **Deploy**. First build takes ~1–2 minutes.

You'll get a temporary URL like `portalswap-xxxx.vercel.app`. Open it and check
the site loads and the wallet connects. Fix any problem *here*, before touching
the domain.

---

## Part 3 — Attach portalswap.live

1. In the Vercel project → **Settings → Domains**.
2. Type `portalswap.live` → **Add**.
3. Also add `www.portalswap.live` and set it to **redirect** to the apex domain.
4. Vercel now shows the exact DNS records to create. For an apex domain it gives
   you an **A record**:

   | Type | Name | Value |
   |---|---|---|
   | A | `@` | `76.76.21.21` |

   For the `www` subdomain it gives a **CNAME**:

   | Type | Name | Value |
   |---|---|---|
   | CNAME | `www` | `cname.vercel-dns.com` |

   **Always copy the values Vercel displays** — they can change. Don't trust
   these two rows over what the dashboard says.

5. In your registrar's DNS panel, add those records. If the registrar
   pre-created an `A @` record pointing at a parking page, **delete or edit it** —
   two A records on the apex will make the domain resolve unpredictably.

6. Go back to Vercel and click **Refresh** on the domain. Propagation is usually
   a few minutes; it can take up to a few hours.

7. Vercel issues a free Let's Encrypt certificate automatically once DNS
   resolves. The domain shows **Valid Configuration** when it's done.

---

## Part 4 — Verify after it's live

Check these in order — each one catches a distinct failure:

1. **`https://portalswap.live` loads** and the padlock icon is present.
   If you get a certificate warning, DNS hasn't propagated yet — wait.
2. **`http://` redirects to `https://`** automatically. Vercel does this by default.
3. **Hard-refresh (Ctrl+Shift+R)** and confirm the swap card renders. A blank
   page here means a JS error — open DevTools → Console.
4. **Connect a wallet.** This is the real test: wallet extensions only inject on
   HTTPS origins, so this is the step that proves the deploy. Approve the
   network switch prompt if it appears.
5. **Run a tiny swap** (e.g. 0.01 tPOTv3) end to end.
6. **Open it on your phone** — the mobile layout is a separate code path.

---

## Things that could bite you

**The RPC is not proven to allow browser requests.** Blockchains often restrict
which origins may call their RPC. From this sandbox the endpoint replied
`403 blocked-by-allowlist`, so I couldn't confirm CORS behaviour. If the live
site loads but balances spin or the quote never appears, open DevTools →
Network, filter to the RPC request, and look for a CORS error. The fix is a
proxy (a Vercel rewrite that forwards `/rpc` to the endpoint), which makes all
calls same-origin.

**Vercel free tier is for non-commercial use.** Fine for a hackathon demo.
If this ever becomes a real product, move to a paid plan or another host.

**Nothing is on-chain-specific to the domain.** You can change hosts or domains
freely without redeploying contracts — the contracts don't know or care what
URL the frontend is served from.

---

## Routine redeploys

After the first setup, every `git push` to `main` triggers a production deploy
automatically. Pull requests get their own preview URL, which is handy for
showing judges a work-in-progress without touching the live site.

To redeploy the same commit without a new push: **Deployments → ⋯ → Redeploy**.

---

## Optional: custom 404

Not needed. `vercel.json` rewrites every path to `index.html`, which is correct
for a single-page app and also prevents 404s if you later add client-side routes.
