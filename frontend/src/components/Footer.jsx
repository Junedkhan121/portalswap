export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: 'rgba(7,9,15,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(30,46,74,0.5)' }}>
      <div className="max-w-6xl mx-auto px-5 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-portal-green" />
          <span className="text-xs text-portal-muted">PortalSwap · Portaldot V3 Testnet</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="https://discord.gg/portaldot" target="_blank" rel="noopener noreferrer"
            className="text-xs text-portal-muted hover:text-portal-primary transition">Discord</a>
          <a href="https://dorahacks.io/hackathon/portaldot-hacker-house-2026/detail" target="_blank" rel="noopener noreferrer"
            className="text-xs text-portal-muted hover:text-portal-primary transition">DoraHacks</a>
          <a href="https://github.com/Junedkhan121/portalswap" target="_blank" rel="noopener noreferrer"
            className="text-xs text-portal-muted hover:text-portal-primary transition">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
