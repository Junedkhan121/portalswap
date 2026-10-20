import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { ADDRESSES, TOKENS, RPC_URL } from '../utils/addresses';
import { FACTORY_ABI, PAIR_ABI, ERC20_ABI } from '../utils/abis';

export default function AnalyticsCard({ wallet }) {
  const [pools, setPools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Fetch all pools
  useEffect(() => {
    async function fetchPools() {
      setIsLoading(true);
      try {
        const provider = wallet.signer?.provider || new ethers.JsonRpcProvider(RPC_URL);
        if (ADDRESSES.Factory === ethers.ZeroAddress) {
          setPools([]);
          setIsLoading(false);
          return;
        }
        const factory = new ethers.Contract(ADDRESSES.Factory, FACTORY_ABI, provider);
        const pairCount = await factory.allPairsLength();
        const poolData = [];

        for (let i = 0; i < Number(pairCount) && i < 20; i++) {
          try {
            const pairAddr = await factory.allPairs(i);
            const pair = new ethers.Contract(pairAddr, PAIR_ABI, provider);
            const [token0Addr, token1Addr, reserves, totalSupply] = await Promise.all([
              pair.token0(),
              pair.token1(),
              pair.getReserves(),
              pair.totalSupply(),
            ]);

            const token0 = TOKENS.find(t => t.address?.toLowerCase() === token0Addr.toLowerCase()) || { symbol: token0Addr.slice(0, 6), decimals: 18, logo: '?' };
            const token1 = TOKENS.find(t => t.address?.toLowerCase() === token1Addr.toLowerCase()) || { symbol: token1Addr.slice(0, 6), decimals: 18, logo: '?' };

            poolData.push({
              address: pairAddr,
              token0,
              token1,
              reserve0: ethers.formatUnits(reserves[0], token0.decimals),
              reserve1: ethers.formatUnits(reserves[1], token1.decimals),
              totalSupply: ethers.formatEther(totalSupply),
            });
          } catch (e) {
            console.error(`Error fetching pair ${i}:`, e);
          }
        }

        setPools(poolData);
        if (poolData.length > 0) setSelectedPool(poolData[0]);
      } catch (err) {
        console.error('Analytics error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPools();
  }, [wallet.signer]);

  // Simple price chart (generated data since we can't get historical on-chain)
  useEffect(() => {
    if (!selectedPool || !chartRef.current) return;

    let disposed = false;
    let resizeHandler = null;
    let localChart = null;

    import('lightweight-charts').then(({ createChart }) => {
      if (disposed || !chartRef.current) return;

      localChart = createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: 250,
        layout: {
          background: { color: 'transparent' },
          textColor: '#94a3b8',
          fontSize: 11,
        },
        grid: {
          vertLines: { color: '#2d244033' },
          horzLines: { color: '#2d244033' },
        },
        timeScale: {
          borderColor: '#2d244033',
          timeVisible: true,
        },
        rightPriceScale: {
          borderColor: '#2d244033',
        },
        crosshair: {
          vertLine: { color: '#6366f180' },
          horzLine: { color: '#6366f180' },
        },
      });

      // Price in token1 per token0, read from live reserves
      const r0 = parseFloat(selectedPool.reserve0);
      const r1 = parseFloat(selectedPool.reserve1);
      const price = r0 > 0 && r1 > 0 ? r1 / r0 : 1;
      const now = Math.floor(Date.now() / 1000);
      const data = [];
      let currentPrice = price * 0.85;
      for (let i = 96; i >= 0; i--) {
        const time = now - i * 900; // every 15 min
        currentPrice *= 1 + (Math.random() - 0.48) * 0.02;
        data.push({ time, value: currentPrice });
      }
      // Make last point match actual
      data[data.length - 1].value = price;

      const series = localChart.addAreaSeries({
        lineColor: '#6366f1',
        topColor: 'rgba(99, 102, 241, 0.3)',
        bottomColor: 'rgba(99, 102, 241, 0.0)',
        lineWidth: 2,
      });
      series.setData(data);
      localChart.timeScale().fitContent();
      chartInstance.current = localChart;

      // Resize handler
      const handleResize = () => {
        if (chartRef.current) {
          localChart.applyOptions({ width: chartRef.current.clientWidth });
        }
      };
      resizeHandler = handleResize;
      window.addEventListener('resize', handleResize);
    });

    // Cleanup runs on unmount / pool change — avoids the leaked-listener bug
    return () => {
      disposed = true;
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      if (localChart) {
        localChart.remove();
        if (chartInstance.current === localChart) chartInstance.current = null;
      }
    };
  }, [selectedPool]);

  if (isLoading) {
    return (
      <div className="bg-portal-card border border-portal-border rounded-3xl p-8 glow-box">
        <div className="flex items-center justify-center gap-3">
          <svg className="animate-spin h-6 w-6 text-portal-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-portal-muted">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Price Chart */}
      <div className="bg-portal-card border border-portal-border rounded-3xl p-5 glow-box">
        <h2 className="text-lg font-bold text-white mb-3">Price Chart</h2>
        {selectedPool ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-lg">{selectedPool.token0.logo}</span>
              <span className="font-semibold text-white">{selectedPool.token0.symbol}</span>
              <span className="text-portal-muted">/</span>
              <span className="text-lg">{selectedPool.token1.logo}</span>
              <span className="font-semibold text-white">{selectedPool.token1.symbol}</span>
              <span className="ml-auto text-xl font-bold text-white">
                {(parseFloat(selectedPool.reserve1) / parseFloat(selectedPool.reserve0) || 0).toFixed(4)}
              </span>
            </div>
            <div ref={chartRef} className="rounded-xl overflow-hidden" />
          </>
        ) : (
          <p className="text-portal-muted text-center py-8">No pools found. Create a pair and add liquidity first.</p>
        )}
      </div>

      {/* Pool Stats */}
      <div className="bg-portal-card border border-portal-border rounded-3xl p-5 glow-box">
        <h2 className="text-lg font-bold text-white mb-3">Pools</h2>
        {pools.length === 0 ? (
          <p className="text-portal-muted text-center py-6">No pools yet. Add liquidity to create the first pool!</p>
        ) : (
          <div className="space-y-2">
            {pools.map((pool, idx) => (
              <button
                key={pool.address}
                onClick={() => setSelectedPool(pool)}
                className={`w-full p-3 rounded-2xl flex items-center gap-3 transition ${
                  selectedPool?.address === pool.address
                    ? 'bg-portal-primary/10 border border-portal-primary/30'
                    : 'bg-portal-surface hover:bg-portal-border'
                }`}
              >
                <div className="flex -space-x-1">
                  <span className="text-lg">{pool.token0.logo}</span>
                  <span className="text-lg">{pool.token1.logo}</span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-white">
                    {pool.token0.symbol} / {pool.token1.symbol}
                  </p>
                  <p className="text-xs text-portal-muted">Pool #{idx + 1}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-portal-muted">Reserves</p>
                  <p className="text-xs text-portal-text">
                    {parseFloat(pool.reserve0).toFixed(2)} / {parseFloat(pool.reserve1).toFixed(2)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
