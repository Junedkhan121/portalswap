/**
 * /api/faucet  —  Gasless relay for tPotFaucet
 * ─────────────────────────────────────────────────────────────────────────
 * KEY FIX: We do NOT call tx.wait() — Vercel Hobby has a 10 s function
 * timeout and waiting for block confirmation exceeds it.  We send the tx
 * and return the hash immediately; the chain will mine it shortly after.
 */

import { ethers } from 'ethers';

const RPC_URL     = 'https://test-evm-rpc-v3.portaldot.dev';
const FAUCET_ADDR = '0x2A9DFCC235d7169a9C0817eE0e27e51A6df95be0';

const FAUCET_ABI = [
  'function claim(address payable recipient) external',
  'function cooldownRemaining(address addr) external view returns (uint256)',
  'function poolBalance() external view returns (uint256)',
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { recipient } = req.body || {};
  if (!recipient || !ethers.isAddress(recipient)) {
    return res.status(400).json({ error: 'Invalid recipient address' });
  }

  const relayKey = process.env.RELAY_PRIVATE_KEY;
  if (!relayKey) {
    return res.status(503).json({ error: 'Relay not configured — add RELAY_PRIVATE_KEY in Vercel env vars' });
  }

  try {
    const network     = new ethers.Network('portaldotV3', 420420777);
    const provider    = new ethers.JsonRpcProvider(RPC_URL, network, { staticNetwork: network });
    const relayWallet = new ethers.Wallet(relayKey, provider);
    const faucet      = new ethers.Contract(FAUCET_ADDR, FAUCET_ABI, relayWallet);

    // Pre-flight read-only checks — these are fast
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

    if (relayBal === 0n) {
      return res.status(503).json({ error: 'Relay wallet has no gas — please top it up' });
    }

    // Build the tx manually to completely bypass ethers v6 fee detection.
    // ethers v6 calls getFeeData() internally when populating a tx; on Portaldot
    // (Paris EVM, no EIP-1559) this throws "could not coalesce" before the tx is sent.
    // Encoding the calldata and signing the raw tx ourselves avoids that code path entirely.
    const iface = new ethers.Interface(FAUCET_ABI);
    const data  = iface.encodeFunctionData('claim', [recipient]);
    const nonce = await provider.getTransactionCount(relayWallet.address);

    const rawTx = {
      to:       FAUCET_ADDR,
      data,
      value:    0n,
      gasPrice: 100000n,
      gasLimit: 120000n,
      type:     0,
      nonce,
      chainId:  420420777n,
    };

    const signedTx = await relayWallet.signTransaction(rawTx);
    const response = await provider.broadcastTransaction(signedTx);

    return res.status(200).json({
      success:   true,
      hash:      response.hash,
      recipient,
      amount:    '1',
    });

  } catch (err) {
    // Surface the real error message — makes debugging much easier
    const raw  = err.reason || err.shortMessage || err.message || String(err);
    console.error('[tPotFaucet relay] raw error:', raw);

    const msg = raw.includes('cooldown')  ? 'Cooldown still active — wait 72 hours'
              : raw.includes('empty')     ? 'Faucet pool is empty'
              : raw.includes('low gas')   ? 'Relay wallet needs more tPOTv3 for gas'
              : raw.includes('nonce')     ? 'Nonce conflict — please retry in a moment'
              : raw.includes('coalesce')  ? 'RPC fee detection failed — retrying with legacy tx format'
              : raw.includes('TIMEOUT') || raw.includes('timeout') ? 'RPC timeout — please retry'
              : `Error: ${raw.slice(0, 200)}`;

    return res.status(500).json({ error: msg });
  }
}
