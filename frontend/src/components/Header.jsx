import { useState } from 'react';
import { CHAIN_NAME, NATIVE_SYMBOL, NETWORK_CONFIG } from '../utils/addresses';
import WalletModal from './WalletModal';

async function addNetwork() {
  if (!window.ethereum) { alert('Please install MetaMask or OKX Wallet first.'); return; }
  try {
    await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [NETWORK_CONFIG] });
  } catch (err) { console.error('Add network error:', err); }
}

const PAGE_DESCS = {
  swap:      'Trade tokens instantly',
  liquidity: 'Provide liquidity & earn fees',
  stake:     'Stake tPOTv3 & track TVL',
  analytics: 'Pool stats & price charts',
  portfolio: 'Your balances & LP positions',
  faucet:    'Get free test tokens',
  docs:      'Learn how PortalSwap works',
};

export default function Header({ wallet, activeTab, setActiveTab, tabs }) {
  const { account, balance, isConnecting, isCorrectChain, connect, disconnect, switchNetwork } = wallet;
  const [menuOpen, setMenuOpen]         = useState(false);
  const [adding, setAdding]             = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const short = (a) => `${a.slice(0, 6)}...${a.slice(-4)}`;
  const activeLabel = tabs?.find(t => t.id === activeTab)?.label ?? 'PortalSwap';

  const handleAddNetwork = async () => { setAdding(true); await addNetwork(); setAdding(false); };

  return (
    <>
      {showWalletModal && (
        <WalletModal
          onConnect={async (provider) => { await connect(provider); }}
          onClose={() => setShowWalletModal(false)}
        />
      )}

      <header className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">

          {/* Left: nav dropdown + logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setMenuOpen(o => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 12px',
                  borderRadius: 12,
                  background: menuOpen ? 'rgba(61,126,255,0.15)' : 'rgba(22,32,64,0.5)',
                  border: menuOpen ? '1px solid rgba(61,126,255,0.35)' : '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}>
                <div style={{ width: 18, height: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span style={{ display: 'block', height: 2, background: menuOpen ? 'var(--accent-blue)' : 'var(--text-muted)', borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
                  <span style={{ display: 'block', height: 2, background: menuOpen ? 'var(--accent-blue)' : 'var(--text-muted)', borderRadius: 2, transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
                  <span style={{ display: 'block', height: 2, background: menuOpen ? 'var(--accent-blue)' : 'var(--text-muted)', borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: 14, color: menuOpen ? 'var(--text-primary)' : 'var(--text-primary)' }}>{activeLabel}</span>
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={menuOpen ? 'var(--accent-blue)' : 'var(--text-muted)'} strokeWidth="2.5"
                  style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 z-50 rounded-2xl overflow-hidden"
                    style={{ width: 240, background: 'var(--bg-modal)', border: '1px solid var(--border-menu)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>
                    <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border-primary)' }}>
                      <p style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Navigate</p>
                    </div>
                    {tabs?.map(tab => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMenuOpen(false); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            width: '100%',
                            padding: '11px 16px',
                            background: isActive ? 'rgba(61,126,255,0.12)' : 'transparent',
                            borderLeft: isActive ? '3px solid var(--accent-blue)' : '3px solid transparent',
                            cursor: 'pointer',
                            border: 'none',
                            borderLeftStyle: 'solid',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-menu-item-hover)'; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: isActive ? 'rgba(61,126,255,0.2)' : 'rgba(22,32,64,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)' }}>{tab.icon}</div>
                          <div style={{ textAlign: 'left' }}>
                            <p style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: 14, color: isActive ? 'var(--text-primary)' : 'var(--text-primary)', marginBottom: 1 }}>{tab.label}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{PAGE_DESCS[tab.id]}</p>
                          </div>
                          {isActive && <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="14" height="14" fill="var(--accent-blue)" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: 'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))', opacity: 0.25, filter: 'blur(6px)' }} />
                <div style={{ position: 'relative', width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,var(--accent-blue),var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" stroke="#fff" strokeWidth="1.5" fill="rgba(255,255,255,0.1)"/>
                    <path d="M10 6L14 8.5V13.5L10 16L6 13.5V8.5L10 6Z" fill="#fff" opacity="0.8"/>
                  </svg>
                </div>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.1 }}>PortalSwap</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{CHAIN_NAME}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {account && !isCorrectChain && (
              <button onClick={switchNetwork}
                style={{
                  padding: '6px 12px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-error)',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  cursor: 'pointer'
                }}>
                Wrong Network
              </button>
            )}

            {/* Add / Connected network */}
            <button onClick={!isCorrectChain ? handleAddNetwork : undefined} disabled={adding}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-primary)',
                color: isCorrectChain ? 'var(--accent-green)' : 'var(--accent-blue)',
                cursor: isCorrectChain ? 'default' : 'pointer',
                background: isCorrectChain ? 'rgba(16,185,129,0.1)' : 'rgba(61,126,255,0.1)',
                border: isCorrectChain ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(61,126,255,0.25)',
                opacity: adding ? 0.5 : 1,
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { if (!isCorrectChain) e.currentTarget.style.background = 'rgba(61,126,255,0.2)'; }}
              onMouseLeave={e => { if (!isCorrectChain) e.currentTarget.style.background = isCorrectChain ? 'rgba(16,185,129,0.1)' : 'rgba(61,126,255,0.1)'; }}>
              {isCorrectChain ? (
                <><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block', boxShadow: 'var(--shadow-glow-green)' }} />Portaldot V3</>
              ) : (
                <><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>{adding ? 'Adding…' : 'Add Network'}</>
              )}
            </button>

            {account ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, background: 'var(--bg-pill)', border: '1px solid var(--border-primary)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{parseFloat(balance).toFixed(3)} {NATIVE_SYMBOL}</span>
                </div>
                <button onClick={disconnect}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-pill)',
                    border: '1px solid var(--border-primary)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-primary)'
                  }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-blue)', display: 'inline-block' }} />
                  {short(account)}
                </button>
              </div>
            ) : (
              <button onClick={() => setShowWalletModal(true)} disabled={isConnecting}
                className="btn-primary"
                style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'var(--font-primary)', cursor: 'pointer', opacity: isConnecting ? 0.5 : 1 }}>
                {isConnecting ? 'Connecting…' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}