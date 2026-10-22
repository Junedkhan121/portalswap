export default function Footer() {
  return (
    <footer style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(7,9,15,0.92)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border-primary)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 48,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-primary)', fontWeight: 500 }}>
            PortalSwap · Portaldot V3 Testnet
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a href="https://discord.gg/portaldot" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color='var(--accent-blue)'}
            onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}
          >
            Discord
          </a>
          <a href="https://dorahacks.io/hackathon/portaldot-hacker-house-2026/detail" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color='var(--accent-blue)'}
            onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}
          >
            DoraHacks
          </a>
          <a href="https://github.com/Junedkhan121/portalswap" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color='var(--accent-blue)'}
            onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}