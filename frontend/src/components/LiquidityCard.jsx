import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import TokenSelect from './TokenSelect';
import { ADDRESSES, TOKENS } from '../utils/addresses';
import { ROUTER_ABI, ERC20_ABI, FACTORY_ABI, PAIR_ABI } from '../utils/abis';

/* ── Confetti ─────────────────────────────────────────────────── */
function Confetti({ active, onDone }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const colors = ['#3d7eff','#6a4aff','#10b981','#f5ac37','#f7931a','#00d4ff'];
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 7 + 3, d: Math.random() * 120,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10, tiltAngle: 0,
      tiltAngleInc: Math.random() * 0.07 + 0.05,
    }));
    let frame, tick = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        ctx.beginPath(); ctx.lineWidth = p.r / 2; ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4); ctx.stroke();
      });
      tick++;
      pieces.forEach(p => {
        p.tiltAngle += p.tiltAngleInc;
        p.y += (Math.cos(tick / 16 + p.d) + 1 + p.r / 2) * 1.2;
        p.tilt = Math.sin(p.tiltAngle) * 15;
      });
      if (tick < 180) { frame = requestAnimationFrame(draw); }
      else { ctx.clearRect(0, 0, canvas.width, canvas.height); onDone?.(); }
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [active]);
  if (!active) return null;
  return <canvas ref={ref} style={{ position:'fixed', inset:0, zIndex:9999, pointerEvents:'none' }} />;
}

