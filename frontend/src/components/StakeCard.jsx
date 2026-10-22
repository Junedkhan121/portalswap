import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { ADDRESSES, NATIVE_SYMBOL, RPC_URL } from '../utils/addresses';
import { STAKING_ABI } from '../utils/abis';

/* ── Stat card ───────────────────────────────────────────────────── */
function StatBox({ label, value, sub, accent }) {
  return (
    <div style={{ flex: 1, padding: '20px 18px', borderRadius: 20, background: 'var(--bg-menu-item)', border: `1px solid ${accent}33`, textAlign: 'center' }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 26, color: accent, lineHeight: 1.1, marginBottom: 4 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

export default function StakeCard({ wallet }) {
  const { account, signer, connect } = wallet;
  const stakingAddr  = ADDRESSES.tPotStaking;
  const isDeployed   = stakingAddr && stakingAddr.length === 42;

  /* ── State ────────────────────────────────────────────────────── */
  const [tab,         setTab]         = useState('stake');
  const [nativeBal,   setNativeBal]   = useState('0');
  const [stakedBal,   setStakedBal]   = useState('0');
  const [totalStaked, setTotalStaked] = useState('0');
  const [stakeAmt,    setStakeAmt]    = useState('');
  const [unstakeAmt,  setUnstakeAmt]  = useState('');
  const [staking,     setStaking]     = useState(false);
  const [unstaking,   setUnstaking]   = useState(false);
  const [loading,     setLoading]     = useState(false);

  /* ── Data fetch ───────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    if (!isDeployed) return;
    setLoading(true);
    try {
      const provider = signer?.provider || new ethers.JsonRpcProvider(RPC_URL);
      const staking  = new ethers.Contract(stakingAddr, STAKING_ABI, provider);
      const total    = await staking.totalStaked();
      setTotalStaked(parseFloat(ethers.formatEther(total)).toFixed(4));
      if (account) {
        const [userStaked, walletBal] = await Promise.all([
          staking.stakedBalance(account),
          provider.getBalance(account),
        ]);
        setStakedBal(parseFloat(ethers.formatEther(userStaked)).toFixed(6));
        setNativeBal(parseFloat(ethers.formatEther(walletBal)).toFixed(6));
      }
    } catch (e) { console.warn('StakeCard fetch error', e); }
    finally { setLoading(false); }
  }, [isDeployed, stakingAddr, signer, account]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Stake ────────────────────────────────────────────────────── */
  const handleStake = async () => {
    if (!signer || !account || !stakeAmt || parseFloat(stakeAmt) <= 0) return;
    setStaking(true);
    const id = toast.loading(`Staking ${stakeAmt} ${NATIVE_SYMBOL}…`);
    try {
      const contract = new ethers.Contract(stakingAddr, STAKING_ABI, signer);
      // Native token staking — no approve needed, just send value with the call
      const tx = await contract.stake({ value: ethers.parseEther(stakeAmt) });
      await tx.wait();
      toast.success(`Staked ${stakeAmt} ${NATIVE_SYMBOL}!`, { id });
      setStakeAmt('');
      fetchData();
    } catch (err) {
      toast.error(err.reason || 'Stake failed', { id });
    } finally { setStaking(false); }
  };

  /* ── Unstake ──────────────────────────────────────────────────── */
  const handleUnstake = async () => {
    if (!signer || !account || !unstakeAmt || parseFloat(unstakeAmt) <= 0) return;
    setUnstaking(true);
    const id = toast.loading(`Unstaking ${unstakeAmt} ${NATIVE_SYMBOL}…`);
    try {
      const contract = new ethers.Contract(stakingAddr, STAKING_ABI, signer);
      const tx = await contract.withdraw(ethers.parseEther(unstakeAmt));
      await tx.wait();
      toast.success(`Unstaked ${unstakeAmt} ${NATIVE_SYMBOL}!`, { id });
      setUnstakeAmt('');
      fetchData();
    } catch (err) {
      toast.error(err.reason || 'Unstake failed', { id });
    } finally { setUnstaking(false); }
  };

  const maxStake   = () => setStakeAmt(parseFloat(nativeBal).toFixed(6));
  const maxUnstake = () => setUnstakeAmt(parseFloat(stakedBal).toFixed(6));

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className="glass-card rounded-3xl p-5">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 4 }}>
          tPOTv3 Staking
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Stake native tPOTv3 and track your position on-chain.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <StatBox
          label="Your staked"
          value={account ? stakedBal : '—'}
          sub={account ? NATIVE_SYMBOL : 'Connect wallet'}
          accent="var(--accent-blue)"
        />
        <StatBox
          label="Total network staked"
          value={isDeployed ? totalStaked : '—'}
          sub={isDeployed ? NATIVE_SYMBOL : 'Not deployed'}
          accent="var(--accent-purple)"
        />
      </div>

      {/* Contract not deployed */}
      {!isDeployed && (
        <div style={{ padding: 16, borderRadius: 16, background: 'rgba(245,172,55,0.07)', border: '1px solid rgba(245,172,55,0.25)', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--accent-yellow)', margin: 0, lineHeight: 1.6 }}>
            <strong>tPotStaking not yet deployed.</strong> Run:
          </p>
          <code style={{ display: 'block', marginTop: 8, fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '8px 12px', borderRadius: 8 }}>
            npx hardhat run scripts/deploy-staking.js --network portaldotTestnet
          </code>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>
            Then paste the address into <code style={{ color: 'var(--text-secondary)' }}>ADDRESSES.tPotStaking</code>.
          </p>
        </div>
      )}

      {/* Connect prompt */}
      {!account && (
        <button onClick={connect} style={{ width: '100%', padding: '16px 0', borderRadius: 20, fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-primary)', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
          Connect Wallet
        </button>
      )}

      {/* Main interface */}
      {account && isDeployed && (
        <>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-menu-item)', borderRadius: 14, padding: 4, marginBottom: 16 }}>
            {['stake', 'unstake'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-primary)', border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: tab === t ? (t === 'stake' ? 'var(--accent-blue)' : 'var(--accent-red)') : 'transparent', color: tab === t ? '#fff' : 'var(--text-muted)' }}>
                {t === 'stake' ? 'Stake' : 'Unstake'}
              </button>
            ))}
          </div>

          {tab === 'stake' ? (
            <>
              {/* Wallet balance */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount to stake</p>
                <button onClick={maxStake} style={{ fontSize: 11, color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-primary)', fontWeight: 600 }}>
                  Balance: {nativeBal} {NATIVE_SYMBOL}
                </button>
              </div>
              <div style={{ background: 'var(--bg-menu-item)', borderRadius: 18, padding: 16, border: '1px solid var(--border-secondary)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="number" value={stakeAmt} onChange={e => setStakeAmt(e.target.value)} placeholder="0.0" min="0" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-badge)', border: '1px solid var(--border-accent)', borderRadius: 12, padding: '6px 12px', flexShrink: 0 }}>
                    <span style={{ fontSize: 16 }}>🔷</span>
                    <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{NATIVE_SYMBOL}</span>
                  </div>
                </div>
              </div>
              <button onClick={handleStake} disabled={staking || !stakeAmt || parseFloat(stakeAmt) <= 0}
                style={{ width: '100%', padding: '15px 0', borderRadius: 20, fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-primary)', background: stakeAmt && parseFloat(stakeAmt) > 0 ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' : 'var(--bg-menu-item)', color: stakeAmt && parseFloat(stakeAmt) > 0 ? '#fff' : 'var(--text-muted)', border: 'none', cursor: staking || !stakeAmt || parseFloat(stakeAmt) <= 0 ? 'not-allowed' : 'pointer', opacity: staking ? 0.6 : 1, transition: 'all 0.2s' }}>
                {staking ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/><path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Staking…
                  </span>
                ) : 'Stake tPOTv3'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                No approval needed — tPOTv3 is the native token.
              </p>
            </>
          ) : (
            <>
              {/* Staked balance */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount to unstake</p>
                <button onClick={maxUnstake} style={{ fontSize: 11, color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-primary)', fontWeight: 600 }}>
                  Staked: {stakedBal} {NATIVE_SYMBOL}
                </button>
              </div>
              <div style={{ background: 'var(--bg-menu-item)', borderRadius: 18, padding: 16, border: '1px solid var(--border-secondary)', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="number" value={unstakeAmt} onChange={e => setUnstakeAmt(e.target.value)} placeholder="0.0" min="0" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-badge)', border: '1px solid var(--border-accent)', borderRadius: 12, padding: '6px 12px', flexShrink: 0 }}>
                    <span style={{ fontSize: 16 }}>🔷</span>
                    <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{NATIVE_SYMBOL}</span>
                  </div>
                </div>
              </div>
              {/* Percentage buttons */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['25', '50', '75', '100'].map(pct => (
                  <button key={pct} onClick={() => setUnstakeAmt(((parseFloat(stakedBal) * parseInt(pct)) / 100).toFixed(6))}
                    style={{ flex: 1, padding: '9px 0', borderRadius: 12, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-primary)', background: 'var(--bg-menu-item)', color: 'var(--text-muted)', border: '1px solid var(--border-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color='var(--text-primary)'; e.currentTarget.style.background='var(--bg-menu-item-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='var(--bg-menu-item)'; }}>
                    {pct}%
                  </button>
                ))}
              </div>
              <button onClick={handleUnstake} disabled={unstaking || !unstakeAmt || parseFloat(unstakeAmt) <= 0 || parseFloat(unstakeAmt) > parseFloat(stakedBal)}
                style={{ width: '100%', padding: '15px 0', borderRadius: 20, fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-primary)', background: unstakeAmt && parseFloat(unstakeAmt) > 0 && parseFloat(unstakeAmt) <= parseFloat(stakedBal) ? 'linear-gradient(135deg, var(--accent-red), var(--accent-red-hover))' : 'var(--bg-menu-item)', color: unstakeAmt && parseFloat(unstakeAmt) > 0 ? '#fff' : 'var(--text-muted)', border: 'none', cursor: unstaking || !unstakeAmt || parseFloat(unstakeAmt) <= 0 ? 'not-allowed' : 'pointer', opacity: unstaking ? 0.6 : 1, transition: 'all 0.2s' }}>
                {unstaking ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/><path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Unstaking…
                  </span>
                ) : parseFloat(unstakeAmt) > parseFloat(stakedBal) ? 'Exceeds staked balance' : 'Unstake tPOTv3'}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

