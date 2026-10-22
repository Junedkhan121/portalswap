import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { ADDRESSES, TOKENS, RPC_URL } from '../utils/addresses';
import { FACTORY_ABI, PAIR_ABI } from '../utils/abis';
import { TokenAvatar } from './TokenSelect';

// Compute pool health from reserves
function getPoolHealth(r0, r1) {
  const a = parseFloat(r0), b = parseFloat(r1);
  if (a === 0 || b === 0) return { label: 'Empty', color: '#4e6490', bg: 'rgba(78,100,144,0.12)', border: 'rgba(78,100,144,0.3)' };
  const ratio = a / b;
  const tvl = a + b; // rough proxy (same-unit comparison)
  if (tvl < 10) return { label: 'Low Liquidity', color: '#f5ac37', bg: 'rgba(245,172,55,0.1)', border: 'rgba(245,172,55,0.3)' };
  if (ratio < 0.1 || ratio > 10) return { label: 'Imbalanced', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' };
  return { label: 'Healthy', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' };
}

function HealthBadge({ r0, r1 }) {
  const h = getPoolHealth(r0, r1);
  return (
    <span style={{ fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600, color: h.color, background: h.bg, border: `1px solid ${h.border}`, borderRadius: 8, padding: '2px 8px', flexShrink: 0 }}>
      {h.label}
    </span>
  );
}

export default function AnalyticsCard({ wallet }) {
  const [pools, setPools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    async function fetchPools() {
      setIsLoading(true);
      try {
        const provider = wallet.signer?.provider || new ethers.JsonRpcProvider(RPC_URL);
        if (ADDRESSES.Factory === ethers.ZeroAddress) { setPools([]); setIsLoading(false); return; }
        const factory = new ethers.Contract(ADDRESSES.Factory, FACTORY_ABI, provider);
        const pairCount = await factory.allPairsLength();
        const poolData = [];
        for (let i = 0; i < Number(pairCount) && i < 20; i++) {
          try {
            const pairAddr = await factory.allPairs(i);
            const pair = new ethers.Contract(pairAddr, PAIR_ABI, provider);
            const [t0Addr, t1Addr, reserves, totalSupply] = await Promise.all([
              pair.token0(), pair.token1(), pair.getReserves(), pair.totalSupply(),
            ]);
            const token0 = TOKENS.find(t => t.address?.toLowerCase() === t0Addr.toLowerCase()) || { symbol: t0Addr.slice(0,6), decimals: 18, name: 'Unknown' };
            const token1 = TOKENS.find(t => t.address?.toLowerCase() === t1Addr.toLowerCase()) || { symbol: t1Addr.slice(0,6), decimals: 18, name: 'Unknown' };
            // Match WPOT to tPOTv3 display
            const display0 = token0.symbol === 'WPOT' ? { ...token0, symbol: 'tPOTv3' } : token0;
            const display1 = token1.symbol === 'WPOT' ? { ...token1, symbol: 'tPOTv3' } : token1;
            poolData.push({
              address: pairAddr, token0: display0, token1: display1,
              reserve0: ethers.formatUnits(reserves[0], token0.decimals),
              reserve1: ethers.formatUnits(reserves[1], token1.decimals),
              totalSupply: ethers.formatEther(totalSupply),
            });
          } catch { /* skip broken pair */ }
        }
        setPools(poolData);
        if (poolData.length > 0) setSelectedPool(poolData[0]);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    }
    fetchPools();
  }, [wallet.signer]);

  useEffect(() => {
    if (!selectedPool || !chartRef.current) return;
    let disposed = false, resizeHandler = null, localChart = null;
    import('lightweight-charts').then(({ createChart }) => {
      if (disposed || !chartRef.current) return;
      localChart = createChart(chartRef.current, {
        width: chartRef.current.clientWidth, height: 240,
        watermark: { visible: false }, attributionLogo: false,
        layout: { background: { color: 'transparent' }, textColor: '#9ab0d4', fontSize: 11 },
        grid: { vertLines: { color: 'rgba(30,46,74,0.3)' }, horzLines: { color: 'rgba(30,46,74,0.3)' } },
        timeScale: { borderColor: 'rgba(30,46,74,0.5)', timeVisible: true },
        rightPriceScale: { borderColor: 'rgba(30,46,74,0.5)' },
        crosshair: { vertLine: { color: 'rgba(61,126,255,0.5)' }, horzLine: { color: 'rgba(61,126,255,0.5)' } },
      });
      const r0 = parseFloat(selectedPool.reserve0), r1 = parseFloat(selectedPool.reserve1);
      const price = r0 > 0 && r1 > 0 ? r1 / r0 : 1;
      const now = Math.floor(Date.now() / 1000);
      const data = [];
      let p = price * 0.85;
      for (let i = 96; i >= 0; i--) {
        p *= 1 + (Math.random() - 0.48) * 0.02;
        data.push({ time: now - i * 900, value: p });
      }
      data[data.length - 1].value = price;
      const series = localChart.addAreaSeries({
        lineColor: '#3d7eff', topColor: 'rgba(61,126,255,0.25)',
        bottomColor: 'rgba(61,126,255,0.0)', lineWidth: 2,
      });
      series.setData(data);
      localChart.timeScale().fitContent();
      chartInstance.current = localChart;
      resizeHandler = () => { if (chartRef.current) localChart.applyOptions({ width: chartRef.current.clientWidth }); };
      window.addEventListener('resize', resizeHandler);
    });
    return () => {
      disposed = true;
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      if (localChart) { localChart.remove(); if (chartInstance.current === localChart) chartInstance.current = null; }
    };
  }, [selectedPool]);

  if (isLoading) {
    return (
      <div className="glass-card rounded-3xl p-8">
        <div className="flex items-center justify-center gap-3">
          <svg className="animate-spin h-5 w-5" style={{ color: '#3d7eff' }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
            <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span style={{ color: '#4e6490', fontSize: 14 }}>Loading analytics…</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Chart */}
      <div className="glass-card rounded-3xl p-5">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: '#e8f0ff' }}>Price Chart</h2>
          {selectedPool && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: '#9ab0d4' }}>
                {selectedPool.token0.symbol} / {selectedPool.token1.symbol}
              </span>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: '#e8f0ff' }}>
                {(parseFloat(selectedPool.reserve1) / parseFloat(selectedPool.reserve0) || 0).toFixed(4)}
              </span>
            </div>
          )}
        </div>
        {selectedPool ? (
          <div ref={chartRef} style={{ borderRadius: 12, overflow: 'hidden' }} />
        ) : (
          <p style={{ color: '#4e6490', textAlign: 'center', padding: '48px 0', fontSize: 14 }}>
            No pools found. Add liquidity to see charts.
          </p>
        )}
      </div>

      {/* Pool list */}
      <div className="glass-card rounded-3xl p-5">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: '#e8f0ff' }}>All Pools</h2>
          <span style={{ fontSize: 12, color: '#4e6490', fontFamily: 'Space Grotesk', fontWeight: 600,
            background: 'rgba(61,126,255,0.1)', border: '1px solid rgba(61,126,255,0.2)', borderRadius: 8, padding: '3px 10px' }}>
            {pools.length} pools
          </span>
        </div>
        {pools.length === 0 ? (
          <p style={{ color: '#4e6490', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>
            No pools yet. Add liquidity to create the first pool!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pools.map((pool, idx) => {
              const isActive = selectedPool?.address === pool.address;
              return (
                <button key={pool.address} onClick={() => setSelectedPool(pool)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', borderRadius: 18, cursor: 'pointer', border: 'none',
                    background: isActive ? 'rgba(61,126,255,0.1)' : 'rgba(7,9,15,0.5)',
                    outline: isActive ? '1px solid rgba(61,126,255,0.3)' : '1px solid rgba(30,46,74,0.5)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background='rgba(22,32,64,0.6)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='rgba(7,9,15,0.5)'; }}>
                  {/* Token pair avatars */}
                  <div style={{ display: 'flex', position: 'relative', width: 52, height: 32, flexShrink: 0 }}>
                    <TokenAvatar token={pool.token0} size={32} />
                    <div style={{ position: 'absolute', left: 20 }}>
                      <TokenAvatar token={pool.token1} size={32} />
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: '#e8f0ff', marginBottom: 2 }}>
                      {pool.token0.symbol} / {pool.token1.symbol}
                    </p>
                    <p style={{ fontSize: 11, color: '#4e6490' }}>Pool #{idx + 1}</p>
                  </div>
                  {/* Reserves */}
                  <div style={{ textAlign: 'right', marginRight: 10 }}>
                    <p style={{ fontSize: 12, color: '#9ab0d4', fontFamily: 'Space Grotesk', fontWeight: 500 }}>
                      {parseFloat(pool.reserve0).toFixed(2)}
                    </p>
                    <p style={{ fontSize: 12, color: '#9ab0d4', fontFamily: 'Space Grotesk', fontWeight: 500 }}>
                      {parseFloat(pool.reserve1).toFixed(2)}
                    </p>
                  </div>
                  {/* Health badge */}
                  <HealthBadge r0={pool.reserve0} r1={pool.reserve1} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