/* ── Liquidity Success Card ────────────────────────────────────── */
function LiquiditySuccessCard({ result, onClose }) {
  const { symbolA, symbolB, amountA, amountB, lpReceived, hash } = result;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.72)', backdropFilter:'blur(8px)' }}>
      <div style={{ width:380, borderRadius:28, background:'linear-gradient(160deg,var(--bg-secondary) 0%,var(--bg-card-hover) 100%)', border:'1px solid rgba(61,126,255,0.35)', padding:'36px 28px 28px', boxShadow:'0 0 60px rgba(61,126,255,0.15), 0 24px 64px rgba(0,0,0,0.85)', textAlign:'center' }}>

        {/* Pool drop icon */}
        <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 20px', background:'linear-gradient(135deg,rgba(61,126,255,0.22),rgba(106,74,255,0.12))', border:'2px solid rgba(61,126,255,0.5)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 28px rgba(61,126,255,0.25)' }}>
          <svg width="34" height="34" fill="none" viewBox="0 0 24 24">
            <path d="M12 2C8 7 4 10.5 4 14a8 8 0 0016 0c0-3.5-4-7-8-12z" fill="url(#lpg)" />
            <defs>
              <linearGradient id="lpg" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3d7eff"/>
                <stop offset="1" stopColor="#6a4aff"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <p style={{ fontFamily:'var(--font-primary)', fontWeight:700, fontSize:22, color:'var(--text-primary)', marginBottom:4 }}>Liquidity Added!</p>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:24 }}>Your tokens are now earning 0.3% fees</p>

        {/* Token pair */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, background:'var(--bg-input)', border:'1px solid var(--border-secondary)', borderRadius:22, padding:'20px 16px', marginBottom:16 }}>
          {/* Token A */}
          <div style={{ textAlign:'center', flex:1 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', margin:'0 auto 10px', background:'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-primary)', fontWeight:700, fontSize:20, color:'#fff', boxShadow:'0 0 16px rgba(61,126,255,0.4)' }}>
              {symbolA[0]}
            </div>
            <p style={{ fontFamily:'var(--font-primary)', fontWeight:700, fontSize:18, color:'var(--text-primary)', lineHeight:1.1 }}>{parseFloat(amountA).toFixed(4)}</p>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>{symbolA}</p>
          </div>

          {/* Plus */}
          <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(61,126,255,0.1)', border:'1px solid rgba(61,126,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#3d7eff" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-8-8h16"/>
            </svg>
          </div>

          {/* Token B */}
          <div style={{ textAlign:'center', flex:1 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', margin:'0 auto 10px', background:'linear-gradient(135deg,var(--accent-green),#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-primary)', fontWeight:700, fontSize:20, color:'#fff', boxShadow:'0 0 16px rgba(16,185,129,0.4)' }}>
              {symbolB[0]}
            </div>
            <p style={{ fontFamily:'var(--font-primary)', fontWeight:700, fontSize:18, color:'var(--text-primary)', lineHeight:1.1 }}>{parseFloat(amountB).toFixed(4)}</p>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>{symbolB}</p>
          </div>
        </div>

        {/* LP tokens received */}
        {lpReceived && parseFloat(lpReceived) > 0 && (
          <div style={{ padding:'12px 16px', borderRadius:14, background:'rgba(61,126,255,0.06)', border:'1px solid rgba(61,126,255,0.18)', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-primary)' }}>LP tokens received</span>
            <span style={{ fontFamily:'var(--font-primary)', fontWeight:700, fontSize:13, color:'var(--accent-blue)' }}>+{parseFloat(lpReceived).toFixed(6)}</span>
          </div>
        )}

        {/* Tx hash */}
        {hash && (
          <div style={{ padding:'10px 14px', borderRadius:12, background:'rgba(61,126,255,0.06)', border:'1px solid rgba(61,126,255,0.15)', marginBottom:22, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>Tx hash</span>
            <span style={{ fontFamily:'monospace', fontSize:12, color:'var(--accent-blue)' }}>{hash.slice(0,12)}…{hash.slice(-8)}</span>
          </div>
        )}

        <button
          onClick={onClose}
          className="btn-primary"
          style={{ width:'100%', padding:'14px', borderRadius:18, fontFamily:'var(--font-primary)', fontWeight:700, fontSize:15, color:'#fff', cursor:'pointer', border:'none' }}>
          Done
        </button>
      </div>
    </div>
  );
}

/* ── Main LiquidityCard ──────────────────────────────────────── */
export default function LiquidityCard({ wallet, onLiquiditySuccess }) {
  const { account, signer, connect } = wallet;
  const [mode, setMode] = useState('add');
  const [tokenA, setTokenA] = useState(TOKENS[0]);
  const [tokenB, setTokenB] = useState(TOKENS[2]);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [balanceA, setBalanceA] = useState('0');
  const [balanceB, setBalanceB] = useState('0');
  const [lpBalance, setLpBalance] = useState('0');
  const [removeAmount, setRemoveAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pairAddress, setPairAddress] = useState(null);
  const [reserves, setReserves] = useState({ r0: '0', r1: '0' });
  const [successResult, setSuccessResult] = useState(null);
  const [confetti, setConfetti] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!account || !signer) return;
    try {
      const provider = signer.provider;
      // Fetch Token A balance
      if (tokenA.isNative) {
        const bal = await provider.getBalance(account);
        setBalanceA(ethers.formatEther(bal));
      } else {
        const tc = new ethers.Contract(tokenA.address, ERC20_ABI, provider);
        const bal = await tc.balanceOf(account);
        const dec = await tc.decimals();
        setBalanceA(ethers.formatUnits(bal, dec));
      }
      // Fetch Token B balance
      if (tokenB.isNative) {
        const bal = await provider.getBalance(account);
        setBalanceB(ethers.formatEther(bal));
      } else {
        const tc = new ethers.Contract(tokenB.address, ERC20_ABI, provider);
        const bal = await tc.balanceOf(account);
        const dec = await tc.decimals();
        setBalanceB(ethers.formatUnits(bal, dec));
      }
    } catch (err) {
      console.error('[LiquidityCard] Balance fetch failed:', err);
    }
  }, [account, signer, tokenA, tokenB]);

  const fetchPairInfo = useCallback(async () => {
    if (!signer || ADDRESSES.Factory === ethers.ZeroAddress) return;
    try {
      const provider = signer.provider;
      const factory = new ethers.Contract(ADDRESSES.Factory, FACTORY_ABI, provider);
      const addrA = tokenA.isNative ? ADDRESSES.WPOT : tokenA.address;
      const addrB = tokenB.isNative ? ADDRESSES.WPOT : tokenB.address;
      if (addrA === ethers.ZeroAddress || addrB === ethers.ZeroAddress) return;
      if (addrA.toLowerCase() === addrB.toLowerCase()) { setPairAddress(null); return; }
      const pair = await factory.getPair(addrA, addrB);
      setPairAddress(pair);
      if (pair !== ethers.ZeroAddress) {
        const pairContract = new ethers.Contract(pair, PAIR_ABI, provider);
        const res = await pairContract.getReserves();
        setReserves({ r0: res[0].toString(), r1: res[1].toString() });
        if (account) {
          const lpBal = await pairContract.balanceOf(account);
          setLpBalance(ethers.formatEther(lpBal));
        }
      } else {
        setReserves({ r0: '0', r1: '0' });
        setLpBalance('0');
      }
    } catch (e) { console.error('Pair info error:', e); }
  }, [signer, account, tokenA, tokenB]);

  useEffect(() => { fetchPairInfo(); }, [fetchPairInfo]);
  useEffect(() => { fetchBalances(); }, [fetchBalances]);

  useEffect(() => {
    if (mode !== 'add' || !amountA || parseFloat(amountA) === 0) { setAmountB(''); return; }
    if (pairAddress && pairAddress !== ethers.ZeroAddress && reserves.r0 !== '0' && reserves.r1 !== '0') {
      const addrA = tokenA.isNative ? ADDRESSES.WPOT : tokenA.address;
      const addrB = tokenB.isNative ? ADDRESSES.WPOT : tokenB.address;
      const aIsToken0 = addrA.toLowerCase() < addrB.toLowerCase();
      const decimals0 = aIsToken0 ? tokenA.decimals : tokenB.decimals;
      const decimals1 = aIsToken0 ? tokenB.decimals : tokenA.decimals;
      const raw0 = parseFloat(ethers.formatUnits(reserves.r0, decimals0));
      const raw1 = parseFloat(ethers.formatUnits(reserves.r1, decimals1));
      const reserveA = aIsToken0 ? raw0 : raw1;
      const reserveB = aIsToken0 ? raw1 : raw0;
      if (reserveA > 0) setAmountB(((parseFloat(amountA) * reserveB) / reserveA).toFixed(6));
    }
  }, [amountA, reserves, mode, tokenA, tokenB, pairAddress]);

  const approveIfNeeded = async (tokenAddr, amount, spender) => {
    const tokenContract = new ethers.Contract(tokenAddr, ERC20_ABI, signer);
    const allowance = await tokenContract.allowance(account, spender);
    if (allowance < amount) {
      const tx = await tokenContract.approve(spender, ethers.MaxUint256);
      await tx.wait();
    }
  };

  const handleAddLiquidity = async () => {
    if (!signer || !account) return;
    setIsLoading(true);
    const toastId = toast.loading('Adding liquidity...');
    try {
      const router = new ethers.Contract(ADDRESSES.Router, ROUTER_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const addrA = tokenA.isNative ? ADDRESSES.WPOT : tokenA.address;
      const addrB = tokenB.isNative ? ADDRESSES.WPOT : tokenB.address;
      const amtA = ethers.parseUnits(amountA, tokenA.decimals);
      const amtB = ethers.parseUnits(amountB, tokenB.decimals);
      const minA = amtA * 995n / 1000n;
      const minB = amtB * 995n / 1000n;

      // Snapshot LP balance before tx so we can compute delta
      let lpBefore = 0n;
      let pairAddr = pairAddress;
      try {
        if (pairAddr && pairAddr !== ethers.ZeroAddress) {
          const pairContract = new ethers.Contract(pairAddr, PAIR_ABI, signer.provider);
          lpBefore = await pairContract.balanceOf(account);
        }
      } catch { /* first deposit — pair may not exist yet */ }

      let tx;
      if (tokenA.isNative || tokenB.isNative) {
        const tokenAddr = tokenA.isNative ? addrB : addrA;
        const tokenAmt = tokenA.isNative ? amtB : amtA;
        const tokenMin = tokenA.isNative ? minB : minA;
        const potAmt = tokenA.isNative ? amtA : amtB;
        const potMin = tokenA.isNative ? minA : minB;
        toast.loading('Approving token...', { id: toastId });
        await approveIfNeeded(tokenAddr, tokenAmt, ADDRESSES.Router);
        toast.loading('Adding liquidity...', { id: toastId });
        tx = await router.addLiquidityPOT(tokenAddr, tokenAmt, tokenMin, potMin, account, deadline, { value: potAmt });
      } else {
        toast.loading('Approving tokens...', { id: toastId });
        await approveIfNeeded(addrA, amtA, ADDRESSES.Router);
        await approveIfNeeded(addrB, amtB, ADDRESSES.Router);
        toast.loading('Adding liquidity...', { id: toastId });
        tx = await router.addLiquidity(addrA, addrB, amtA, amtB, minA, minB, account, deadline);
      }
      const receipt = await tx.wait();
      toast.dismiss(toastId);

      // Compute LP tokens received
      await fetchPairInfo();
      await fetchBalances();
      let lpReceived = '0';
      try {
        // Re-read pair address in case it was just created
        const factory = new ethers.Contract(ADDRESSES.Factory, FACTORY_ABI, signer.provider);
        pairAddr = await factory.getPair(addrA, addrB);
        if (pairAddr && pairAddr !== ethers.ZeroAddress) {
          const pairContract = new ethers.Contract(pairAddr, PAIR_ABI, signer.provider);
          const lpAfter = await pairContract.balanceOf(account);
          lpReceived = ethers.formatEther(lpAfter - lpBefore > 0n ? lpAfter - lpBefore : lpAfter);
        }
      } catch { /* best-effort */ }

      setSuccessResult({
        symbolA: tokenA.symbol, symbolB: tokenB.symbol,
        amountA, amountB, lpReceived, hash: receipt.hash,
      });
      setConfetti(true);
      // Save to tx history
      const entry = { type: 'add', symbolA: tokenA.symbol, symbolB: tokenB.symbol, amountA, amountB, lpReceived, time: Date.now(), hash: receipt.hash };
      const key = `ps_history_${account?.toLowerCase() || 'anon'}`;
      const hist = JSON.parse(localStorage.getItem(key) || '[]');
      hist.unshift(entry);
      localStorage.setItem(key, JSON.stringify(hist.slice(0, 50)));
      window.dispatchEvent(new CustomEvent('ps_history_update', { detail: { key } }));
      onLiquiditySuccess?.(entry);
      setAmountA('');
      setAmountB('');
    } catch (err) {
      console.error(err);
      toast.error(err.reason || 'Failed to add liquidity', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!signer || !account || !pairAddress) return;
    if (pairAddress === ethers.ZeroAddress) { toast.error('No pool exists for this pair yet'); return; }
    setIsLoading(true);
    const toastId = toast.loading('Removing liquidity...');
    try {
      const router = new ethers.Contract(ADDRESSES.Router, ROUTER_ABI, signer);
      const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const lpAmount = ethers.parseEther(removeAmount);
      const addrA = tokenA.isNative ? ADDRESSES.WPOT : tokenA.address;
      const addrB = tokenB.isNative ? ADDRESSES.WPOT : tokenB.address;
      toast.loading('Approving LP tokens...', { id: toastId });
      const allowance = await pairContract.allowance(account, ADDRESSES.Router);
      if (allowance < lpAmount) {
        const approveTx = await pairContract.approve(ADDRESSES.Router, ethers.MaxUint256);
        await approveTx.wait();
      }
      toast.loading('Removing liquidity...', { id: toastId });
      let tx;
      if (tokenA.isNative || tokenB.isNative) {
        const token = tokenA.isNative ? addrB : addrA;
        tx = await router.removeLiquidityPOT(token, lpAmount, 0, 0, account, deadline);
      } else {
        tx = await router.removeLiquidity(addrA, addrB, lpAmount, 0, 0, account, deadline);
      }
      const receipt = await tx.wait();
      toast.success('Liquidity removed!', { id: toastId });
      // Save to tx history
      const entry = { type: 'remove', symbolA: tokenA.symbol, symbolB: tokenB.symbol, lpAmount: removeAmount, time: Date.now(), hash: receipt.hash };
      const key = `ps_history_${account?.toLowerCase() || 'anon'}`;
      const hist = JSON.parse(localStorage.getItem(key) || '[]');
      hist.unshift(entry);
      localStorage.setItem(key, JSON.stringify(hist.slice(0, 50)));
      window.dispatchEvent(new CustomEvent('ps_history_update', { detail: { key } }));
      onLiquiditySuccess?.(entry);
      setRemoveAmount('');
      fetchPairInfo();
      fetchBalances();
    } catch (err) {
      console.error(err);
      toast.error(err.reason || 'Failed to remove liquidity', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {confetti && <Confetti active={confetti} onDone={() => setConfetti(false)} />}
      {successResult && <LiquiditySuccessCard result={successResult} onClose={() => setSuccessResult(null)} />}

      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily:'var(--font-primary)', fontWeight:700, fontSize:18, color:'var(--text-primary)' }}>Liquidity</h2>
          <div style={{ display:'flex', gap:4, background:'var(--bg-menu-item)', borderRadius:12, padding:4 }}>
            <button onClick={() => setMode('add')} style={{ padding:'8px 16px', borderRadius:10, fontSize:12, fontWeight:600, fontFamily:'var(--font-primary)', transition:'all 0.15s', border:'none', cursor:'pointer', background: mode==='add' ? 'var(--accent-blue)' : 'transparent', color: mode==='add' ? '#fff' : 'var(--text-muted)' }}>Add</button>
            <button onClick={() => setMode('remove')} style={{ padding:'8px 16px', borderRadius:10, fontSize:12, fontWeight:600, fontFamily:'var(--font-primary)', transition:'all 0.15s', border:'none', cursor:'pointer', background: mode==='remove' ? 'var(--accent-red)' : 'transparent', color: mode==='remove' ? '#fff' : 'var(--text-muted)' }}>Remove</button>
          </div>
        </div>

        {mode === 'add' ? (
          <>
            <div style={{ background:'var(--bg-menu-item)', borderRadius:20, padding:16, marginBottom:12, border:'1px solid var(--border-secondary)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-primary)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Token A</p>
                <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-primary)' }}>Balance: {parseFloat(balanceA).toFixed(4)}</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <input type="number" value={amountA} onChange={e => setAmountA(e.target.value)} placeholder="0.0"
                  style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:22, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-primary)', width:'100%' }} />
                <TokenSelect selectedToken={tokenA} onSelect={setTokenA} otherToken={tokenB} />
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'center', margin:'8px 0' }}>
              <div style={{ width:32, height:32, borderRadius:12, background:'var(--bg-menu-item)', border:'1px solid var(--border-secondary)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ color:'var(--text-muted)', fontSize:18 }}>+</span>
              </div>
            </div>

            <div style={{ background:'var(--bg-menu-item)', borderRadius:20, padding:16, border:'1px solid var(--border-secondary)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-primary)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Token B</p>
                <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-primary)' }}>Balance: {parseFloat(balanceB).toFixed(4)}</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <input type="number" value={amountB} onChange={e => setAmountB(e.target.value)} placeholder="0.0"
                  style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:22, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-primary)', width:'100%' }} />
                <TokenSelect selectedToken={tokenB} onSelect={setTokenB} otherToken={tokenA} />
              </div>
            </div>

            {pairAddress && pairAddress !== ethers.ZeroAddress && (
              <div style={{ marginTop:16, padding:12, background:'rgba(61,126,255,0.05)', borderRadius:16, border:'1px solid rgba(61,126,255,0.15)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                  <span style={{ color:'var(--text-muted)' }}>Pool</span>
                  <span style={{ color:'var(--text-secondary)', fontFamily:'var(--font-primary)', fontWeight:500 }}>{tokenA.symbol} / {tokenB.symbol}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginTop:6 }}>
                  <span style={{ color:'var(--text-muted)' }}>Your LP Tokens</span>
                  <span style={{ color:'var(--text-secondary)', fontFamily:'var(--font-primary)', fontWeight:500 }}>{parseFloat(lpBalance).toFixed(6)}</span>
                </div>
              </div>
            )}

            <button onClick={account ? handleAddLiquidity : connect}
              disabled={isLoading || (account && (!amountA || !amountB))}
              style={{ width:'100%', marginTop:16, padding:'16px 0', borderRadius:20, fontSize:16, fontWeight:700, fontFamily:'var(--font-primary)', background:'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', color:'#fff', border:'none', cursor: account && !isLoading && amountA && amountB ? 'pointer' : 'not-allowed', opacity: isLoading || (account && (!amountA || !amountB)) ? 0.5 : 1, transition:'all 0.2s' }}>
              {!account ? 'Connect Wallet' : isLoading ? (
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/><path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Adding…
                </span>
              ) : 'Add Liquidity'}
            </button>
          </>
        ) : (
          <>
            <div style={{ background:'var(--bg-menu-item)', borderRadius:20, padding:16, marginBottom:16, border:'1px solid var(--border-secondary)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-primary)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>LP Tokens to Remove</p>
                <button onClick={() => setRemoveAmount(lpBalance)} style={{ fontSize:11, color:'var(--accent-blue)', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-primary)', fontWeight:600 }}>
                  Max: {parseFloat(lpBalance).toFixed(6)}
                </button>
              </div>
              <input type="number" value={removeAmount} onChange={e => setRemoveAmount(e.target.value)} placeholder="0.0"
                style={{ width:'100%', background:'transparent', border:'none', outline:'none', fontSize:22, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-primary)' }} />
            </div>

            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {['25','50','75','100'].map(pct => (
                <button key={pct} onClick={() => setRemoveAmount(((parseFloat(lpBalance)*parseInt(pct))/100).toString())}
                  style={{ flex:1, padding:'10px 0', borderRadius:16, fontSize:11, fontWeight:600, fontFamily:'var(--font-primary)', background:'var(--bg-menu-item)', color:'var(--text-muted)', border:'1px solid var(--border-secondary)', cursor:'pointer', transition:'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color='var(--text-primary)'; e.currentTarget.style.background='var(--bg-menu-item-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='var(--bg-menu-item)'; }}>
                  {pct}%
                </button>
              ))}
            </div>

            <div style={{ display:'flex', gap:12, marginBottom:16 }}>
              <TokenSelect selectedToken={tokenA} onSelect={setTokenA} otherToken={tokenB} />
              <span style={{ color:'var(--text-muted)', display:'flex', alignItems:'center' }}>/</span>
              <TokenSelect selectedToken={tokenB} onSelect={setTokenB} otherToken={tokenA} />
            </div>

            <button onClick={account ? handleRemoveLiquidity : connect}
              disabled={isLoading || (account && (!removeAmount || parseFloat(removeAmount) === 0))}
              style={{ width:'100%', padding:'16px 0', borderRadius:20, fontSize:16, fontWeight:700, fontFamily:'var(--font-primary)', background:'linear-gradient(135deg, var(--accent-red), var(--accent-red-hover))', color:'#fff', border:'none', cursor: account && !isLoading && removeAmount && parseFloat(removeAmount) > 0 ? 'pointer' : 'not-allowed', opacity: isLoading || (account && (!removeAmount || parseFloat(removeAmount) === 0)) ? 0.5 : 1, transition:'all 0.2s' }}>
              {!account ? 'Connect Wallet' : isLoading ? 'Removing...' : 'Remove Liquidity'}
            </button>
          </>
        )}
      </div>
    </>
  );
}
