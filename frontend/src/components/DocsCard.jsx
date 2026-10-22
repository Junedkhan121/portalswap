import { useState } from 'react';
import { ADDRESSES, TOKENS } from '../utils/addresses';

const SECTIONS = [
  { id: 'intro',     label: 'What is PortalSwap' },
  { id: 'how',       label: 'How it works' },
  { id: 'start',     label: 'Getting started' },
  { id: 'swap',      label: 'Swapping tokens' },
  { id: 'liquidity', label: 'Adding liquidity' },
  { id: 'fees',      label: 'Fees & rewards' },
  { id: 'contracts', label: 'Contract addresses' },
  { id: 'roadmap',   label: 'Roadmap' },
  { id: 'security',  label: 'Security' },
];

const Badge = ({ children, color = '#3d7eff' }) => (
  <span style={{
    display: 'inline-block', padding: '2px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 600, fontFamily: 'Space Grotesk',
    background: `${color}20`, color, border: `1px solid ${color}40`,
  }}>{children}</span>
);

const Code = ({ children }) => (
  <code style={{
    fontFamily: 'monospace', fontSize: 13,
    background: 'rgba(61,126,255,0.1)', color: '#9ab0d4',
    padding: '2px 7px', borderRadius: 6,
  }}>{children}</code>
);

const Step = ({ n, title, children }) => (
  <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2,
      background: 'linear-gradient(135deg, #3d7eff, #6a4aff)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk',
    }}>{n}</div>
    <div>
      <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, color: '#e8f0ff', marginBottom: 4 }}>{title}</p>
      <p style={{ fontSize: 14, color: '#9ab0d4', lineHeight: 1.65 }}>{children}</p>
    </div>
  </div>
);

const ContractRow = ({ label, address }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(30,46,74,0.5)' }}>
    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: '#9ab0d4' }}>{label}</span>
    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#3d7eff', wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>
      {address === '0x0000000000000000000000000000000000000000' ? '—' : address}
    </span>
  </div>
);

