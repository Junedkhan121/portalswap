/**
 * BotCard - Telegram Bot Info & Guide
 */

export default function BotCard() {
  const BOT_USERNAME = '@PlSwapbot';

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 16,
      border: '1px solid var(--border-card)',
      padding: 32,
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 80,
          height: 80,
          margin: '0 auto 16px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-blue), #2E9BFF)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
        }}>
          🤖
        </div>
        <h2 style={{
          fontFamily: 'var(--font-primary)',
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 8px',
          letterSpacing: '-0.02em',
        }}>
          PortalSwap Telegram Bot
        </h2>
        <p style={{
          fontSize: 14,
          color: 'var(--text-muted)',
          margin: '0 0 12px',
        }}>
          Trade PortalSwap directly from Telegram
        </p>
        <a
          href="https://github.com/Junedkhan121/Portalswap-telegram-bot"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid var(--border-menu)',
            background: 'var(--bg-primary)',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-blue)';
            e.currentTarget.style.color = 'var(--accent-blue)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-menu)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          View on GitHub
        </a>
      </div>

      {/* CTA Button */}
      <a
        href={`https://t.me/${BOT_USERNAME.replace('@', '')}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          width: '100%',
          padding: '14px 24px',
          background: 'linear-gradient(135deg, #0088cc, #0066aa)',
          color: 'white',
          borderRadius: 12,
          border: 'none',
          fontSize: 16,
          fontWeight: 600,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          textAlign: 'center',
          textDecoration: 'none',
          marginBottom: 32,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 136, 204, 0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span style={{ marginRight: 8 }}>✈️</span>
        Open {BOT_USERNAME}
      </a>

      {/* Features Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        {[
          { icon: '🔑', title: 'Non-Custodial Wallet', desc: 'Create or import your wallet securely' },
          { icon: '💰', title: 'Balance Tracking', desc: 'View tPOT and all token balances in real-time' },
          { icon: '🔄', title: 'Token Swaps', desc: 'Trade tokens with live price quotes instantly' },
          { icon: '⚡', title: 'Stake tPOT', desc: 'Stake native tPOT to track TVL and earn future rewards' },
          { icon: '💸', title: 'Transfer Tokens', desc: 'Send tPOT to any SS58 or EVM address' },
          { icon: '🪙', title: 'Claim Test Tokens', desc: 'Mint pUSDT, pDAI, pWBTC, pLINK directly from bot' },
          { icon: '💧', title: 'Donate to Faucet', desc: 'Support the ecosystem by donating tPOT back' },
          { icon: '📊', title: 'Portfolio View', desc: 'Track your holdings and transaction history' },
        ].map((feature, i) => (
          <div key={i} style={{
            background: 'var(--bg-primary)',
            borderRadius: 12,
            padding: 18,
            border: '1px solid var(--border-menu)',
            transition: 'all 0.2s',
            cursor: 'default',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-blue)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(61, 126, 255, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-menu)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{feature.icon}</div>
            <div style={{
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--text-primary)',
              marginBottom: 6,
              fontFamily: 'var(--font-body)',
            }}>
              {feature.title}
            </div>
            <div style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}>
              {feature.desc}
            </div>
          </div>
        ))}
      </div>

      {/* How to Use */}
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: 12,
        padding: 24,
        border: '1px solid var(--border-menu)',
        marginBottom: 24,
      }}>
        <h3 style={{
          fontFamily: 'var(--font-primary)',
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 16px',
        }}>
          🚀 Quick Start Guide
        </h3>
        <ol style={{
          margin: 0,
          paddingLeft: 20,
          color: 'var(--text-secondary)',
          fontSize: 14,
          lineHeight: 1.9,
        }}>
          <li>Click "Open {BOT_USERNAME}" button above</li>
          <li>Send <code style={{
            background: 'var(--bg-card)',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 13,
            fontFamily: 'monospace',
          }}>/start</code> to create or import your wallet</li>
          <li>Get testnet tPOT from <a href="https://faucet.portaldot.io/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>faucet.portaldot.io</a> (use your SS58 address)</li>
          <li>Claim test tokens (pUSDT, pDAI, pWBTC, pLINK) directly in bot</li>
          <li>Start swapping, staking, and transferring instantly!</li>
        </ol>
      </div>

      {/* Why Use Bot */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(61,126,255,0.06), rgba(16,185,129,0.06))',
        borderRadius: 12,
        padding: 24,
        border: '1px solid var(--border-menu)',
        marginBottom: 24,
      }}>
        <h3 style={{
          fontFamily: 'var(--font-primary)',
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 16px',
        }}>
          ✨ Why Use the Telegram Bot?
        </h3>
        <div style={{
          display: 'grid',
          gap: 12,
        }}>
          {[
            { icon: '⚡', text: '<strong>Lightning Fast</strong> — Trade directly from chat, no browser needed' },
            { icon: '🔒', text: '<strong>100% Non-Custodial</strong> — Your keys stay in your Telegram session, never on servers' },
            { icon: '📱', text: '<strong>Mobile First</strong> — Full DeFi experience optimized for mobile trading' },
            { icon: '🎯', text: '<strong>Simple UX</strong> — Conversational interface, no complex forms or confusing menus' },
            { icon: '🚀', text: '<strong>All-in-One</strong> — Swap, stake, transfer, and manage tokens from one place' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              <span style={{ fontSize: 18, marginTop: 1 }}>{item.icon}</span>
              <span dangerouslySetInnerHTML={{ __html: item.text }} />
            </div>
          ))}
        </div>
      </div>

      {/* Address Info */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(61,126,255,0.08), rgba(16,185,129,0.08))',
        borderRadius: 12,
        padding: 20,
        border: '1px solid var(--border-menu)',
        marginBottom: 24,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <div style={{ fontSize: 24, marginTop: 2 }}>💡</div>
          <div>
            <div style={{
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--text-primary)',
              marginBottom: 6,
              fontFamily: 'var(--font-body)',
            }}>
              Understanding Your Addresses
            </div>
            <div style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
            }}>
              The bot creates <strong>two addresses</strong> from one private key:<br />
              <strong style={{ color: 'var(--accent-blue)' }}>• EVM Address (0x...)</strong> — For swapping tokens, staking, and smart contract interactions<br />
              <strong style={{ color: 'var(--accent-green)' }}>• SS58 Address (5...)</strong> — For receiving native tPOT from testnet faucets<br />
              <span style={{ fontSize: 12, opacity: 0.8, marginTop: 4, display: 'block' }}>
                Both addresses are derived from your single private key and share the same balance.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div style={{
        marginTop: 0,
        padding: 18,
        background: 'rgba(255, 193, 7, 0.06)',
        border: '1px solid rgba(255, 193, 7, 0.25)',
        borderRadius: 10,
        fontSize: 13,
        color: 'var(--text-secondary)',
        lineHeight: 1.7,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Security & Testnet Notice</strong>
            <div>
              • Your private keys are stored <strong>in-session only</strong> on Telegram servers, never on our servers<br />
              • <strong>Never share your private key</strong> with anyone — we'll never ask for it<br />
              • This bot runs on <strong>Portaldot V3 Testnet</strong> — use test funds only, no real value<br />
              • For production use, always verify contract addresses and use hardware wallets
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
