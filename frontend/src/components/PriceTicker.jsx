import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { TOKENS, ADDRESSES, RPC_URL, NATIVE_SYMBOL } from '../utils/addresses';
import { FACTORY_ABI, PAIR_ABI } from '../utils/abis';

const TOKEN_COLORS = {
  pUSDT: 'var(--accent-green)', pDAI: 'var(--accent-yellow)', pWBTC: 'var(--accent-orange)', pLINK: 'var(--accent-blue)',
};

export default function PriceTicker() {
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const load = async () => {
      if (ADDRESSES.Factory === ethers.ZeroAddress) return;
      try {
        const factory = new ethers.Contract(ADDRESSES.Factory, FACTORY_ABI, provider);
        const items = [];
        for (const t of TOKENS) {
          if (t.isNative || t.symbol === 'WPOT') continue;
          if (!t.address || t.address === '0x0000000000000000000000000000000000000000') continue;
          try {
            const pairAddr = await factory.getPair(ADDRESSES.WPOT, t.address);
            if (!pairAddr || pairAddr === ethers.ZeroAddress) continue;
            const pair = new ethers.Contract(pairAddr, PAIR_ABI, provider);
            const [token0, res] = await Promise.all([pair.token0(), pair.getReserves()]);
            const wpotIs0 = ADDRESSES.WPOT.toLowerCase() === token0.toLowerCase();
            const rW = parseFloat(ethers.formatEther(wpotIs0 ? res[0] : res[1]));
            const rT = parseFloat(ethers.formatUnits(wpotIs0 ? res[1] : res[0], t.decimals));
            if (rT > 0) items.push({ symbol: t.symbol, price: rW / rT });
          } catch { /* pair missing */ }
        }
        if (items.length > 0) setPrices(items);
      } catch { /* silent */ }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  if (prices.length === 0) return null;

  const speed = Math.max(prices.length * 8, 20); // seconds for one full pass

  const Item = ({ item }) => {
    const color = TOKEN_COLORS[item.symbol] || 'var(--text-secondary)';
    const fmt = item.price < 0.0001
      ? item.price.toExponential(2)
      : item.price < 1
      ? item.price.toFixed(6)
      : item.price.toFixed(4);
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '0 28px', flexShrink: 0, whiteSpace: 'nowrap',
      }}>
        {/* Color dot */}
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 5px ${color}99` }} />
        {/* Symbol */}
        <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>
          {item.symbol}
        </span>
        {/* Price */}
        <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: 12, color: color }}>
          {fmt}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{NATIVE_SYMBOL}</span>
        {/* Divider */}
        <span style={{ width: 1, height: 12, background: 'var(--border-primary)', marginLeft: 4, flexShrink: 0 }} />
      </span>
    );
  };

  return (
    <div style={{
      borderBottom: '1px solid var(--border-primary)',
      background: 'var(--bg-primary)',
      height: 34,
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* CSS for animation — two identical copies, shift by exactly 50% */}
      <style>{`
        @keyframes scroll-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ticker-inner {
          display: inline-flex;
          align-items: center;
          animation: scroll-ticker ${speed}s linear infinite;
          will-change: transform;
        }
        .ticker-inner:hover { animation-play-state: paused; }
      `}</style>

      {/* LIVE badge — fixed on left, starts AFTER the badge width so ticker fills full width */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 2,
        display: 'flex', alignItems: 'center',
        padding: '0 10px',
        background: 'linear-gradient(90deg, var(--bg-primary) 75%, transparent)',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 9,
          color: 'var(--accent-green)', letterSpacing: '0.12em',
          background: 'rgba(16,185,129,0.12)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 4, padding: '2px 6px',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
          LIVE
        </span>
      </div>

      {/* Right fade */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, zIndex: 2,
        background: 'linear-gradient(270deg, var(--bg-primary) 30%, transparent)',
        pointerEvents: 'none',
      }} />

      {/* Scrolling track — two identical halves for seamless loop, no left padding so no gap */}
      <div className="ticker-inner">
        {/* First copy */}
        {prices.map((item, i) => <Item key={`a-${i}`} item={item} />)}
        {/* Second copy — identical, seamless loop */}
        {prices.map((item, i) => <Item key={`b-${i}`} item={item} />)}
      </div>
    </div>
  );
}