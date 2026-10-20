import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useWallet } from './hooks/useWallet';
import Header from './components/Header';
import SwapCard from './components/SwapCard';
import LiquidityCard from './components/LiquidityCard';
import AnalyticsCard from './components/AnalyticsCard';
import FaucetCard from './components/FaucetCard';
import Footer from './components/Footer';

export default function App() {
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState('swap');

  return (
    <div className="min-h-screen bg-animated">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1127',
            color: '#e2e8f0',
            border: '1px solid #2d2440',
          },
        }}
      />

      <Header wallet={wallet} />

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 pt-8 pb-24">
        {/* Tab Navigation */}
        <div className="flex justify-center gap-1 mb-6 bg-portal-card rounded-2xl p-1">
          {[
            { id: 'swap', label: 'Swap' },
            { id: 'liquidity', label: 'Liquidity' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'faucet', label: 'Faucet' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-portal-primary text-white shadow-lg shadow-portal-primary/25'
                  : 'text-portal-muted hover:text-portal-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Tab Content */}
        {activeTab === 'swap' && <SwapCard wallet={wallet} />}
        {activeTab === 'liquidity' && <LiquidityCard wallet={wallet} />}
        {activeTab === 'analytics' && <AnalyticsCard wallet={wallet} />}
        {activeTab === 'faucet' && <FaucetCard wallet={wallet} />}
      </main>

      <Footer />
    </div>
  );
}
