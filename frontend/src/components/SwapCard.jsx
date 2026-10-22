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
    const colors = ['#3d7eff','#a855f7','#10b981','#f5ac37','#f7931a','#00d4ff'];
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

/* ── Swap Success Card ────────────────────────────────────────── */

function shareSwapCard({ fromSymbol, toSymbol, amountIn, amountOut }) {
  const canvas = document.createElement('canvas');
  canvas.width = 600; canvas.height = 320;
  const ctx = canvas.getContext('2d');
  // Background
  const grad = ctx.createLinearGradient(0,0,600,320);
  grad.addColorStop(0,'#07090f'); grad.addColorStop(1,'#0d1424');
  ctx.fillStyle = grad; ctx.fillRect(0,0,600,320);
  // Border glow
  ctx.strokeStyle = 'rgba(61,126,255,0.4)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(1,1,598,318);
  // Header
  ctx.fillStyle = '#3d7eff'; ctx.font = 'bold 14px Space Grotesk, sans-serif';
  ctx.fillText('PortalSwap', 32, 44);
  ctx.fillStyle = '#4e6490'; ctx.font = '11px Inter, sans-serif';
  ctx.fillText('AMM DEX · Portaldot V3 Testnet', 32, 62);
  // Swap label
  ctx.fillStyle = '#e8f0ff'; ctx.font = 'bold 13px Space Grotesk, sans-serif';
  ctx.fillText('SWAPPED', 32, 110);
  // From amount
  ctx.fillStyle = '#e8f0ff'; ctx.font = 'bold 52px Space Grotesk, sans-serif';
  ctx.fillText(parseFloat(amountIn).toFixed(4), 32, 175);
  ctx.fillStyle = '#9ab0d4'; ctx.font = 'bold 22px Space Grotesk, sans-serif';
  ctx.fillText(fromSymbol, 32, 210);
  // Arrow
  ctx.fillStyle = '#3d7eff'; ctx.font = 'bold 36px sans-serif';
  ctx.fillText('→', 290, 185);
  // To amount
  ctx.fillStyle = '#10b981'; ctx.font = 'bold 52px Space Grotesk, sans-serif';
  ctx.fillText(parseFloat(amountOut).toFixed(4), 350, 175);
  ctx.fillStyle = '#9ab0d4'; ctx.font = 'bold 22px Space Grotesk, sans-serif';
  ctx.fillText(toSymbol, 350, 210);
  // Footer
  ctx.fillStyle = 'rgba(78,100,144,0.6)'; ctx.fillRect(0,270,600,50);
  ctx.fillStyle = '#4e6490'; ctx.font = '11px Inter, sans-serif';
  ctx.fillText('portalswap.dev · Built for Portaldot Hacker House 2026', 32, 300);
  // Download
  const link = document.createElement('a');
  link.download = 'portalswap-swap.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function SwapSuccessCard({ result, onClose }) {
  const { fromSymbol, toSymbol, amountIn, amountOut, hash } = result;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }}>
      <div style={{ width:360, borderRadius:28, background:'linear-gradient(160deg,#0d1424 0%,#0a1020 100%)', border:'1px solid rgba(16,185,129,0.35)', padding:'36px 28px 28px', boxShadow:'0 0 60px rgba(16,185,129,0.15), 0 24px 64px rgba(0,0,0,0.8)', textAlign:'center' }}>

        {/* Check icon */}
        <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 20px', background:'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(16,185,129,0.05))', border:'2px solid rgba(16,185,129,0.5)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 28px rgba(16,185,129,0.35)' }}>
          <svg width="34" height="34" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>

        <p style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:22, color:'#e8f0ff', marginBottom:4 }}>Swap Successful</p>
        <p style={{ fontSize:13, color:'#4e6490', marginBottom:28 }}>Your transaction has been confirmed on-chain</p>

        {/* Amount display */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, background:'rgba(7,9,15,0.7)', border:'1px solid rgba(30,46,74,0.7)', borderRadius:22, padding:'20px', marginBottom:20 }}>
          {/* From */}
          <div style={{ textAlign:'center' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', margin:'0 auto 10px', background:'linear-gradient(135deg,#6a4aff,#3d7eff)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Space Grotesk', fontWeight:700, fontSize:20, color:'#fff', boxShadow:'0 0 16px rgba(61,126,255,0.4)' }}>
              {fromSymbol[0]}
            </div>
            <p style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:20, color:'#e8f0ff', lineHeight:1.1 }}>{parseFloat(amountIn).toFixed(4)}</p>
            <p style={{ fontSize:12, color:'#4e6490', marginTop:3 }}>{fromSymbol}</p>
          </div>

          {/* Arrow */}
          <div style={{ width:38, height:38, borderRadius:'50%', background:'rgba(61,126,255,0.1)', border:'1px solid rgba(61,126,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#3d7eff" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </div>

          {/* To */}
          <div style={{ textAlign:'center' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', margin:'0 auto 10px', background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Space Grotesk', fontWeight:700, fontSize:20, color:'#fff', boxShadow:'0 0 16px rgba(16,185,129,0.4)' }}>
              {toSymbol[0]}
            </div>
            <p style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:20, color:'#10b981', lineHeight:1.1 }}>+{parseFloat(amountOut).toFixed(4)}</p>
            <p style={{ fontSize:12, color:'#4e6490', marginTop:3 }}>{toSymbol}</p>
          </div>
        </div>

        {/* Tx hash */}
        {hash && (
          <div style={{ padding:'10px 14px', borderRadius:12, background:'rgba(61,126,255,0.06)', border:'1px solid rgba(61,126,255,0.15)', marginBottom:22, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:11, color:'#4e6490' }}>Tx hash</span>
            <span style={{ fontFamily:'monospace', fontSize:12, color:'#3d7eff' }}>{hash.slice(0,12)}…{hash.slice(-8)}</span>
          </div>
        )}

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => shareSwapCard(result)}
            style={{ flex:1, padding:'13px', borderRadius:16, fontFamily:'Space Grotesk', fontWeight:700, fontSize:14, color:'#3d7eff', cursor:'pointer', background:'rgba(61,126,255,0.1)', border:'1px solid rgba(61,126,255,0.3)' }}>
            Share 📸
          </button>
          <button onClick={onClose}
            className="btn-primary"
            style={{ flex:2, padding:'13px', borderRadius:16, fontFamily:'Space Grotesk', fontWeight:700, fontSize:15, color:'#fff', cursor:'pointer', border:'none' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Impact warning modal ─────────────────────────────────────── */
function ImpactModal({ impact, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)' }}>
      <div style={{ width:360, borderRadius:24, background:'#0d1424', border:'1px solid rgba(239,68,68,0.4)', padding:28, boxShadow:'0 24px 64px rgba(0,0,0,0.8)' }}>
        <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(239,68,68,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <p style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:18, color:'#fff', textAlign:'center', marginBottom:10 }}>High Price Impact</p>
        <p style={{ fontSize:14, color:'#9ab0d4', textAlign:'center', lineHeight:1.6, marginBottom:6 }}>This swap has a price impact of</p>
        <p style={{ fontFamily:'Space Grotesk', fontWeight:800, fontSize:32, color:'#ef4444', textAlign:'center', marginBottom:12 }}>{impact}%</p>
        <p style={{ fontSize:13, color:'#9ab0d4', textAlign:'center', lineHeight:1.6, marginBottom:24 }}>
          You may receive significantly less than expected. This usually means the pool is shallow for this trade size.
        </p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:'12px', borderRadius:14, fontFamily:'Space Grotesk', fontWeight:600, fontSize:14, color:'#9ab0d4', background:'rgba(22,32,64,0.6)', border:'1px solid rgba(30,46,74,0.8)', cursor:'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:'12px', borderRadius:14, fontFamily:'Space Grotesk', fontWeight:600, fontSize:14, color:'#fff', background:'linear-gradient(135deg,#ef4444,#dc2626)', cursor:'pointer', border:'none' }}>Swap Anyway</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main SwapCard ─────────────────────────────────────────────── */
export default function SwapCard({ wallet, onSwapSuccess }) {
  const { account, signer, isCorrectChain, connect } = wallet;
  const [tokenIn, setTokenIn]     = useState(TOKENS[0]);
  const [tokenOut, setTokenOut]   = useState(TOKENS[2]);
  const [amountIn, setAmountIn]   = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [slippage, setSlippage]   = useState('0.5');
  const [autoSlip, setAutoSlip]   = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [priceImpact, setPriceImpact] = useState(null);
  const [balanceIn, setBalanceIn]   = useState('0');
  const [balanceOut, setBalanceOut] = useState('0');
  const [showSettings, setShowSettings] = useState(false);
  const [showWarning, setShowWarning]   = useState(false);
  const [confetti, setConfetti]         = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [routePath, setRoutePath]       = useState(null);
  const [gasEstimate, setGasEstimate]   = useState(null);

  const fetchBalances = useCallback(async () => {
    if (!account || !signer) return;
    try {
      const provider = signer.provider;
      const get = async (t, set) => {
        if (t?.isNative) set(ethers.formatEther(await provider.getBalance(account)));
        else if (t?.address && t.address !== ethers.ZeroAddress) {
          set(ethers.formatUnits(await new ethers.Contract(t.address, ERC20_ABI, provider).balanceOf(account), t.decimals));
        }
      };
      await Promise.all([get(tokenIn, setBalanceIn), get(tokenOut, setBalanceOut)]);
    } catch (e) { console.error(e); }
  }, [account, signer, tokenIn, tokenOut]);

  useEffect(() => { fetchBalances(); }, [fetchBalances]);

  const getQuote = useCallback(async (inputAmount) => {
    if (!inputAmount || parseFloat(inputAmount) === 0 || !tokenIn || !tokenOut) {
      setAmountOut(''); setPriceImpact(null); setRoutePath(null); setAutoSlip(null); setGasEstimate(null); return;
    }
    if (ADDRESSES.Router === ethers.ZeroAddress) return;
    try {
      const provider = signer?.provider || new ethers.JsonRpcProvider('https://test-evm-rpc-v3.portaldot.dev');
      const router   = new ethers.Contract(ADDRESSES.Router, ROUTER_ABI, provider);
      const factory  = new ethers.Contract(ADDRESSES.Factory, FACTORY_ABI, provider);
      const inAddr   = tokenIn.isNative  ? ADDRESSES.WPOT : tokenIn.address;
      const outAddr  = tokenOut.isNative ? ADDRESSES.WPOT : tokenOut.address;
      const amtWei   = ethers.parseUnits(inputAmount, tokenIn.decimals);
      const mids     = [ADDRESSES.WPOT, ...TOKENS.filter(t => !t.isNative && t.address !== ethers.ZeroAddress && t.address !== inAddr && t.address !== outAddr).map(t => t.address)];
      const paths    = [[inAddr, outAddr], ...mids.map(m => [inAddr, m, outAddr])];
      let best = 0n, bestPath = null;
      for (const p of paths) {
        try { const a = await router.getAmountsOut(amtWei, p); if (a[a.length-1] > best) { best = a[a.length-1]; bestPath = p; } } catch {}
      }
      if (!bestPath || best === 0n) { setAmountOut(''); setPriceImpact(null); return; }
      const out = ethers.formatUnits(best, tokenOut.decimals);
      setAmountOut(out); setRoutePath(bestPath);
      // Estimate gas cost
      try {
        const provider2 = signer?.provider || new ethers.JsonRpcProvider("https://test-evm-rpc-v3.portaldot.dev");
        const gasPrice = (await provider2.getFeeData()).gasPrice || 100000n;
        const gasUnits = 200000n; // conservative router estimate
        const gasCost = ethers.formatEther(gasPrice * gasUnits);
        setGasEstimate(parseFloat(gasCost).toFixed(6));
      } catch { setGasEstimate(null); }
      try {
        const pa = await factory.getPair(inAddr, bestPath[1] === outAddr ? outAddr : bestPath[1]);
        if (pa && pa !== ethers.ZeroAddress) {
          const pair = new ethers.Contract(pa, PAIR_ABI, provider);
          const [t0, res] = await Promise.all([pair.token0(), pair.getReserves()]);
          const inIs0 = inAddr.toLowerCase() === t0.toLowerCase();
          const rIn  = parseFloat(ethers.formatUnits(inIs0 ? res[0] : res[1], tokenIn.decimals));
          const rOut = parseFloat(ethers.formatUnits(inIs0 ? res[1] : res[0], tokenOut.decimals));
          if (rIn > 0) {
            const impact = (1 - (parseFloat(out)/parseFloat(inputAmount)) / (rOut/rIn)) * 100;
            if (isFinite(impact) && impact >= 0) {
              setPriceImpact(impact < 0.01 ? '<0.01' : impact.toFixed(2));
              setAutoSlip(Math.min(impact + 0.5, 5).toFixed(1));
            }
          }
        }
      } catch {}
    } catch { setAmountOut(''); setPriceImpact(null); }
  }, [tokenIn, tokenOut, signer]);

  useEffect(() => { const t = setTimeout(() => getQuote(amountIn), 300); return () => clearTimeout(t); }, [amountIn, getQuote]);

  const executeSwap = async () => {
    if (!signer || !account) return;
    setShowWarning(false); setIsLoading(true);
    const id = toast.loading('Preparing swap…');
    try {
      const router   = new ethers.Contract(ADDRESSES.Router, ROUTER_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 1200;
      const slip     = isFinite(parseFloat(slippage)) ? Math.min(Math.max(parseFloat(slippage), 0), 50) : 0.5;
      const bps      = Math.floor(slip * 100);
      const inAddr   = tokenIn.isNative  ? ADDRESSES.WPOT : tokenIn.address;
      const outAddr  = tokenOut.isNative ? ADDRESSES.WPOT : tokenOut.address;
      const amtWei   = ethers.parseUnits(amountIn, tokenIn.decimals);
      const path     = routePath || [inAddr, outAddr];
      const fresh    = await new ethers.Contract(ADDRESSES.Router, ROUTER_ABI, signer.provider).getAmountsOut(amtWei, path);
      const minOut   = (fresh[fresh.length-1] * BigInt(10000-bps)) / 10000n;
      let tx;
      if (tokenIn.isNative) {
        toast.loading('Swapping tPOTv3…', { id });
        tx = await router.swapExactPOTForTokens(minOut, path, account, deadline, { value: amtWei });
      } else {
        const tc = new ethers.Contract(tokenIn.address, ERC20_ABI, signer);
        if ((await tc.allowance(account, ADDRESSES.Router)) < amtWei) {
          toast.loading('Approving…', { id }); await (await tc.approve(ADDRESSES.Router, ethers.MaxUint256)).wait();
        }
        toast.loading('Swapping…', { id });
        tx = tokenOut.isNative
          ? await router.swapExactTokensForPOT(amtWei, minOut, path, account, deadline)
          : await router.swapExactTokensForTokens(amtWei, minOut, path, account, deadline);
      }
      toast.loading('Confirming…', { id });
      const receipt = await tx.wait();
      toast.dismiss(id);
      const entry = { fromSymbol: tokenIn.symbol, toSymbol: tokenOut.symbol, amountIn, amountOut, hash: receipt.hash, time: Date.now() };
      const hist = JSON.parse(sessionStorage.getItem('ps_history') || '[]');
      hist.unshift(entry); sessionStorage.setItem('ps_history', JSON.stringify(hist.slice(0, 20)));
      onSwapSuccess?.(entry);
      setAmountIn(''); setAmountOut('');
      setConfetti(true);
      setSuccessResult(entry);
      fetchBalances();
    } catch (err) {
      toast.error(err.reason || err.message || 'Swap failed', { id });
    } finally { setIsLoading(false); }
  };

  const handleSwap = () => {
    if (parseFloat(priceImpact) > 3) { setShowWarning(true); return; }
    executeSwap();
  };

  const btnLabel = () => {
    if (!account) return 'Connect Wallet';
    if (!isCorrectChain) return 'Switch Network';
    if (!amountIn || parseFloat(amountIn) === 0) return 'Enter amount';
    if (parseFloat(amountIn) > parseFloat(balanceIn)) return 'Insufficient balance';
    if (!amountOut) return 'No route found';
    return 'Swap';
  };
  const btnDisabled = () => {
    if (!account || !isCorrectChain) return false;
    return !amountIn || parseFloat(amountIn) === 0 || parseFloat(amountIn) > parseFloat(balanceIn) || !amountOut || isLoading;
  };

  const route = routePath?.length > 2
    ? `${tokenIn?.symbol} → ${routePath.slice(1,-1).map(a => TOKENS.find(t=>(t.isNative?ADDRESSES.WPOT:t.address)?.toLowerCase()===a.toLowerCase())?.symbol||a.slice(0,6)).join(' → ')} → ${tokenOut?.symbol}`
    : null;

  return (
    <>
      {confetti && <Confetti active={confetti} onDone={() => setConfetti(false)} />}
      {successResult && <SwapSuccessCard result={successResult} onClose={() => setSuccessResult(null)} />}
      {showWarning && <ImpactModal impact={priceImpact} onConfirm={executeSwap} onCancel={() => setShowWarning(false)} />}

      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:20, color:'#e8f0ff' }}>Swap</h2>
          <button onClick={() => setShowSettings(!showSettings)}
            style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:showSettings?'rgba(61,126,255,0.15)':'rgba(22,32,64,0.6)', border:`1px solid ${showSettings?'rgba(61,126,255,0.3)':'rgba(30,46,74,0.8)'}`, cursor:'pointer' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={showSettings?'#3d7eff':'#4e6490'} strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {showSettings && (
          <div className="mb-4 p-3 rounded-2xl" style={{ background:'rgba(7,9,15,0.6)', border:'1px solid rgba(30,46,74,0.6)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-portal-muted font-medium">Slippage Tolerance</p>
              {autoSlip && slippage === '0.5' && (
                <span style={{ fontSize:11, color:'#10b981', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:6, padding:'2px 8px' }}>
                  Auto: {autoSlip}%
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {['0.1','0.5','1.0'].map(v => (
                <button key={v} onClick={() => setSlippage(v)}
                  style={{ padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:600, fontFamily:'Space Grotesk', background:slippage===v?'#3d7eff':'rgba(22,32,64,0.8)', color:slippage===v?'#fff':'#9ab0d4', border:'none', cursor:'pointer' }}>
                  {v}%
                </button>
              ))}
              <input type="number" value={slippage} onChange={e => setSlippage(e.target.value)}
                style={{ width:64, padding:'6px 8px', borderRadius:8, fontSize:12, color:'#fff', textAlign:'center', background:'rgba(22,32,64,0.8)', border:'1px solid rgba(30,46,74,0.8)', outline:'none' }}
                placeholder="Custom" />
            </div>
          </div>
        )}

        <div className="swap-input rounded-2xl p-4 mb-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-portal-muted">You pay</span>
            {account && <button onClick={() => setAmountIn(balanceIn)} style={{ fontSize:12, color:'#9ab0d4', background:'none', border:'none', cursor:'pointer' }}>Balance: {parseFloat(balanceIn).toFixed(4)}</button>}
          </div>
          <div className="flex items-center gap-3">
            <input type="number" value={amountIn} onChange={e => setAmountIn(e.target.value)} placeholder="0"
              style={{ flex:1, background:'transparent', fontSize:28, fontWeight:600, color:'#e8f0ff', fontFamily:'Space Grotesk', outline:'none', border:'none', minWidth:0 }} />
            <TokenSelect selectedToken={tokenIn} onSelect={setTokenIn} otherToken={tokenOut} />
          </div>
        </div>

        <div className="flex justify-center -my-3 relative z-10">
          <button onClick={() => { setTokenIn(tokenOut); setTokenOut(tokenIn); setAmountIn(amountOut); setAmountOut(amountIn); }}
            className="swap-arrow w-10 h-10 rounded-xl flex items-center justify-center">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9ab0d4" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        <div className="swap-input rounded-2xl p-4 mt-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-portal-muted">You receive</span>
            {account && <span style={{ fontSize:12, color:'#4e6490' }}>Balance: {parseFloat(balanceOut).toFixed(4)}</span>}
          </div>
          <div className="flex items-center gap-3">
            <input type="number" value={amountOut} readOnly placeholder="0"
              style={{ flex:1, background:'transparent', fontSize:28, fontWeight:600, color:'#e8f0ff', fontFamily:'Space Grotesk', outline:'none', border:'none', minWidth:0 }} />
            <TokenSelect selectedToken={tokenOut} onSelect={setTokenOut} otherToken={tokenIn} />
          </div>
        </div>

        {amountIn && amountOut && parseFloat(amountOut) > 0 && (
          <div className="mt-3 px-4 py-3 rounded-2xl space-y-1.5" style={{ background:'rgba(7,9,15,0.5)', border:'1px solid rgba(30,46,74,0.4)' }}>
            {route && <div className="flex justify-between text-xs"><span className="text-portal-muted">Route</span><span style={{ fontSize:11, color:'#3d7eff', fontFamily:'Space Grotesk', fontWeight:600 }}>{route}</span></div>}
            <div className="flex justify-between text-xs"><span className="text-portal-muted">Rate</span><span className="text-portal-sub">1 {tokenIn?.symbol} = {(parseFloat(amountOut)/parseFloat(amountIn)).toFixed(6)} {tokenOut?.symbol}</span></div>
            {priceImpact && (
              <div className="flex justify-between text-xs">
                <span className="text-portal-muted">Price impact</span>
                <span style={{ color:parseFloat(priceImpact)>5?'#ef4444':parseFloat(priceImpact)>2?'#f5ac37':'#10b981', fontWeight:600 }}>{priceImpact}% {parseFloat(priceImpact)>3?'⚠':''}</span>
              </div>
            )}
            <div className="flex justify-between text-xs"><span className="text-portal-muted">Fee</span><span className="text-portal-sub">0.3%</span></div>
            {gasEstimate && (
              <div className="flex justify-between text-xs">
                <span className="text-portal-muted">Est. gas cost</span>
                <span style={{ color: '#9ab0d4' }}>~{gasEstimate} tPOTv3</span>
              </div>
            )}
          </div>
        )}

        <button onClick={account?(isCorrectChain?handleSwap:wallet.switchNetwork):connect}
          disabled={btnDisabled()}
          className="btn-primary w-full mt-4 py-4 rounded-2xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ fontFamily:'Space Grotesk', fontSize:16 }}>
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/><path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Swapping…
            </span>
          ) : btnLabel()}
        </button>
      </div>
    </>
  );
}
