import { useEffect, useState } from 'react';

// Detect which wallet providers are available in the browser
function detectWallets() {
  const wallets = [];
  const eth = window.ethereum;

  if (!eth && !window.okxwallet) return wallets;

  // EIP-6963 gives us a clean list when supported — fall back to sniffing
  // Check OKX first (has its own namespace)
  if (window.okxwallet) {
    wallets.push({ id: 'okx', name: 'OKX Wallet', icon: '🟠', provider: window.okxwallet });
  }

  if (eth) {
    // Multiple providers injected (e.g. MetaMask + Rabby both installed)
    const providers = eth.providers ?? [eth];

    providers.forEach(p => {
      if (p.isRabby) {
        wallets.push({ id: 'rabby', name: 'Rabby Wallet', icon: '🐇', provider: p });
      } else if (p.isMetaMask && !p.isRabby) {
        wallets.push({ id: 'metamask', name: 'MetaMask', icon: '🦊', provider: p });
      } else if (p.isOKExWallet || p.isOKX) {
        if (!wallets.find(w => w.id === 'okx')) {
          wallets.push({ id: 'okx', name: 'OKX Wallet', icon: '🟠', provider: p });
        }
      } else if (p.isCoinbaseWallet) {
        wallets.push({ id: 'coinbase', name: 'Coinbase Wallet', icon: '🔵', provider: p });
      } else if (!wallets.length) {
        // Unknown injected wallet — show it generically
        wallets.push({ id: 'injected', name: 'Browser Wallet', icon: '🌐', provider: p });
      }
    });

    // If nothing was detected but window.ethereum exists, show it generically
    if (!wallets.length && eth) {
      wallets.push({ id: 'injected', name: 'Browser Wallet', icon: '🌐', provider: eth });
    }
  }

  return wallets;
}

export default function WalletModal({ onConnect, onClose }) {
  const [wallets, setWallets] = useState([]);
  const [connecting, setConnecting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setWallets(detectWallets());
  }, []);

  const handleConnect = async (wallet) => {
    setConnecting(wallet.id);
    setError('');
    try {
      await onConnect(wallet.provider);
      onClose();
    } catch (err) {
      setError(err.message || 'Connection failed');
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    }} onClick={onClose}>
      <div style={{
        width: 380, borderRadius: 28,
        background: 'linear-gradient(160deg,#0d1424 0%,#0a1020 100%)',
        border: '1px solid rgba(61,126,255,0.25)',
        padding: '28px 24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: '#e8f0ff', marginBottom: 4 }}>
              Connect Wallet
            </p>
            <p style={{ fontSize: 13, color: '#4e6490' }}>Choose your wallet to continue</p>
          </div>
          <button onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(22,32,64,0.6)', border: '1px solid rgba(30,46,74,0.8)', cursor: 'pointer' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#4e6490" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Wallet list */}
        {wallets.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {wallets.map(wallet => (
              <button key={wallet.id} onClick={() => handleConnect(wallet)}
                disabled={!!connecting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 18px', borderRadius: 18, width: '100%',
                  background: connecting === wallet.id ? 'rgba(61,126,255,0.15)' : 'rgba(22,32,64,0.5)',
                  border: `1px solid ${connecting === wallet.id ? 'rgba(61,126,255,0.4)' : 'rgba(30,46,74,0.7)'}`,
                  cursor: connecting ? 'wait' : 'pointer',
                  transition: 'all 0.15s', opacity: connecting && connecting !== wallet.id ? 0.5 : 1,
                }}
                onMouseEnter={e => { if (!connecting) { e.currentTarget.style.background='rgba(61,126,255,0.1)'; e.currentTarget.style.borderColor='rgba(61,126,255,0.3)'; }}}
                onMouseLeave={e => { if (!connecting) { e.currentTarget.style.background='rgba(22,32,64,0.5)'; e.currentTarget.style.borderColor='rgba(30,46,74,0.7)'; }}}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{wallet.icon}</span>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: '#e8f0ff' }}>
                    {wallet.name}
                  </p>
                  <p style={{ fontSize: 12, color: '#4e6490' }}>Detected · Ready to connect</p>
                </div>
                {connecting === wallet.id ? (
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#3d7eff" strokeWidth="3" opacity="0.25"/>
                    <path fill="#3d7eff" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#4e6490" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🦊</p>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 16, color: '#e8f0ff', marginBottom: 8 }}>
              No wallet detected
            </p>
            <p style={{ fontSize: 13, color: '#4e6490', lineHeight: 1.6, marginBottom: 20 }}>
              Install MetaMask, OKX Wallet, or Rabby to get started.
            </p>
            <a href="https://metamask.io/download" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 12, background: 'rgba(61,126,255,0.15)', color: '#3d7eff', border: '1px solid rgba(61,126,255,0.3)', fontSize: 13, fontWeight: 600, fontFamily: 'Space Grotesk', textDecoration: 'none' }}>
              Install MetaMask →
            </a>
          </div>
        )}

        {error && (
          <p style={{ marginTop: 14, fontSize: 13, color: '#ef4444', textAlign: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '8px 14px' }}>
            {error}
          </p>
        )}

        {/* Footer */}
        <p style={{ marginTop: 20, fontSize: 11, color: '#4e6490', textAlign: 'center', lineHeight: 1.6 }}>
          By connecting you agree to use this testnet DEX at your own risk.
          Never share your seed phrase.
        </p>
      </div>
    </div>
  );
}
