import { useState } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { TOKENS } from '../utils/addresses';
import { ERC20_ABI } from '../utils/abis';
import { TokenAvatar } from './TokenSelect';

export default function FaucetCard({ wallet }) {
  const { account, signer, connect } = wallet;
  const [loading, setLoading] = useState({});

  // Mint amounts per token — display string and on-chain amount string
  const MINT_AMOUNTS = {
    pUSDT: { display: '10',   amount: '10'   },
    pDAI:  { display: '10',   amount: '10'   },
    pWBTC: { display: '0.01', amount: '0.01' },
    pLINK: { display: '0.5',  amount: '0.5'  },
  };

  const mintableTokens = TOKENS.filter(t => !t.isNative && t.mintable && t.address !== ethers.ZeroAddress);

  const handleMint = async (token) => {
    if (!signer || !account) return;
    setLoading(p => ({ ...p, [token.symbol]: true }));
    const id = toast.loading(`Minting ${token.symbol}…`);
    try {
      const contract = new ethers.Contract(token.address, ERC20_ABI, signer);
      const cfg = MINT_AMOUNTS[token.symbol] || { amount: '10', display: '10' };
      const amount = ethers.parseUnits(cfg.amount, token.decimals);
      const tx = await contract.faucet(account, amount);
      await tx.wait();
      toast.success(`Minted ${cfg.display} ${token.symbol}!`, { id });
    } catch (err) {
      toast.error(err.reason || 'Mint failed', { id });
    } finally {
      setLoading(p => ({ ...p, [token.symbol]: false }));
    }
  };

  return (
    <div className="glass-card rounded-3xl p-5">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 4 }}>
          Testnet Faucet
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Mint free test tokens to try PortalSwap.</p>
      </div>

      {!account ? (
        <button onClick={connect}
          style={{
            width: '100%', padding: '16px 0', borderRadius: 20,
            fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-primary)',
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            color: '#fff', border: 'none', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Connect Wallet
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mintableTokens.map(token => (
            <div key={token.symbol} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px', borderRadius: 20,
              background: 'var(--bg-menu-item)', border: '1px solid var(--border-secondary)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-accent)'; e.currentTarget.style.background='var(--bg-menu-item-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-secondary)'; e.currentTarget.style.background='var(--bg-menu-item)'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <TokenAvatar token={token} size={40} />
                <div>
                  <p style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {token.symbol}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{token.name}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                  {(MINT_AMOUNTS[token.symbol]?.display ?? '10')} tokens
                </p>
                <button onClick={() => handleMint(token)} disabled={loading[token.symbol]}
                  style={{
                    padding: '8px 16px', borderRadius: 14, fontSize: 13, fontWeight: 600,
                    fontFamily: 'var(--font-primary)', cursor: loading[token.symbol] ? 'not-allowed' : 'pointer',
                    background: 'rgba(61,126,255,0.15)', color: 'var(--accent-blue)',
                    border: '1px solid rgba(61,126,255,0.3)', transition: 'all 0.15s',
                    opacity: loading[token.symbol] ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { if (!loading[token.symbol]) e.currentTarget.style.background='rgba(61,126,255,0.25)'; }}
                  onMouseLeave={e => { if (!loading[token.symbol]) e.currentTarget.style.background='rgba(61,126,255,0.15)'; }}>
                  {loading[token.symbol] ? 'Minting…' : 'Mint'}
                </button>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 8, padding: 16, borderRadius: 20,
            background: 'rgba(61,126,255,0.05)', border: '1px solid rgba(61,126,255,0.15)' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--accent-blue)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Need native tPOTv3 for gas? Visit the{' '}
                <a href="https://discord.gg/portaldot" target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>
                  Portaldot Discord
                </a>{' '}
                and request tokens from the faucet channel.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}