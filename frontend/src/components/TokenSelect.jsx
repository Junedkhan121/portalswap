import { useState } from 'react';
import { TOKENS, ADDRESSES } from '../utils/addresses';

// Native tPOTv3 and WPOT share the same underlying asset — hide whichever one is on the other side
const effectiveAddress = (t) => {
  if (!t) return null;
  if (t.isNative) return ADDRESSES.WPOT?.toLowerCase();
  return t.address?.toLowerCase();
};

const ZERO = '0x0000000000000000000000000000000000000000';
const isPlaceholder = (a) => !a || a === ZERO;

export default function TokenSelect({ selectedToken, onSelect, otherToken }) {
  const [isOpen, setIsOpen] = useState(false);

  const otherAddr = effectiveAddress(otherToken);

  // Hide the token on the other side. Native tPOTv3 and WPOT resolve to the same
  // address, so compare the effective address when it is a real (non-zero) one;
  // fall back to symbol comparison before deployment, when every address is a placeholder.
  const availableTokens = TOKENS.filter((t) => {
    if (t.symbol === otherToken?.symbol) return false;
    const addr = effectiveAddress(t);
    if (!isPlaceholder(addr) && addr === otherAddr) return false;
    return true;
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-portal-surface hover:bg-portal-border px-3 py-2 rounded-xl transition-colors"
      >
        {selectedToken ? (
          <>
            <span className="text-lg">{selectedToken.logo}</span>
            <span className="font-semibold text-sm text-white">{selectedToken.symbol}</span>
          </>
        ) : (
          <span className="text-sm text-portal-muted">Select token</span>
        )}
        <svg className="w-4 h-4 text-portal-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-portal-card border border-portal-border rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-portal-border">
              <p className="text-xs text-portal-muted font-medium">Select a token</p>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {availableTokens.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => {
                    onSelect(token);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-portal-surface transition-colors ${
                    selectedToken?.symbol === token.symbol ? 'bg-portal-primary/10' : ''
                  }`}
                >
                  <span className="text-2xl">{token.logo}</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{token.symbol}</p>
                    <p className="text-xs text-portal-muted">{token.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
