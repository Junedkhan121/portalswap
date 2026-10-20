import { useState } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { TOKENS } from '../utils/addresses';
import { ERC20_ABI } from '../utils/abis';

export default function FaucetCard({ wallet }) {
  const { account, signer, connect } = wallet;
  const [isLoading, setIsLoading] = useState({});

  // Only mock tokens expose faucet(); skip native and WPOT
  const mintableTokens = TOKENS.filter(
    (t) => !t.isNative && t.mintable && t.address !== ethers.ZeroAddress
  );

  const handleMint = async (token) => {
    if (!signer || !account) return;
    setIsLoading((prev) => ({ ...prev, [token.symbol]: true }));
    const toastId = toast.loading(`Minting ${token.symbol}...`);
    try {
      const contract = new ethers.Contract(token.address, ERC20_ABI, signer);
      const amount =
        token.decimals === 6
          ? ethers.parseUnits('10000', 6)
          : token.decimals === 8
          ? ethers.parseUnits('1', 8)
          : ethers.parseEther('10000');
      const tx = await contract.faucet(account, amount);
      await tx.wait();
      const displayAmount = token.decimals === 8 ? '1' : '10,000';
      toast.success(`Minted ${displayAmount} ${token.symbol}!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(err.reason || 'Mint failed', { id: toastId });
    } finally {
      setIsLoading((prev) => ({ ...prev, [token.symbol]: false }));
    }
  };

  return (
    <div className="bg-portal-card border border-portal-border rounded-3xl p-5 glow-box">
      <h2 className="text-lg font-bold text-white mb-1">Testnet Faucet</h2>
      <p className="text-xs text-portal-muted mb-4">
        Mint test tokens to try PortalSwap. These tokens have no real value.
      </p>

      {!account ? (
        <button
          onClick={connect}
          className="w-full py-4 rounded-2xl text-base font-bold bg-gradient-to-r from-portal-primary to-portal-secondary text-white hover:shadow-lg hover:shadow-portal-primary/25 transition-all"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="space-y-2">
          {mintableTokens.map((token) => (
            <div
              key={token.symbol}
              className="flex items-center justify-between p-3 bg-portal-surface rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{token.logo}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{token.symbol}</p>
                  <p className="text-xs text-portal-muted">{token.name}</p>
                </div>
              </div>
              <button
                onClick={() => handleMint(token)}
                disabled={isLoading[token.symbol]}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-portal-primary/20 text-portal-primary hover:bg-portal-primary/30 transition disabled:opacity-50"
              >
                {isLoading[token.symbol] ? 'Minting...' : 'Mint'}
              </button>
            </div>
          ))}

          <div className="mt-4 p-3 bg-portal-surface/50 rounded-xl">
            <p className="text-xs text-portal-muted">
              Need native tPOTv3 for gas? Visit the{' '}
              <a
                href="https://discord.gg/portaldot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-portal-primary hover:text-portal-accent transition underline"
              >
                Portaldot Discord
              </a>{' '}
              and request from the faucet channel.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
