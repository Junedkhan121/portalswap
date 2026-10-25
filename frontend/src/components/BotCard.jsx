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
          margin: 0,
        }}>
          Trade PortalSwap directly from Telegram
        </p>
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        {[
          { icon: '💰', title: 'Check Balance', desc: 'View your tPOT and token balances' },
          { icon: '🔄', title: 'Swap Tokens', desc: 'Trade tokens instantly' },
          { icon: '⚡', title: 'Stake tPOT', desc: 'Earn rewards by staking' },
          { icon: '💸', title: 'Send tPOT', desc: 'Transfer to SS58 addresses' },
          { icon: '🔑', title: 'Wallet Management', desc: 'Create or import wallets' },
          { icon: '🚰', title: 'Faucet Access', desc: 'Get testnet tokens easily' },
        ].map((feature, i) => (
          <div key={i} style={{
            background: 'var(--bg-primary)',
            borderRadius: 12,
            padding: 16,
            border: '1px solid var(--border-menu)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{feature.icon}</div>
            <div style={{
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--text-primary)',
              marginBottom: 4,
              fontFamily: 'var(--font-body)',
            }}>
              {feature.title}
            </div>
            <div style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              lineHeight: 1.4,
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
          🚀 Quick Start
        </h3>
        <ol style={{
          margin: 0,
          paddingLeft: 20,
          color: 'var(--text-secondary)',
          fontSize: 14,
          lineHeight: 1.8,
        }}>
          <li>Click "Open {BOT_USERNAME}" above</li>
          <li>Send <code style={{
            background: 'var(--bg-card)',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 13,
            fontFamily: 'monospace',
          }}>/start</code> to begin</li>
          <li>Create a new wallet or import existing one</li>
          <li>Get testnet tPOT from faucet (use your SS58 address)</li>
          <li>Start swapping, staking, and transferring!</li>
        </ol>
      </div>

      {/* Address Info */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(61,126,255,0.08), rgba(16,185,129,0.08))',
        borderRadius: 12,
        padding: 20,
        border: '1px solid var(--border-menu)',
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
              About Addresses
            </div>
            <div style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              The bot creates two addresses for you:<br />
              <strong>• EVM (0x...)</strong> — For swaps and smart contracts<br />
              <strong>• SS58 (5...)</strong> — For receiving native tPOT from faucets
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div style={{
        marginTop: 24,
        padding: 16,
        background: 'rgba(255, 193, 7, 0.05)',
        border: '1px solid rgba(255, 193, 7, 0.2)',
        borderRadius: 8,
        fontSize: 12,
        color: 'var(--text-muted)',
        lineHeight: 1.5,
      }}>
        <strong style={{ color: 'var(--text-primary)' }}>⚠️ Security:</strong> Your wallet keys are stored in your Telegram session only. Never share your private key with anyone. This bot runs on Portaldot V3 Testnet — use test funds only.
      </div>
    </div>
  );
}
