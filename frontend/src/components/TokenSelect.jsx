import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { TOKENS, ADDRESSES, RPC_URL } from '../utils/addresses';
import { ERC20_ABI } from '../utils/abis';

const TOKEN_COLORS = {
  tPOTv3: ['var(--accent-blue)', 'var(--accent-purple)'],
  WPOT:   ['var(--accent-purple)', 'var(--accent-blue)'],
  pUSDT:  ['var(--accent-green)', 'var(--accent-green)'],
  pDAI:   ['var(--accent-yellow)', 'var(--accent-yellow)'],
  pWBTC:  ['var(--accent-orange)', 'var(--accent-orange)'],
  pLINK:  ['var(--accent-blue)', 'var(--accent-blue)'],
};

export function TokenAvatar({ token, size = 32 }) {
  const [c1, c2] = TOKEN_COLORS[token?.symbol] || ['var(--accent-blue)', 'var(--accent-purple)'];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${c1}, ${c2})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38, color: '#fff',
      flexShrink: 0, fontFamily: 'var(--font-primary)',
      boxShadow: `0 0 10px ${c1}44`,
    }}>
      {token?.symbol?.[0] ?? '?'}
    </div>
  );
}

const effectiveAddress = (t) => {
  if (!t) return null;
  if (t.isNative) return ADDRESSES.WPOT?.toLowerCase();
  return t.address?.toLowerCase();
};
const ZERO = '0x0000000000000000000000000000000000000000';
const isPlaceholder = (a) => !a || a === ZERO;

export default function TokenSelect({ selectedToken, onSelect, otherToken }) {
  const [isOpen, setIsOpen]     = useState(false);
  const [search, setSearch]     = useState('');
  const [importing, setImporting] = useState(false);
  const [importToken, setImportToken] = useState(null);
  const [importErr, setImportErr]     = useState('');
  const otherAddr = effectiveAddress(otherToken);

  const availableTokens = TOKENS.filter((t) => {
    if (t.symbol === otherToken?.symbol) return false;
    const addr = effectiveAddress(t);
    if (!isPlaceholder(addr) && addr === otherAddr) return false;
    if (search) return t.symbol.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  // Import custom token by address
  useEffect(() => {
    setImportToken(null); setImportErr('');
    if (!ethers.isAddress(search)) return;
    if (TOKENS.find(t => t.address?.toLowerCase() === search.toLowerCase())) return;
    setImporting(true);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(search, ERC20_ABI, provider);
    Promise.all([contract.name(), contract.symbol(), contract.decimals()])
      .then(([name, symbol, decimals]) => {
        setImportToken({ name, symbol, address: search, decimals: Number(decimals) });
      })
      .catch(() => setImportErr('Contract not found or not a valid ERC-20'))
      .finally(() => setImporting(false));
  }, [search]);

  const handleSelect = (token) => { onSelect(token); setIsOpen(false); setSearch(''); };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="token-pill flex items-center gap-2 px-3 py-2 rounded-2xl">
        {selectedToken ? (
          <>
            <TokenAvatar token={selectedToken} size={26} />
            <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{selectedToken.symbol}</span>
          </>
        ) : (
          <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: 14, color: 'var(--accent-blue)', padding: '0 4px' }}>Select token</span>
        )}
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setSearch(''); }} />
          <div className="absolute right-0 mt-2 w-72 rounded-2xl z-50 overflow-hidden"
            style={{ background: 'var(--bg-modal)', border: '1px solid var(--border-menu)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
            {/* Search / import */}
            <div style={{ padding: '12px 12px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-input)', border: '1px solid var(--border-secondary)', borderRadius: 12, padding: '8px 12px' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search or paste address…"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }} />
              </div>
            </div>

            <div style={{ padding: '0 12px 4px', borderBottom: '1px solid var(--border-secondary)' }}>
              <p style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', paddingBottom: 8 }}>
                {search && ethers.isAddress(search) ? 'Import token' : 'Select a token'}
              </p>
            </div>

            <div style={{ maxHeight: 400, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 8 }}>
              {/* Import result */}
              {importing && (
                <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                    <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Looking up contract…
                </div>
              )}
              {importErr && <p style={{ padding: '8px 16px', fontSize: 12, color: 'var(--text-error)' }}>{importErr}</p>}
              {importToken && (
                <button onClick={() => handleSelect(importToken)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', background: 'var(--bg-badge)', border: 'none', cursor: 'pointer', borderLeft: '3px solid var(--accent-blue)' }}>
                  <TokenAvatar token={importToken} size={36} />
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <p style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{importToken.symbol}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{importToken.name}</p>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--accent-blue)', background: 'var(--bg-badge-hover)', padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-primary)', fontWeight: 600 }}>Import</span>
                </button>
              )}

              {/* Normal token list */}
              {!importToken && availableTokens.map((token) => {
                const [c1] = TOKEN_COLORS[token.symbol] || ['var(--accent-blue)'];
                const isSelected = selectedToken?.symbol === token.symbol;
                return (
                  <button key={token.symbol} onClick={() => handleSelect(token)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', background: isSelected ? `${c1}18` : 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background='var(--bg-menu-item-hover)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background='transparent'; }}>
                    <TokenAvatar token={token} size={36} />
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <p style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{token.symbol}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{token.name}</p>
                    </div>
                    {isSelected && (
                      <svg width="16" height="16" fill={c1} viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </button>
                );
              })}
              {!importing && !importToken && availableTokens.length === 0 && !importErr && (
                <p style={{ padding: '16px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>No tokens match "{search}"</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}