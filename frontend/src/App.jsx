import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useWallet } from './hooks/useWallet';
import Header from './components/Header';
import SwapCard from './components/SwapCard';
import LiquidityCard from './components/LiquidityCard';
import AnalyticsCard from './components/AnalyticsCard';
import FaucetCard from './components/FaucetCard';
import DocsCard from './components/DocsCard';
import PortfolioCard from './components/PortfolioCard';
import Footer from './components/Footer';

/* ── Floating orbs background ──────────────────────────────────── */
const ORB_DATA = [
  { w: 420, h: 420, color: 'rgba(61,126,255,0.26)',   top:'-6%',  left:'58%',  blur: 60, dur: '9s',  del: '0s',   rev: false },
  { w: 260, h: 260, color: 'rgba(16,185,129,0.32)',   top:'8%',   left:'2%',   blur: 52, dur: '13s', del: '0s',   rev: true  },
  { w: 340, h: 340, color: 'rgba(106,74,255,0.28)',   top:'55%',  left:'5%',   blur: 65, dur: '11s', del: '2s',   rev: false },
  { w: 200, h: 200, color: 'rgba(247,147,26,0.30)',   top:'65%',  left:'72%',  blur: 48, dur: '10s', del: '1.5s', rev: true  },
  { w: 160, h: 160, color: 'rgba(220,70,190,0.26)',   top:'35%',  left:'88%',  blur: 44, dur: '12s', del: '3s',   rev: false },
  { w: 130, h: 130, color: 'rgba(22,220,200,0.22)',   top:'48%',  left:'42%',  blur: 38, dur: '8s',  del: '0.5s', rev: true  },
  { w: 180, h: 180, color: 'rgba(61,126,255,0.18)',   top:'78%',  left:'28%',  blur: 42, dur: '14s', del: '4s',   rev: false },
];

function FloatingOrbs() {
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {ORB_DATA.map((o, i) => (
        <div key={i} className="orb" style={{
          position: 'absolute',
          width: o.w, height: o.h,
          borderRadius: '50%',
          top: o.top, left: o.left,
          background: `radial-gradient(circle, ${o.color} 0%, transparent 68%)`,
          filter: `blur(${o.blur}px)`,
          animation: `orbFloat ${o.dur} ease-in-out ${o.del} infinite ${o.rev ? 'reverse' : ''}`,
          willChange: 'transform',
        }} />
      ))}
    </div>
  );
}

const TABS = [
  { id: 'swap', label: 'Swap',
    icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg> },
  { id: 'liquidity', label: 'Liquidity',
    icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg> },
  { id: 'analytics', label: 'Analytics',
    icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { id: 'portfolio', label: 'Portfolio',
    icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
  { id: 'faucet', label: 'Faucet',
    icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { id: 'docs', label: 'Docs',
    icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
];

export default function App() {
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState('swap');
  const [lastSwap, setLastSwap]   = useState(null);

  const wide = activeTab === 'docs' || activeTab === 'analytics';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <FloatingOrbs />
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-menu)', fontFamily: 'var(--font-body)', fontSize: 14 },
        success: { iconTheme: { primary: 'var(--accent-green)', secondary: 'var(--bg-card)' } },
        error:   { iconTheme: { primary: 'var(--accent-red)', secondary: 'var(--bg-card)' } },
      }} />

      <Header wallet={wallet} activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />

      <main className="mx-auto px-4 pt-8 pb-24" style={{ maxWidth: wide ? 900 : 512 }}>
        {activeTab === 'swap' && (
          <>
            {/* Hero headline — only on Swap tab */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h1 style={{
                fontFamily: 'var(--font-primary)', fontWeight: 700,
                fontSize: 'clamp(26px, 4vw, 42px)', lineHeight: 1.15,
                color: 'var(--text-primary)', margin: '0 0 10px',
                letterSpacing: '-0.02em',
              }}>
                Swap on Portaldot.
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-body)' }}>
                Non-custodial · 0.3% fee · built for Portaldot V3 Testnet
              </p>
            </div>
            <SwapCard wallet={wallet} onSwapSuccess={e => { setLastSwap(e); }} />
          </>
        )}
        {activeTab === 'liquidity' && <LiquidityCard wallet={wallet} onLiquiditySuccess={e => { setLastSwap(e); }} />}
        {activeTab === 'analytics' && <AnalyticsCard wallet={wallet} />}
        {activeTab === 'portfolio' && <PortfolioCard wallet={wallet} swapEvents={lastSwap} />}
        {activeTab === 'faucet'    && <FaucetCard wallet={wallet} />}
        {activeTab === 'docs'      && <DocsCard />}
      </main>

      <Footer />
    </div>
  );
}
