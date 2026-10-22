import { useState } from 'react';
import { CHAIN_NAME, NATIVE_SYMBOL, NETWORK_CONFIG } from '../utils/addresses';

async function addNetwork() {
  if (!window.ethereum) { alert('Please install MetaMask or OKX Wallet first.'); return; }
  try {
    await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [NETWORK_CONFIG] });
  } catch (err) { console.error('Add network error:', err); }
}

const PAGE_DESCS = {
  swap:      'Trade tokens instantly',
  liquidity: 'Provide liquidity & earn fees',
  analytics: 'Pool stats & price charts',
  faucet:    'Get free test tokens',
  docs:      'Learn how PortalSwap works',
};

export default function Header({ wallet, activeTab, setActiveTab, tabs }) {
  const { account, balance, isConnecting, isCorrectChain, connect, disconnect, switchNetwork } = wallet;
  const [menuOpen, setMenuOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('light-mode', !next);
  };
  const short = (a) => `${a.slice(0, 6)}...${a.slice(-4)}`;
  const activeLabel = tabs?.find(t => t.id === activeTab)?.label ?? 'PortalSwap';

  const handleAddNetwork = async () => {
    setAdding(true);
    await addNetwork();
    setAdding(false);
  };

  return (
    <header style={{ borderBottom: '1px solid rgba(30,46,74,0.7)', backdropFilter: 'blur(24px)', background: 'rgba(7,9,15,0.88)' }}
      className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">

        {/* Left: hamburger + logo + active page */}
        <div className="flex items-center gap-3">

          {/* Nav dropdown trigger */}
          <div className="relative">
            <button onClick={() => setMenuOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 12px', borderRadius: 12,
                background: menuOpen ? 'rgba(61,126,255,0.15)' : 'rgba(22,32,64,0.5)',
                border: `1px solid ${menuOpen ? 'rgba(61,126,255,0.35)' : 'rgba(30,46,74,0.8)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              {/* Hamburger icon → X when open */}
              <div style={{ width: 18, height: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span style={{ display: 'block', height: 2, background: menuOpen ? '#3d7eff' : '#9ab0d4', borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
                <span style={{ display: 'block', height: 2, background: menuOpen ? '#3d7eff' : '#9ab0d4', borderRadius: 2, transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
                <span style={{ display: 'block', height: 2, background: menuOpen ? '#3d7eff' : '#9ab0d4', borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
              </div>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: menuOpen ? '#fff' : '#e8f0ff' }}>
                {activeLabel}
              </span>
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={menuOpen ? '#3d7eff' : '#4e6490'} strokeWidth="2.5"
                style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown panel */}
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute left-0 top-full mt-2 z-50 rounded-2xl overflow-hidden"
                  style={{
                    width: 240,
                    background: '#0d1424',
                    border: '1px solid rgba(30,46,74,0.9)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
                  }}>
                  <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(30,46,74,0.6)' }}>
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10, color: '#4e6490', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Navigate
                    </p>
                  </div>
                  {tabs?.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setMenuOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          width: '100%', padding: '11px 16px',
                          background: isActive ? 'rgba(61,126,255,0.12)' : 'transparent',
                          borderLeft: isActive ? '3px solid #3d7eff' : '3px solid transparent',
                          cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                          borderLeftStyle: 'solid',
                        }}
                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(22,32,64,0.7)'; } }}
                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; } }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                          background: isActive ? 'rgba(61,126,255,0.2)' : 'rgba(22,32,64,0.6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isActive ? '#3d7eff' : '#4e6490',
                        }}>
                          {tab.icon}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: isActive ? '#fff' : '#e8f0ff', marginBottom: 1 }}>
                            {tab.label}
                          </p>
                          <p style={{ fontSize: 11, color: '#4e6490' }}>{PAGE_DESCS[tab.id]}</p>
                        </div>
                        {isActive && (
                          <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="14" height="14" fill="#3d7eff" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        )}
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
              <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: 'linear-gradient(135deg, #3d7eff, #a855f7)', opacity: 0.25, filter: 'blur(6px)' }} />
              <div style={{ position: 'relative', width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #3d7eff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" stroke="#fff" strokeWidth="1.5" fill="rgba(255,255,255,0.1)"/>
                  <path d="M10 6L14 8.5V13.5L10 16L6 13.5V8.5L10 6Z" fill="#fff" opacity="0.8"/>
                </svg>
              </div>
            </div>
            <div>
              <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: '#e8f0ff', lineHeight: 1.1 }}>PortalSwap</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span style={{ fontSize: 10, color: '#4e6490' }}>{CHAIN_NAME}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {account && !isCorrectChain && (
            <button onClick={switchNetwork}
              style={{ padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#fca5a5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}>
              Wrong Network
            </button>
          )}

          {/* Theme toggle */}
          <button onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(22,32,64,0.5)', border:'1px solid rgba(30,46,74,0.8)', cursor:'pointer', flexShrink:0, transition:'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(61,126,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(22,32,64,0.5)'}>
            {isDark
              ? <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#f5ac37" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9H21m-18 0H2m14.66-5.66l-.71.71M7.05 17.66l-.71.71M19.07 19.07l-.71-.71M6.34 6.34l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              : <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#9ab0d4" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
            }
          </button>

          <button onClick={!isCorrectChain ? handleAddNetwork : undefined} disabled={adding}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              fontFamily: 'Space Grotesk',
              color: isCorrectChain ? '#10b981' : '#3d7eff',
              cursor: isCorrectChain ? 'default' : 'pointer',
              background: isCorrectChain ? 'rgba(16,185,129,0.1)' : 'rgba(61,126,255,0.1)',
              border: `1px solid ${isCorrectChain ? 'rgba(16,185,129,0.3)' : 'rgba(61,126,255,0.25)'}`,
              opacity: adding ? 0.5 : 1, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!isCorrectChain) e.currentTarget.style.background='rgba(61,126,255,0.2)'; }}
            onMouseLeave={e => { if (!isCorrectChain) e.currentTarget.style.background='rgba(61,126,255,0.1)'; }}>
            {isCorrectChain ? (
              <>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
                Portaldot V3
              </>
            ) : (
              <>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {adding ? 'Adding…' : 'Add Network'}
              </>
            )}
          </button>

          {account ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, background: 'rgba(22,32,64,0.6)', border: '1px solid rgba(30,46,74,0.8)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: '#9ab0d4' }}>{parseFloat(balance).toFixed(3)} {NATIVE_SYMBOL}</span>
              </div>
              <button onClick={disconnect}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#e8f0ff', background: 'rgba(22,32,64,0.6)', border: '1px solid rgba(30,46,74,0.8)', cursor: 'pointer', fontFamily: 'Space Grotesk' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3d7eff', display: 'inline-block' }} />
                {short(account)}
              </button>
            </div>
          ) : (
            <button onClick={connect} disabled={isConnecting}
              className="btn-primary"
              style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'Space Grotesk', cursor: 'pointer', opacity: isConnecting ? 0.5 : 1 }}>
              {isConnecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
