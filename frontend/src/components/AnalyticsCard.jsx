import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { ADDRESSES, TOKENS, RPC_URL } from '../utils/addresses';
import { FACTORY_ABI, PAIR_ABI } from '../utils/abis';
import { TokenAvatar } from './TokenSelect';

// Compute pool health from reserves
function getPoolHealth(r0, r1) {
  const a = parseFloat(r0), b = parseFloat(r1);
  if (a === 0 || b === 0) return { label: 'Empty', color: 'var(--text-muted)', bg: 'rgba(78,100,144,0.12)', border: 'rgba(78,100,144,0.3)' };
  const ratio = a / b;
  const tvl = a + b; // rough proxy (same-unit comparison)
  if (tvl < 10) return { label: 'Low Liquidity', color: 'var(--accent-yellow)', bg: 'rgba(245,172,55,0.1)', border: 'rgba(245,172,55,0.3)' };
  if (ratio < 0.1 || ratio > 10) return { label: 'Imbalanced', color: 'var(--text-error)', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' };
  return { label: 'Healthy', color: 'var(--text-success)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' };
}

function HealthBadge({ r0, r1 }) {
  const h = getPoolHealth(r0, r1);
  return (
    <span style={{ fontSize: 11, fontFamily: 'var(--font-primary)', fontWeight: 600, color: h.color, background: h.bg, border: `1px solid ${h.border}`, borderRadius: 8, padding: '2px 8px', flexShrink: 0 }}>
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

    async function buildAndMount() {
      // Fetch real Sync event history from chain
      let priceData = [];
      try {
        const provider = wallet.signer?.provider || new ethers.JsonRpcProvider(RPC_URL);
        const pair = new ethers.Contract(selectedPool.address, PAIR_ABI, provider);
        const currentBlock = await provider.getBlockNumber();
        // Look back up to 10 000 blocks (~last few hours on fast chains)
        const fromBlock = Math.max(0, currentBlock - 10000);
        const syncEvents = await pair.queryFilter(pair.filters.Sync(), fromBlock, currentBlock);
        if (syncEvents.length > 1) {
          const step = Math.max(1, Math.floor(syncEvents.length / 120));
          for (let i = 0; i < syncEvents.length; i += step) {
            const ev = syncEvents[i];
            const r0 = parseFloat(ethers.formatUnits(ev.args[0], selectedPool.token0.decimals ?? 18));
            const r1 = parseFloat(ethers.formatUnits(ev.args[1], selectedPool.token1.decimals ?? 18));
            if (r0 > 0 && r1 > 0) {
              // Use block number as time proxy (lightweight-charts needs monotone int seconds)
              priceData.push({ time: ev.blockNumber, value: r1 / r0 });
            }
          }
          // Deduplicate by time (block number), keep last per block
          const byTime = {};
          for (const pt of priceData) byTime[pt.time] = pt.value;
          priceData = Object.entries(byTime)
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([t, v]) => ({ time: Number(t), value: v }));
        }
      } catch (e) {
        console.warn('AnalyticsCard: could not fetch Sync history', e);
      }

      // Fall back to single current-price point if no history
      if (priceData.length < 2) {
        const r0 = parseFloat(selectedPool.reserve0), r1 = parseFloat(selectedPool.reserve1);
        const price = r0 > 0 && r1 > 0 ? r1 / r0 : 1;
        const now = Math.floor(Date.now() / 1000);
        priceData = [{ time: now - 1, value: price }, { time: now, value: price }];
      }

      if (disposed || !chartRef.current) return;

      const { createChart } = await import('lightweight-charts');
      if (disposed || !chartRef.current) return;

      // IMPORTANT: lightweight-charts v4 parses every color internally.
      // CSS variables (var(--...)) throw "Cannot parse color" and crash the chart.
      // Always pass literal hex / rgba() values here.
      localChart = createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: 240,
        watermark: { visible: false },
        attributionLogo: false,
        layout: {
          background: { color: '#00000000' }, // fully transparent via 8-digit hex
          textColor: '#9ab0d4',               // --text-secondary
          fontSize: 11,
        },
        grid: {
          vertLines: { color: 'rgba(30,46,74,0.6)' },   // --border-secondary
          horzLines: { color: 'rgba(30,46,74,0.6)' },
        },
        timeScale: { borderColor: 'rgba(30,46,74,0.8)', timeVisible: false },
        rightPriceScale: { borderColor: 'rgba(30,46,74,0.8)' },
        crosshair: {
          vertLine: { color: 'rgba(61,126,255,0.5)' },
          horzLine: { color: 'rgba(61,126,255,0.5)' },
        },
      });

      const series = localChart.addAreaSeries({
        lineColor: '#3d7eff',                   // --accent-blue
        topColor: 'rgba(61,126,255,0.25)',
        bottomColor: 'rgba(61,126,255,0.0)',
        lineWidth: 2,
      });
      series.setData(priceData);
      localChart.timeScale().fitContent();
      chartInstance.current = localChart;
      resizeHandler = () => {
        if (chartRef.current && localChart) localChart.applyOptions({ width: chartRef.current.clientWidth });
      };
      window.addEventListener('resize', resizeHandler);
    }

    buildAndMount();

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
          <svg className="animate-spin h-5 w-5" style={{ color: 'var(--accent-blue)' }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
            <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading analytics…</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Chart */}
      <div className="glass-card rounded-3xl p-5">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>Price Chart</h2>
          {selectedPool && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}>
                {selectedPool.token0.symbol} / {selectedPool.token1.symbol}
              </span>
              <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                {(parseFloat(selectedPool.reserve1) / parseFloat(selectedPool.reserve0) || 0).toFixed(4)}
              </span>
            </div>
          )}
        </div>
        {selectedPool ? (
          <div ref={chartRef} style={{ borderRadius: 12, overflow: 'hidden', height: 240 }} />
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px 0', fontSize: 14 }}>
            No pools found. Add liquidity to see charts.
          </p>
        )}
      </div>

      {/* Pool list */}
      <div className="glass-card rounded-3xl p-5">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>All Pools</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-primary)', fontWeight: 600,
            background: 'var(--bg-badge)', border: '1px solid var(--border-accent)', borderRadius: 8, padding: '3px 10px' }}>
            {pools.length} pools
          </span>
        </div>
        {pools.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>
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
                    background: isActive ? 'rgba(61,126,255,0.1)' : 'var(--bg-menu-item)',
                    outline: isActive ? '1px solid var(--border-accent)' : '1px solid var(--border-secondary)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background='var(--bg-menu-item-hover)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='var(--bg-menu-item)'; }}>
                  {/* Token pair avatars */}
                  <div style={{ display: 'flex', position: 'relative', width: 52, height: 32, flexShrink: 0 }}>
                    <TokenAvatar token={pool.token0} size={32} />
                    <div style={{ position: 'absolute', left: 20 }}>
                      <TokenAvatar token={pool.token1} size={32} />
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {pool.token0.symbol} / {pool.token1.symbol}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pool #{idx + 1}</p>
                  </div>
                  {/* Reserves */}
                  <div style={{ textAlign: 'right', marginRight: 10 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)', fontWeight: 500 }}>
                      {parseFloat(pool.reserve0).toFixed(2)}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)', fontWeight: 500 }}>
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