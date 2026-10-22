/**
 * /api/faucet  —  Gasless relay for tPotFaucet
 * ─────────────────────────────────────────────────────────────────────────
 * This Vercel serverless function holds a pre-funded relay wallet and calls
 * tPotFaucet.claim(recipient) on behalf of users who have zero tPOTv3 gas.
 *
 * The user just POSTs { recipient: "0x..." } — no wallet, no signing, no gas.
 *
 * Setup (one-time):
 *   1. Create a fresh wallet for the relay (never use your main wallet).
 *   2. Send it a small amount of tPOTv3 for gas (0.01 tPOTv3 = thousands of txs).
 *   3. In Vercel → Project Settings → Environment Variables add:
 *        RELAY_PRIVATE_KEY  =  <private key WITHOUT 0x prefix>
 *   4. Redeploy.
 */

import { ethers } from 'ethers';

const RPC_URL       = 'https://test-evm-rpc-v3.portaldot.dev';
const FAUCET_ADDR   = '0x2A9DFCC235d7169a9C0817eE0e27e51A6df95be0';
const GAS_PRICE     = 100000n;   // Portaldot V3 required gas price
const GAS_LIMIT     = 120000n;

const FAUCET_ABI = [
  'function claim(address payable recipient) external',
  'function cooldownRemaining(address addr) external view returns (uint256)',
  'function poolBalance() external view returns (uint256)',
];

export default async function handler(req, res) {
  // ── CORS (frontend origin calls this) ────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  // ── Validate input ────────────────────────────────────────────────────
  const { recipient } = req.body || {};
  if (!recipient || !ethers.isAddress(recipient)) {
    return res.status(400).json({ error: 'Invalid recipient address' });
  }

  // ── Relay wallet ──────────────────────────────────────────────────────
  const relayKey = process.env.RELAY_PRIVATE_KEY;
  if (!relayKey) {
    return res.status(503).json({
      error: 'Relay not configured — add RELAY_PRIVATE_KEY to Vercel environment variables',
    });
  }

  try {
    const provider    = new ethers.JsonRpcProvider(RPC_URL);
    const relayWallet = new ethers.Wallet(relayKey, provider);
    const faucet      = new ethers.Contract(FAUCET_ADDR, FAUCET_ABI, relayWallet);

    // ── Pre-flight checks (read-only, free) ───────────────────────────
    const [cooldown, poolBal, relayBal] = await Promise.all([
      faucet.cooldownRemaining(recipient),
      faucet.poolBalance(),
      provider.getBalance(relayWallet.address),
    ]);

    if (cooldown > 0n) {
      const h = Math.floor(Number(cooldown) / 3600);
      const m = Math.floor((Number(cooldown) % 3600) / 60);
      return res.status(429).json({
        error: `Cooldown active — eligible in ${h}h ${m}m`,
        cooldownRemaining: Number(cooldown),
      });
    }

    if (poolBal < ethers.parseEther('1')) {
      return res.status(503).json({ error: 'Faucet pool is empty — please donate to replenish' });
    }

    if (relayBal < ethers.parseEther('0.0001')) {
      return res.status(503).json({ error: 'Relay wallet low on gas — please contact the team' });
    }

    // ── Send the claim transaction ────────────────────────────────────
    const tx = await faucet.claim(recipient, {
      gasPrice: GAS_PRICE,
      gasLimit: GAS_LIMIT,
    });
    const receipt = await tx.wait();

    return res.status(200).json({
      success:   true,
      hash:      receipt.hash,
      recipient,
      amount:    '1',
    });

  } catch (err) {
    console.error('[tPotFaucet relay] error:', err);
    const raw = err.reason || err.message || '';
    const msg = raw.includes('cooldown') ? 'Cooldown still active — wait 72 hours'
              : raw.includes('empty')    ? 'Faucet pool is empty'
              : raw.includes('transfer') ? 'Transfer failed — pool may be empty'
              : 'Relay error — please try again';
    return res.status(500).json({ error: msg });
  }
}
