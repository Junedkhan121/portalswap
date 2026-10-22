import { useState } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { TOKENS } from '../utils/addresses';
import { ERC20_ABI } from '../utils/abis';
import { TokenAvatar } from './TokenSelect';

export default function FaucetCard({ wallet }) {
  const { account, signer, connect } = wallet;
  const [loading, setLoading] = useState({});

  const mintableTokens = TOKENS.filter(t => !t.isNative && t.mintable && t.address !== ethers.ZeroAddress);

  const handleMint = async (token) => {
    if (!signer || !account) return;
    setLoading(p => ({ ...p, [token.symbol]: true }));
    const id = toast.loading(`Minting ${token.symbol}…`);
    try {
      const contract = new ethers.Contract(token.address, ERC20_ABI, signer);
      const amount = token.decimals === 6 ? ethers.parseUnits('10000', 6)
        : token.decimals === 8 ? ethers.parseUnits('1', 8)
        : ethers.parseEther('10000');
      const tx = await contract.faucet(account, amount);
      await tx.wait();
      const display = token.decimals === 8 ? '1' : '10,000';
      toast.success(`Minted ${display} ${token.symbol}!`, { id });
    } catch (err) {
      toast.error(err.reason || 'Mint failed', { id });
    } finally {
      setLoading(p => ({ ...p, [token.symbol]: false }));
    }
  };

  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="mb-5">
        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: '#e8f0ff', marginBottom: 4 }}>
          Testnet Faucet
        </h2>
        <p className="text-sm text-portal-muted">Mint free test tokens to try PortalSwap.</p>
      </div>

      {!account ? (
        <button onClick={connect}
          className="btn-primary w-full py-4 rounded-2xl font-semibold text-white"
          style={{ fontFamily: 'Space Grotesk', fontSize: 15 }}>
          Connect Wallet
        </button>
      ) : (
        <div className="space-y-2">
          {mintableTokens.map(token => (
            <div key={token.symbol} className="flex items-center justify-between p-4 rounded-2xl transition"
              style={{ background: 'rgba(7,9,15,0.5)', border: '1px solid rgba(30,46,74,0.6)' }}>
              <div className="flex items-center gap-3">
                <TokenAvatar token={token} size={40} />
                <div>
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, color: '#e8f0ff' }}>
                    {token.symbol}
                  </p>
                  <p className="text-xs text-portal-muted">{token.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-portal-muted mb-1.5">
                  {token.decimals === 8 ? '1 token' : '10,000 tokens'}
                </p>
                <button onClick={() => handleMint(token)} disabled={loading[token.symbol]}
                  className="px-4 py-1.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  style={{
                    fontFamily: 'Space Grotesk',
                    background: 'rgba(61,126,255,0.15)',
                    color: '#3d7eff',
                    border: '1px solid rgba(61,126,255,0.3)',
                  }}
                  onMouseEnter={e => { if (!loading[token.symbol]) e.currentTarget.style.background='rgba(61,126,255,0.25)'; }}
                  onMouseLeave={e => { if (!loading[token.symbol]) e.currentTarget.style.background='rgba(61,126,255,0.15)'; }}>
                  {loading[token.symbol] ? 'Minting…' : 'Mint'}
                </button>
              </div>
            </div>
          ))}

          <div className="mt-4 p-4 rounded-2xl"
            style={{ background: 'rgba(61,126,255,0.05)', border: '1px solid rgba(61,126,255,0.15)' }}>
            <div className="flex items-start gap-3">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#3d7eff" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-portal-muted">
                Need native tPOTv3 for gas? Visit the{' '}
                <a href="https://discord.gg/portaldot" target="_blank" rel="noopener noreferrer"
                  className="text-portal-primary hover:underline">Portaldot Discord</a>{' '}
                and request tokens from the faucet channel.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
