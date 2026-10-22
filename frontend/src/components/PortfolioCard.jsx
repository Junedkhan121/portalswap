import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { TOKENS, ADDRESSES, NATIVE_SYMBOL, RPC_URL } from '../utils/addresses';
import { ERC20_ABI, FACTORY_ABI, PAIR_ABI } from '../utils/abis';
import { TokenAvatar } from './TokenSelect';

const RPC = new ethers.JsonRpcProvider(RPC_URL);

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function PortfolioCard({ wallet, swapEvents }) {
  const { account, signer } = wallet;
  const [balances, setBalances] = useState([]);
  const [prices, setPrices]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [history, setHistory]   = useState([]);
  const [lpPositions, setLpPositions] = useState([]);
  const [tab, setTab]           = useState('portfolio');

  // Load tx history from sessionStorage
  useEffect(() => {
    const load = () => setHistory(JSON.parse(sessionStorage.getItem('ps_history') || '[]'));
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [swapEvents]);

  // Refresh when a new swap fires
  useEffect(() => {
    if (swapEvents) setHistory(JSON.parse(sessionStorage.getItem('ps_history') || '[]'));
  }, [swapEvents]);

  const fetchBalances = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    try {
      const provider = signer?.provider || RPC;
      const results = await Promise.all(TOKENS.map(async (t) => {
        try {
          let raw;
          if (t.isNative) {
            raw = await provider.getBalance(account);
            return { ...t, balance: ethers.formatEther(raw), rawBal: raw };
          }
          if (t.address === ethers.ZeroAddress || !t.address || t.address === '0x0000000000000000000000000000000000000000') {
            return { ...t, balance: '0', rawBal: 0n };
          }
          const c = new ethers.Contract(t.address, ERC20_ABI, provider);
          raw = await c.balanceOf(account);
          return { ...t, balance: ethers.formatUnits(raw, t.decimals), rawBal: raw };
        } catch { return { ...t, balance: '0', rawBal: 0n }; }
      }));
      setBalances(results);

      // Fetch prices in tPOTv3 from pools
      try {
        const factory = new ethers.Contract(ADDRESSES.Factory, FACTORY_ABI, provider);
        const priceMap = {};
        for (const t of TOKENS) {
          if (t.isNative || t.symbol === 'WPOT') continue;
          if (!t.address || t.address === ethers.ZeroAddress) continue;
          const pairAddr = await factory.getPair(ADDRESSES.WPOT, t.address);
          if (!pairAddr || pairAddr === ethers.ZeroAddress) continue;
          const pair = new ethers.Contract(pairAddr, PAIR_ABI, provider);
          const [token0, res] = await Promise.all([pair.token0(), pair.getReserves()]);
          const wpotIsToken0 = ADDRESSES.WPOT.toLowerCase() === token0.toLowerCase();
          const rWPOT = parseFloat(ethers.formatEther(wpotIsToken0 ? res[0] : res[1]));
          const rTok  = parseFloat(ethers.formatUnits(wpotIsToken0 ? res[1] : res[0], t.decimals));
          if (rTok > 0) priceMap[t.symbol] = rWPOT / rTok;
        }
        priceMap['tPOTv3'] = 1;
        priceMap['WPOT']   = 1;
        setPrices(priceMap);
      } catch { /* prices optional */ }

      // Fetch LP positions
      try {
        const factory2 = new ethers.Contract(ADDRESSES.Factory, FACTORY_ABI, provider);
        const pairCount = await factory2.allPairsLength();
        const lps = [];
        for (let i = 0; i < Number(pairCount) && i < 20; i++) {
          try {
            const pairAddr = await factory2.allPairs(i);
            const pair = new ethers.Contract(pairAddr, PAIR_ABI, provider);
            const [lpBal, total, t0Addr, t1Addr, reserves] = await Promise.all([
              pair.balanceOf(account), pair.totalSupply(),
              pair.token0(), pair.token1(), pair.getReserves()
            ]);
            if (lpBal === 0n) continue;
            const share = Number(lpBal) / Number(total);
            const tok0 = TOKENS.find(t => t.address?.toLowerCase() === t0Addr.toLowerCase()) || { symbol: t0Addr.slice(0,6), decimals: 18 };
            const tok1 = TOKENS.find(t => t.address?.toLowerCase() === t1Addr.toLowerCase()) || { symbol: t1Addr.slice(0,6), decimals: 18 };
            lps.push({
              address: pairAddr,
              token0: tok0.symbol === 'WPOT' ? { ...tok0, symbol: 'tPOTv3' } : tok0,
              token1: tok1.symbol === 'WPOT' ? { ...tok1, symbol: 'tPOTv3' } : tok1,
              share: (share * 100).toFixed(2),
              amount0: (parseFloat(ethers.formatUnits(reserves[0], tok0.decimals)) * share).toFixed(4),
              amount1: (parseFloat(ethers.formatUnits(reserves[1], tok1.decimals)) * share).toFixed(4),
              lpBalance: ethers.formatEther(lpBal),
            });
          } catch { /* skip */ }
        }
        setLpPositions(lps);
      } catch { /* lp optional */ }
    } finally { setLoading(false); }
  }, [account, signer]);

  useEffect(() => { fetchBalances(); }, [fetchBalances]);

  const totalValue = balances.reduce((sum, t) => {
    const price = prices[t.symbol] ?? 0;
    return sum + parseFloat(t.balance || 0) * price;
  }, 0);

  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(30,46,74,0.6)', padding: '0 20px' }}>
        {['portfolio', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '16px 4px', marginRight: 24, fontSize: 14, fontWeight: 600,
              fontFamily: 'Space Grotesk', background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t ? '#fff' : '#4e6490',
              borderBottom: tab === t ? '2px solid #3d7eff' : '2px solid transparent',
              transition: 'all 0.15s', marginBottom: -1,
            }}>
            {t === 'portfolio' ? 'Portfolio' : 'Tx History'}
          </button>
        ))}
        <button onClick={fetchBalances} style={{ marginLeft: 'auto', alignSelf: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#4e6490', padding: 4 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
            style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div style={{ padding: 20 }}>
        {tab === 'portfolio' ? (
          <>
            {!account ? (
              <p style={{ textAlign: 'center', color: '#4e6490', fontSize: 14, padding: '32px 0' }}>Connect your wallet to see balances</p>
            ) : (
              <>
                {/* Total value */}
                <div style={{ textAlign: 'center', padding: '16px 0 20px' }}>
                  <p style={{ fontSize: 12, color: '#4e6490', marginBottom: 4 }}>Total Portfolio Value</p>
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 32, color: '#e8f0ff' }}>
                    {totalValue.toFixed(4)} <span style={{ fontSize: 16, color: '#4e6490' }}>{NATIVE_SYMBOL}</span>
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {balances.filter(t => parseFloat(t.balance) > 0 || t.isNative).map(t => {
                    const price = prices[t.symbol] ?? 0;
                    const value = parseFloat(t.balance || 0) * price;
                    return (
                      <div key={t.symbol} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, background: 'rgba(7,9,15,0.5)', border: '1px solid rgba(30,46,74,0.5)' }}>
                        <TokenAvatar token={t} size={40} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: '#e8f0ff' }}>{t.symbol}</p>
                          <p style={{ fontSize: 12, color: '#4e6490' }}>{t.name}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: '#e8f0ff' }}>
                            {parseFloat(t.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                          </p>
                          {price > 0 && (
                            <p style={{ fontSize: 12, color: '#4e6490' }}>{value.toFixed(4)} {NATIVE_SYMBOL}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {history.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#4e6490', fontSize: 14, padding: '32px 0' }}>No swaps yet. Execute a swap to see history here.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((tx, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, background: 'rgba(7,9,15,0.5)', border: '1px solid rgba(30,46,74,0.5)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: '#e8f0ff' }}>
                        {parseFloat(tx.amountIn).toFixed(4)} {tx.from} → {parseFloat(tx.amountOut).toFixed(4)} {tx.to}
                      </p>
                      <p style={{ fontSize: 11, color: '#4e6490' }}>{timeAgo(tx.time)}</p>
                    </div>
                    <a href={`https://test-evm-rpc-v3.portaldot.dev`} target="_blank" rel="noopener noreferrer"
                      title={tx.hash}
                      style={{ fontSize: 11, color: '#3d7eff', fontFamily: 'monospace', background: 'rgba(61,126,255,0.1)', padding: '3px 8px', borderRadius: 6, textDecoration: 'none' }}>
                      {tx.hash.slice(0, 8)}…
                    </a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
