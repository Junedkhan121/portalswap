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
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-menu)', fontFamily: 'var(--font-body)', fontSize: 14 },
        success: { iconTheme: { primary: 'var(--accent-green)', secondary: 'var(--bg-card)' } },
        error:   { iconTheme: { primary: 'var(--accent-red)', secondary: 'var(--bg-card)' } },
      }} />

      <Header wallet={wallet} activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />

      <main className="mx-auto px-4 pt-8 pb-24" style={{ maxWidth: wide ? 900 : 512 }}>
        {activeTab === 'swap'      && <SwapCard wallet={wallet} onSwapSuccess={e => { setLastSwap(e); }} />}
        {activeTab === 'liquidity' && <LiquidityCard wallet={wallet} />}
        {activeTab === 'analytics' && <AnalyticsCard wallet={wallet} />}
        {activeTab === 'portfolio' && <PortfolioCard wallet={wallet} swapEvents={lastSwap} />}
        {activeTab === 'faucet'    && <FaucetCard wallet={wallet} />}
        {activeTab === 'docs'      && <DocsCard />}
      </main>

      <Footer />
    </div>
  );
}
