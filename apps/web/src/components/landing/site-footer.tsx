const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Live markets", href: "#markets" },
      { label: "Scoring", href: "#scoring" },
      { label: "Execution", href: "#execution" }
    ]
  },
  {
    title: "Network",
    links: [
      { label: "DreamDEX", href: "#top" },
      { label: "Somnia Shannon", href: "#top" },
      { label: "Event contracts", href: "#top" }
    ]
  },
  {
    title: "Safety",
    links: [
      { label: "Read-only API", href: "#api" },
      { label: "Wallet signing", href: "#execution" },
      { label: "Fresh preflight", href: "#execution" }
    ]
  }
];

export function SiteFooter() {
  return (
    <footer className="bg-press-black text-bone-white">
      <div className="page-shell grid gap-12 py-16 lg:grid-cols-[minmax(0,1fr)_repeat(3,180px)] lg:py-24">
        <div>
          <p className="font-display text-[2.5rem] leading-none tracking-[-0.04em] text-bone-white">
            Brink Markets
          </p>
          <p className="mt-5 max-w-[360px] text-body-sm text-muted-sage">
            A market-discovery and execution layer for DreamDEX event contracts.
            Read-only ranking, wallet-signed trading.
          </p>
        </div>
        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="eyebrow text-muted-sage">{group.title}</p>
            <ul className="mt-5 space-y-3">
              {group.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-body-sm text-bone-white underline-offset-4 transition hover:text-highlighter-green hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="bg-highlighter-green text-press-black">
        <div className="page-shell flex min-h-[240px] items-center justify-between py-16 lg:min-h-[320px]">
          <span className="font-display text-[clamp(5rem,16vw,14rem)] leading-[0.85] tracking-[-0.05em] text-press-black">
            Brink
          </span>
          <span className="eyebrow hidden text-press-black lg:block">
            Event contracts · Shannon testnet
          </span>
        </div>
      </div>
    </footer>
  );
}
