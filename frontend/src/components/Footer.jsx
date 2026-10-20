export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-portal-dark/90 backdrop-blur-md border-t border-portal-border/50 py-3">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        <p className="text-xs text-portal-muted">
          PortalSwap — Built on Portaldot V3.0 Testnet
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://discord.gg/portaldot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-portal-muted hover:text-portal-primary transition"
          >
            Discord
          </a>
          <a
            href="https://dorahacks.io/hackathon/portaldot-hacker-house-2026/detail"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-portal-muted hover:text-portal-primary transition"
          >
            Hackathon
          </a>
        </div>
      </div>
    </footer>
  );
}