export default function DocsCard() {
  const [active, setActive] = useState('intro');

  const scrollTo = (id) => {
    setActive(id);
    document.getElementById(`doc-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="glass-card rounded-3xl overflow-hidden" style={{ minHeight: 600 }}>
      <div style={{ display: 'flex' }}>

        {/* Sidebar */}
        <div style={{ width: 180, flexShrink: 0, borderRight: '1px solid rgba(30,46,74,0.6)', padding: '20px 0' }}>
          <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11, color: '#4e6490', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 16px 12px' }}>
            Documentation
          </p>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 16px', fontSize: 13, fontFamily: 'Space Grotesk', fontWeight: 500,
                color: active === s.id ? '#fff' : '#9ab0d4',
                background: active === s.id ? 'rgba(61,126,255,0.12)' : 'transparent',
                borderLeft: active === s.id ? '2px solid #3d7eff' : '2px solid transparent',
                transition: 'all 0.15s', cursor: 'pointer', border: 'none',
              }}
              onMouseEnter={e => { if (active !== s.id) e.currentTarget.style.color='#e8f0ff'; }}
              onMouseLeave={e => { if (active !== s.id) e.currentTarget.style.color='#9ab0d4'; }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', maxHeight: 680 }}>

          {/* What is PortalSwap */}
          <section id="doc-intro" style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: '#e8f0ff', margin: 0 }}>
                What is PortalSwap?
              </h2>
              <Badge color="#10b981">Live on Testnet</Badge>
            </div>
            <p style={{ fontSize: 14, color: '#9ab0d4', lineHeight: 1.75, marginBottom: 14 }}>
              <strong style={{ color: '#e8f0ff' }}>PortalSwap</strong> is a decentralized exchange (DEX) built natively on the{' '}
              <strong style={{ color: '#3d7eff' }}>Portaldot V3.0 Testnet</strong> — a WASM-backed EVM-compatible blockchain.
              It lets anyone swap ERC-20 tokens and native tPOTv3 without a central intermediary, using an{' '}
              <em>automated market maker</em> (AMM) model.
            </p>
            <p style={{ fontSize: 14, color: '#9ab0d4', lineHeight: 1.75, marginBottom: 14 }}>
              Unlike traditional order-book exchanges, PortalSwap uses <strong style={{ color: '#e8f0ff' }}>liquidity pools</strong> — 
              reserves of two tokens locked in a smart contract. Prices are set automatically by a mathematical formula, 
              so trading is always available 24/7 with no counterparty needed.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
              {[
                { icon: '⚡', title: 'Instant swaps', desc: 'No order matching. Trades execute in a single transaction.' },
                { icon: '🔒', title: 'Non-custodial', desc: 'Your funds never leave your wallet until a swap or deposit.' },
                { icon: '💰', title: 'Earn fees', desc: 'Liquidity providers earn 0.3% of every trade in their pool.' },
                { icon: '🌐', title: 'Permissionless', desc: 'No sign-up, no KYC. Connect your wallet and start trading.' },
              ].map(f => (
                <div key={f.title} style={{ padding: 16, borderRadius: 16, background: 'rgba(7,9,15,0.6)', border: '1px solid rgba(30,46,74,0.5)' }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: '#e8f0ff', marginBottom: 4 }}>{f.title}</p>
                  <p style={{ fontSize: 12, color: '#4e6490', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section id="doc-how" style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: '#e8f0ff', marginBottom: 16 }}>
              How it works
            </h2>
            <p style={{ fontSize: 14, color: '#9ab0d4', lineHeight: 1.75, marginBottom: 16 }}>
              PortalSwap uses the <strong style={{ color: '#e8f0ff' }}>Constant Product Formula</strong> — the same model 
              pioneered by Uniswap V2. Every pool holds two tokens (<Code>x</Code> and <Code>y</Code>) and enforces one rule:
            </p>
            <div style={{ textAlign: 'center', padding: '20px', borderRadius: 16, background: 'rgba(61,126,255,0.07)', border: '1px solid rgba(61,126,255,0.2)', marginBottom: 20 }}>
              <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 24, color: '#3d7eff', margin: 0 }}>x × y = k</p>
              <p style={{ fontSize: 12, color: '#4e6490', marginTop: 8 }}>The product of reserves must remain constant after every trade.</p>
            </div>
            <p style={{ fontSize: 14, color: '#9ab0d4', lineHeight: 1.75, marginBottom: 12 }}>
              When you swap token A for token B, you add A to the pool and remove B. The contract calculates exactly how 
              much B you receive so that <Code>x × y = k</Code> still holds (minus the 0.3% fee).
            </p>
            <p style={{ fontSize: 14, color: '#9ab0d4', lineHeight: 1.75, marginBottom: 16 }}>
              The <strong style={{ color: '#e8f0ff' }}>swap formula</strong> with the fee applied:
            </p>
            <div style={{ padding: 16, borderRadius: 12, background: 'rgba(7,9,15,0.7)', border: '1px solid rgba(30,46,74,0.6)', marginBottom: 20, fontFamily: 'monospace', fontSize: 13, color: '#9ab0d4', lineHeight: 1.8 }}>
              amountOut = (amountIn × 997 × reserveOut)<br />
              {'         '}÷ (reserveIn × 1000 + amountIn × 997)
            </div>
            <p style={{ fontSize: 14, color: '#9ab0d4', lineHeight: 1.75 }}>
              The <Code>997/1000</Code> ratio represents the 0.3% fee — 997 out of every 1000 units actually enter the pool, 
              and the remaining 3 stay in the pool as a fee for liquidity providers.
            </p>
          </section>

          {/* Getting started */}
          <section id="doc-start" style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: '#e8f0ff', marginBottom: 20 }}>
              Getting started
            </h2>
            <Step n="1" title="Install a wallet">
              Install <strong style={{ color: '#e8f0ff' }}>MetaMask</strong> or <strong style={{ color: '#e8f0ff' }}>OKX Wallet</strong> as a browser extension. These wallets let you sign transactions on EVM blockchains.
            </Step>
            <Step n="2" title="Add Portaldot V3 Testnet">
              Click the <strong style={{ color: '#3d7eff' }}>Add Network</strong> button in the top-right corner of PortalSwap. Your wallet will show a popup — approve it to add the Portaldot V3 Testnet automatically.
            </Step>
            <Step n="3" title="Get testnet tPOTv3 tokens">
              Join the <a href="https://discord.gg/portaldot" target="_blank" rel="noopener noreferrer" style={{ color: '#3d7eff' }}>Portaldot Discord</a> and visit the faucet channel. Paste your wallet address and receive free tPOTv3 for gas fees.
            </Step>
            <Step n="4" title="Connect your wallet">
              Click <strong style={{ color: '#3d7eff' }}>Connect Wallet</strong> in the header. Approve the connection request in your wallet. Your balance will appear in the top bar.
            </Step>
            <Step n="5" title="Get test tokens from the Faucet">
              Open the <strong style={{ color: '#e8f0ff' }}>Faucet</strong> tab and click Mint next to any token (pUSDT, pDAI, pWBTC, pLINK). These are free testnet tokens with no real value, used to try the DEX.
            </Step>
          </section>

          {/* Swapping */}
          <section id="doc-swap" style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: '#e8f0ff', marginBottom: 16 }}>
              Swapping tokens
            </h2>
            <p style={{ fontSize: 14, color: '#9ab0d4', lineHeight: 1.75, marginBottom: 16 }}>
              The <strong style={{ color: '#e8f0ff' }}>Swap</strong> tab is the main trading interface. Select the token you want to pay with in the top panel and the token you want to receive in the bottom panel.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                ['Enter amount',  'Type how much you want to spend. The output is calculated instantly using live pool reserves.'],
                ['Check the rate', 'The rate, price impact, and 0.3% fee are shown before you confirm. High price impact (>5%) means the pool is shallow — consider splitting into smaller trades.'],
                ['Set slippage',  'Click the ⚙ icon to adjust slippage tolerance. Default is 0.5%. Increase it if transactions keep failing on a volatile pair.'],
                ['Approve & swap', 'For ERC-20 tokens, you\'ll sign an approval first (one time per token), then confirm the swap. Native tPOTv3 needs no approval.'],
              ].map(([t, d]) => (
                <div key={t} style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(7,9,15,0.5)', border: '1px solid rgba(30,46,74,0.5)' }}>
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: '#e8f0ff', marginBottom: 4 }}>{t}</p>
                  <p style={{ fontSize: 13, color: '#9ab0d4', lineHeight: 1.6 }}>{d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Liquidity */}
          <section id="doc-liquidity" style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: '#e8f0ff', marginBottom: 16 }}>
              Adding liquidity
            </h2>
            <p style={{ fontSize: 14, color: '#9ab0d4', lineHeight: 1.75, marginBottom: 16 }}>
              Liquidity providers (LPs) deposit equal value of two tokens into a pool and receive <strong style={{ color: '#e8f0ff' }}>LP tokens</strong> representing their share. When traders use the pool, the 0.3% fee accumulates inside — LPs claim their share by withdrawing.
            </p>
            <Step n="1" title="Select a token pair">
              Open the <strong style={{ color: '#e8f0ff' }}>Liquidity</strong> tab. Choose the two tokens you want to deposit. If no pool exists yet, you will create it and set the initial price.
            </Step>
            <Step n="2" title="Enter deposit amounts">
              Type one amount — the other fills automatically based on the current pool ratio. For a new pool you set both amounts freely; this determines the starting price.
            </Step>
            <Step n="3" title="Approve and deposit">
              Approve each ERC-20 token, then click <strong style={{ color: '#3d7eff' }}>Add Liquidity</strong>. LP tokens land in your wallet. Keep them — they represent your stake.
            </Step>
            <Step n="4" title="Withdraw when ready">
              Switch to the <strong style={{ color: '#e8f0ff' }}>Remove</strong> tab, enter how many LP tokens to burn, and receive your share of the pool including accumulated fees.
            </Step>
            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', marginTop: 4 }}>
              <p style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.65 }}>
                <strong>⚠ Impermanent Loss:</strong> If the price of one token moves significantly relative to the other after you deposit, you may receive less value than simply holding. This risk is higher for volatile pairs.
              </p>
            </div>
          </section>

          {/* Fees */}
          <section id="doc-fees" style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: '#e8f0ff', marginBottom: 16 }}>
              Fees & rewards
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Trading fee', value: '0.3%', note: 'Per swap, deducted from input' },
                { label: 'LP share', value: '100%', note: 'All fees go to providers' },
                { label: 'Protocol fee', value: '0%', note: 'Currently disabled' },
              ].map(f => (
                <div key={f.label} style={{ padding: 16, borderRadius: 14, background: 'rgba(7,9,15,0.6)', border: '1px solid rgba(30,46,74,0.5)', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: '#3d7eff', marginBottom: 4 }}>{f.value}</p>
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 12, color: '#e8f0ff', marginBottom: 4 }}>{f.label}</p>
                  <p style={{ fontSize: 11, color: '#4e6490' }}>{f.note}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 14, color: '#9ab0d4', lineHeight: 1.75 }}>
              Fees are not collected separately — they compound inside the pool. When you remove liquidity, you receive slightly more than you deposited (if the pool was used). Your LP token balance stays the same; the pool reserves behind each token grow.
            </p>
          </section>

          {/* Contract addresses */}
          <section id="doc-contracts" style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: '#e8f0ff', marginBottom: 4 }}>
              Contract addresses
            </h2>
            <p style={{ fontSize: 13, color: '#4e6490', marginBottom: 16 }}>Portaldot V3 Testnet · Chain ID 420420777</p>
            <div style={{ background: 'rgba(7,9,15,0.6)', border: '1px solid rgba(30,46,74,0.6)', borderRadius: 16, padding: '4px 16px' }}>
              <ContractRow label="WPOT"    address={ADDRESSES.WPOT} />
              <ContractRow label="Factory" address={ADDRESSES.Factory} />
              <ContractRow label="Router"  address={ADDRESSES.Router} />
              {TOKENS.filter(t => !t.isNative && t.symbol !== 'WPOT').map(t => (
                <ContractRow key={t.symbol} label={t.symbol} address={t.address} />
              ))}
            </div>
          </section>

          {/* Roadmap */}
          <section id="doc-roadmap" style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: '#e8f0ff', marginBottom: 20 }}>
              Roadmap
            </h2>
            {[
              { phase: 'Phase 1', status: 'done',    title: 'Testnet launch',         items: ['Core AMM contracts (Factory, Router, Pair)', 'WPOT wrapper', 'React frontend with Swap, Liquidity, Analytics, Faucet', 'Deployment on Portaldot V3 Testnet'] },
              { phase: 'Phase 2', status: 'active',  title: 'DeFi primitives',         items: ['Multi-hop routing (A→B→C swaps)', 'Price oracle integration (TWAP)', 'LP staking & farming rewards', 'Token pair creation UI'] },
              { phase: 'Phase 3', status: 'planned', title: 'Governance & mainnet',    items: ['SWAP governance token', 'On-chain voting for fee parameters', 'Mainnet deployment when available', 'Audit by third-party security firm'] },
              { phase: 'Phase 4', status: 'planned', title: 'Advanced features',       items: ['Limit orders via keeper bots', 'Concentrated liquidity (V3-style)', 'Cross-chain bridge integration', 'Mobile-first PWA'] },
            ].map(({ phase, status, title, items }) => {
              const colors = { done: '#10b981', active: '#3d7eff', planned: '#4e6490' };
              const labels = { done: 'Complete', active: 'In progress', planned: 'Planned' };
              return (
                <div key={phase} style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: colors[status], boxShadow: `0 0 8px ${colors[status]}88`, marginTop: 4 }} />
                    <div style={{ flex: 1, width: 2, background: 'rgba(30,46,74,0.6)', marginTop: 6 }} />
                  </div>
                  <div style={{ flex: 1, paddingBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: '#e8f0ff' }}>{phase} — {title}</span>
                      <Badge color={colors[status]}>{labels[status]}</Badge>
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {items.map(item => (
                        <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9ab0d4', marginBottom: 4 }}>
                          <span style={{ color: status === 'done' ? '#10b981' : '#4e6490', fontSize: 10 }}>
                            {status === 'done' ? '✓' : '○'}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Security */}
          <section id="doc-security" style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: '#e8f0ff', marginBottom: 16 }}>
              Security
            </h2>
            {[
              ['Reentrancy protection', 'All state-changing functions in PortalSwapPair use a mutex lock modifier that prevents nested calls and reentrancy attacks.'],
              ['Overflow protection', 'Written in Solidity 0.8.20 which has built-in overflow and underflow checks on all arithmetic operations.'],
              ['Minimum liquidity lock', '1,000 LP wei is permanently burned to address 0xdead on the first deposit of every pool. This prevents the first-depositor attack where a pool could be drained via donation.'],
              ['Deterministic pair addresses', 'Pair contracts are deployed with CREATE2, so any pair address can be computed off-chain from the two token addresses without an RPC call — reducing attack surface.'],
              ['Testnet status', 'PortalSwap is currently on the Portaldot V3 Testnet. Do not send real funds. Contracts have not yet been audited.'],
            ].map(([title, desc]) => (
              <div key={title} style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(7,9,15,0.5)', border: '1px solid rgba(30,46,74,0.5)', marginBottom: 10 }}>
                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 13, color: '#e8f0ff', marginBottom: 5 }}>{title}</p>
                <p style={{ fontSize: 13, color: '#9ab0d4', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </section>

        </div>
      </div>
    </div>
  );
}
