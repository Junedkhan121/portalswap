import { CHAIN_NAME, NATIVE_SYMBOL } from '../utils/addresses';

export default function Header({ wallet }) {
  const { account, balance, isConnecting, isCorrectChain, connect, disconnect, switchNetwork } = wallet;

  const shortenAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <header className="border-b border-portal-border/50 backdrop-blur-md bg-portal-dark/80 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-portal-primary to-portal-accent flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">PortalSwap</h1>
            <p className="text-[10px] text-portal-muted">AMM DEX on {CHAIN_NAME}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {account && !isCorrectChain && (
            <button
              onClick={switchNetwork}
              className="px-3 py-2 bg-red-500/20 text-red-400 rounded-xl text-xs font-medium hover:bg-red-500/30 transition"
            >
              Wrong Network
            </button>
          )}

          {account ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-portal-surface px-3 py-2 rounded-xl">
                <span className="text-xs text-portal-muted">
                  {parseFloat(balance).toFixed(4)} {NATIVE_SYMBOL}
                </span>
              </div>
              <button
                onClick={disconnect}
                className="px-3 py-2 bg-portal-card border border-portal-border rounded-xl text-sm font-medium text-portal-text hover:border-portal-primary/50 transition"
              >
                {shortenAddress(account)}
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="px-5 py-2.5 bg-gradient-to-r from-portal-primary to-portal-secondary text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-portal-primary/25 transition-all duration-200 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
