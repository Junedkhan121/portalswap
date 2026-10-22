import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { TOKENS, ADDRESSES, RPC_URL } from '../utils/addresses';
import { ERC20_ABI, TPOT_FAUCET_ABI } from '../utils/abis';
import { TokenAvatar } from './TokenSelect';

/* ── Countdown helper ─────────────────────────────────────────── */
function fmtCountdown(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function FaucetCard({ wallet }) {
  const { account, signer, connect } = wallet;

  /* ── ERC-20 token mint state ─────────────────────────────────── */
  const [loading, setLoading] = useState({});

  const MINT_AMOUNTS = {
    pUSDT: { display: '10',   amount: '10'   },
    pDAI:  { display: '10',   amount: '10'   },
    pWBTC: { display: '0.01', amount: '0.01' },
    pLINK: { display: '0.5',  amount: '0.5'  },
  };

  const mintableTokens = TOKENS.filter(t => !t.isNative && t.mintable && t.address !== ethers.ZeroAddress);

  const handleMint = async (token) => {
    if (!signer || !account) return;
    setLoading(p => ({ ...p, [token.symbol]: true }));
    const id = toast.loading(`Minting ${token.symbol}…`);
    try {
      const contract = new ethers.Contract(token.address, ERC20_ABI, signer);
      const cfg = MINT_AMOUNTS[token.symbol] || { amount: '10', display: '10' };
      const amount = ethers.parseUnits(cfg.amount, token.decimals);
      const tx = await contract.faucet(account, amount);
      await tx.wait();
      toast.success(`Minted ${cfg.display} ${token.symbol}!`, { id });
    } catch (err) {
      toast.error(err.reason || 'Mint failed', { id });
    } finally {
      setLoading(p => ({ ...p, [token.symbol]: false }));
    }
  };

  /* ── tPOTv3 native faucet state ──────────────────────────────── */
  const faucetAddr = ADDRESSES.tPotFaucet;
  const faucetDeployed = faucetAddr && faucetAddr.length === 42;

  const [recipient,   setRecipient]   = useState('');
  const [poolBal,     setPoolBal]     = useState(null);   // formatted string
  const [cooldownSecs,setCooldownSecs]= useState(0);
  const [claiming,    setClaiming]    = useState(false);
  const [donateAmt,   setDonateAmt]   = useState('');
  const [donating,    setDonating]    = useState(false);

  // Pre-fill recipient with connected wallet
  useEffect(() => {
    if (account && !recipient) setRecipient(account);
  }, [account]);

  // Fetch pool balance + cooldown for the current recipient
  const fetchFaucetInfo = useCallback(async () => {
    if (!faucetDeployed) return;
    try {
      const provider = signer?.provider || new ethers.JsonRpcProvider(RPC_URL);
      const faucet = new ethers.Contract(faucetAddr, TPOT_FAUCET_ABI, provider);
      const bal = await faucet.poolBalance();
      setPoolBal(parseFloat(ethers.formatEther(bal)).toFixed(4));
      if (recipient && ethers.isAddress(recipient)) {
        const cd = await faucet.cooldownRemaining(recipient);
        setCooldownSecs(Number(cd));
      } else {
        setCooldownSecs(0);
      }
    } catch (e) {
      console.warn('faucet info fetch failed', e);
    }
  }, [faucetDeployed, faucetAddr, signer, recipient]);

  useEffect(() => { fetchFaucetInfo(); }, [fetchFaucetInfo]);

  // Live countdown ticker
  useEffect(() => {
    if (cooldownSecs <= 0) return;
    const t = setInterval(() => setCooldownSecs(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [cooldownSecs]);

  const handleClaim = async () => {
    if (!faucetDeployed || !ethers.isAddress(recipient)) return;
    // Need a signer to pay gas for the claim tx
    if (!signer) { connect(); return; }
    setClaiming(true);
    const id = toast.loading('Claiming 1 tPOTv3…');
    try {
      const faucet = new ethers.Contract(faucetAddr, TPOT_FAUCET_ABI, signer);
      const tx = await faucet.claim(recipient);
      await tx.wait();
      toast.success('1 tPOTv3 sent to your wallet!', { id });
      setCooldownSecs(72 * 3600);
      fetchFaucetInfo();
    } catch (err) {
      const msg = err.reason || err.message || 'Claim failed';
      toast.error(msg.includes('cooldown') ? 'Still on cooldown — wait 72 hours' : msg, { id });
    } finally {
      setClaiming(false);
    }
  };

  const handleDonate = async () => {
    if (!faucetDeployed || !donateAmt || parseFloat(donateAmt) <= 0) return;
    if (!signer) { connect(); return; }
    setDonating(true);
    const id = toast.loading(`Donating ${donateAmt} tPOTv3…`);
    try {
      const faucet = new ethers.Contract(faucetAddr, TPOT_FAUCET_ABI, signer);
      const tx = await faucet.donate({ value: ethers.parseEther(donateAmt) });
      await tx.wait();
      toast.success(`Donated ${donateAmt} tPOTv3 — thank you!`, { id });
      setDonateAmt('');
      fetchFaucetInfo();
    } catch (err) {
      toast.error(err.reason || 'Donation failed', { id });
    } finally {
      setDonating(false);
    }
  };

  const eligible = faucetDeployed && cooldownSecs === 0 && ethers.isAddress(recipient);

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── tPOTv3 native gas faucet ─────────────────────────── */}
      <div className="glass-card rounded-3xl p-5">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 4 }}>
              Get tPOTv3 Gas Tokens
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Need gas to start? Claim 1 tPOTv3 every 72 hours.
            </p>
          </div>
          {/* Pool badge */}
          {faucetDeployed && poolBal !== null && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Pool</p>
              <p style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 15, color: 'var(--accent-blue)' }}>
                {poolBal} tPOTv3
              </p>
            </div>
          )}
        </div>

        {!faucetDeployed ? (
          /* Contract not yet deployed */
          <div style={{ padding: '16px', borderRadius: 16, background: 'rgba(245,172,55,0.07)', border: '1px solid rgba(245,172,55,0.25)' }}>
            <p style={{ fontSize: 13, color: 'var(--accent-yellow)', margin: 0, lineHeight: 1.6 }}>
              <strong>tPotFaucet not yet deployed.</strong> Run the deploy script to activate this section:
            </p>
            <code style={{ display: 'block', marginTop: 8, fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '8px 12px', borderRadius: 8 }}>
              npx hardhat run scripts/deploy-faucet.js --network portaldotTestnet
            </code>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>
              Then paste the printed address into <code style={{ color: 'var(--text-secondary)' }}>ADDRESSES.tPotFaucet</code> in addresses.js.
            </p>
          </div>
        ) : (
          <>
            {/* Recipient address input */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'var(--font-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recipient address
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="0x…"
                  spellCheck={false}
                  style={{
                    flex: 1, padding: '12px 14px', borderRadius: 14,
                    background: 'var(--bg-input)', border: `1px solid ${ethers.isAddress(recipient) ? 'var(--border-focus)' : 'var(--border-secondary)'}`,
                    color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 13,
                    outline: 'none',
                  }}
                />
                {account && recipient !== account && (
                  <button onClick={() => setRecipient(account)}
                    style={{ padding: '0 14px', borderRadius: 14, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-primary)', background: 'var(--bg-menu-item)', color: 'var(--text-muted)', border: '1px solid var(--border-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Use mine
                  </button>
                )}
              </div>
            </div>

            {/* Claim button or cooldown */}
            {cooldownSecs > 0 ? (
              <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(245,172,55,0.07)', border: '1px solid rgba(245,172,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: 13, color: 'var(--accent-yellow)', marginBottom: 2 }}>Cooldown active</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Next claim available in</p>
                </div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 20, color: 'var(--accent-yellow)' }}>
                  {fmtCountdown(cooldownSecs)}
                </span>
              </div>
            ) : (
              <button
                onClick={handleClaim}
                disabled={claiming || !eligible}
                style={{
                  width: '100%', marginBottom: 12, padding: '14px 0', borderRadius: 18,
                  fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-primary)',
                  background: eligible ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--bg-menu-item)',
                  color: eligible ? '#fff' : 'var(--text-muted)',
                  border: 'none', cursor: eligible && !claiming ? 'pointer' : 'not-allowed',
                  opacity: claiming ? 0.6 : 1, transition: 'all 0.2s',
                }}>
                {!account ? 'Connect wallet to claim' : claiming ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/><path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Sending…
                  </span>
                ) : !ethers.isAddress(recipient) ? 'Enter a valid address' : 'Claim 1 tPOTv3'}
              </button>
            )}

            {/* Donate back section */}
            <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(61,126,255,0.05)', border: '1px solid rgba(61,126,255,0.15)' }}>
              <p style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                💧 Donate tPOTv3 to replenish the pool
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  value={donateAmt}
                  onChange={e => setDonateAmt(e.target.value)}
                  placeholder="Amount"
                  min="0"
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 12,
                    background: 'var(--bg-input)', border: '1px solid var(--border-secondary)',
                    color: 'var(--text-primary)', fontFamily: 'var(--font-primary)', fontSize: 14,
                    outline: 'none',
                  }}
                />
                <button onClick={handleDonate} disabled={donating || !donateAmt || parseFloat(donateAmt) <= 0 || !account}
                  style={{
                    padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                    fontFamily: 'var(--font-primary)', background: 'rgba(61,126,255,0.15)',
                    color: 'var(--accent-blue)', border: '1px solid rgba(61,126,255,0.3)',
                    cursor: donating || !donateAmt || !account ? 'not-allowed' : 'pointer',
                    opacity: donating ? 0.6 : 1, transition: 'all 0.15s',
                  }}>
                  {donating ? 'Donating…' : 'Donate'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── ERC-20 test token minting ─────────────────────────── */}
      <div className="glass-card rounded-3xl p-5">
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 4 }}>
            Testnet Token Faucet
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Mint free test tokens to try PortalSwap.</p>
        </div>

        {!account ? (
          <button onClick={connect}
            style={{ width: '100%', padding: '16px 0', borderRadius: 20, fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-primary)', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
            Connect Wallet
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mintableTokens.map(token => (
              <div key={token.symbol} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: 20, background: 'var(--bg-menu-item)', border: '1px solid var(--border-secondary)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-accent)'; e.currentTarget.style.background='var(--bg-menu-item-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-secondary)'; e.currentTarget.style.background='var(--bg-menu-item)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <TokenAvatar token={token} size={40} />
                  <div>
                    <p style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>{token.symbol}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{token.name}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                    {(MINT_AMOUNTS[token.symbol]?.display ?? '10')} tokens
                  </p>
                  <button onClick={() => handleMint(token)} disabled={loading[token.symbol]}
                    style={{ padding: '8px 16px', borderRadius: 14, fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-primary)', cursor: loading[token.symbol] ? 'not-allowed' : 'pointer', background: 'rgba(61,126,255,0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(61,126,255,0.3)', transition: 'all 0.15s', opacity: loading[token.symbol] ? 0.6 : 1 }}
                    onMouseEnter={e => { if (!loading[token.symbol]) e.currentTarget.style.background='rgba(61,126,255,0.25)'; }}
                    onMouseLeave={e => { if (!loading[token.symbol]) e.currentTarget.style.background='rgba(61,126,255,0.15)'; }}>
                    {loading[token.symbol] ? 'Minting…' : 'Mint'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

