/**
 * /api/faucet  —  Gasless relay for tPotFaucet
 *
 * Uses raw fetch() for ALL RPC calls so ethers' provider layer (which throws
 * "could not coalesce error" on Portaldot's non-standard responses) is never
 * involved.  Ethers is only used for ABI encoding and transaction signing.
 */

import { ethers } from 'ethers';
import { blake2b } from '@noble/hashes/blake2b';

const RPC_URL     = 'https://test-evm-rpc-v3.portaldot.dev';
const FAUCET_ADDR = '0x2A9DFCC235d7169a9C0817eE0e27e51A6df95be0';
const CHAIN_ID    = 420420777;

const FAUCET_ABI = [
  'function claim(address payable recipient) external',
  'function cooldownRemaining(address addr) external view returns (uint256)',
  'function poolBalance() external view returns (uint256)',
];

// ── SS58 → EVM conversion (Portaldot prefix 42) ───────────────────────
const BASE58_ALPHA = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Decode(str) {
  let n = 0n;
  for (const c of str) {
    const idx = BASE58_ALPHA.indexOf(c);
    if (idx < 0) throw new Error(`Bad base58 char: ${c}`);
    n = n * 58n + BigInt(idx);
  }
  const bytes = [];
  while (n > 0n) { bytes.unshift(Number(n & 0xffn)); n >>= 8n; }
  for (const c of str) { if (c === '1') bytes.unshift(0); else break; }
  return new Uint8Array(bytes);
}

function ss58ToEvm(ss58) {
  const decoded = base58Decode(ss58); // 35 bytes: 1 prefix + 32 accountId + 2 checksum
  if (decoded.length !== 35) throw new Error('Bad SS58 length');
  // Verify checksum
  const payload = decoded.slice(0, 33);
  const pretext = new TextEncoder().encode('SS58PRE');
  const toHash = new Uint8Array(pretext.length + payload.length);
  toHash.set(pretext, 0);
  toHash.set(payload, pretext.length);
  const checksum = blake2b(toHash, { dkLen: 64 }).slice(0, 2);
  if (checksum[0] !== decoded[33] || checksum[1] !== decoded[34]) throw new Error('Bad SS58 checksum');
  // First 20 bytes of accountId32 (bytes 1-20) are the EVM address
  const evmBytes = decoded.slice(1, 21);
  return '0x' + Array.from(evmBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Accept SS58 (starts with "5") or 0x EVM address; always returns 0x EVM
function resolveRecipient(addr) {
  if (typeof addr !== 'string') throw new Error('Invalid address');
  if (addr.startsWith('5')) return ss58ToEvm(addr);
  if (ethers.isAddress(addr)) return addr;
  throw new Error('Invalid address — provide a Portaldot SS58 (5…) or EVM (0x…) address');
}

// ── Raw JSON-RPC helper (no ethers provider) ──────────────────────────
let _rpcId = 1;
async function rpc(method, params) {
  const res = await fetch(RPC_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ jsonrpc: '2.0', id: _rpcId++, method, params }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from RPC`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
  return json.result;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { recipient: rawRecipient } = req.body || {};
  if (!rawRecipient) {
    return res.status(400).json({ error: 'recipient is required' });
  }

  let recipient;
  try {
    recipient = resolveRecipient(rawRecipient);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  const relayKey = process.env.RELAY_PRIVATE_KEY;
  if (!relayKey) {
    return res.status(503).json({ error: 'Relay not configured — add RELAY_PRIVATE_KEY in Vercel env vars' });
  }

  try {
    const iface      = new ethers.Interface(FAUCET_ABI);
    const relayWallet = new ethers.Wallet(relayKey); // no provider — signing only

    // ── Pre-flight checks (raw eth_call / eth_getBalance) ────────────

    const [cooldownHex, poolHex, balHex, nonceHex, gasPriceHex] = await Promise.all([
      rpc('eth_call', [{ to: FAUCET_ADDR, data: iface.encodeFunctionData('cooldownRemaining', [recipient]) }, 'latest']),
      rpc('eth_call', [{ to: FAUCET_ADDR, data: iface.encodeFunctionData('poolBalance', []) }, 'latest']),
      rpc('eth_getBalance',          [relayWallet.address, 'latest']),
      rpc('eth_getTransactionCount', [relayWallet.address, 'latest']),
      rpc('eth_gasPrice',            []),
    ]);

    const cooldown = ethers.toBigInt(cooldownHex);
    const poolBal  = ethers.toBigInt(poolHex);
    const relayBal = ethers.toBigInt(balHex);
    const nonce    = parseInt(nonceHex, 16);

    // Use network gas price + 20% buffer, minimum 1 gwei
    const MIN_GAS_PRICE = 1_000_000_000n; // 1 gwei
    const networkGasPrice = ethers.toBigInt(gasPriceHex);
    const gasPrice = networkGasPrice > 0n
      ? (networkGasPrice * 120n / 100n)   // +20%
      : MIN_GAS_PRICE;
    const effectiveGasPrice = gasPrice < MIN_GAS_PRICE ? MIN_GAS_PRICE : gasPrice;

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

    // ── Build, sign, and broadcast raw legacy tx ─────────────────────
    const rawTx = {
      to:       FAUCET_ADDR,
      data:     iface.encodeFunctionData('claim', [recipient]),
      value:    0n,
      gasPrice: effectiveGasPrice,
      gasLimit: 120000n,
      type:     0,
      nonce,
      chainId:  CHAIN_ID,
    };

    const signedTx = await relayWallet.signTransaction(rawTx);
    const txHash   = await rpc('eth_sendRawTransaction', [signedTx]);

    return res.status(200).json({ success: true, hash: txHash, recipient, amount: '1' });

  } catch (err) {
    const raw = err.reason || err.shortMessage || err.message || String(err);
    console.error('[tPotFaucet relay] error:', raw);

    const msg = raw.includes('cooldown') ? 'Cooldown still active — wait 72 hours'
              : raw.includes('empty')    ? 'Faucet pool is empty'
              : raw.includes('nonce')    ? 'Nonce conflict — please retry'
              : raw.includes('gas')      ? 'Gas error — check relay wallet balance'
              : `Faucet error: ${raw.slice(0, 180)}`;

    return res.status(500).json({ error: msg });
  }
}
