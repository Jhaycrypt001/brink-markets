import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/motion";
import { GlassButton } from "@/components/ui/glass-button";
import { DancingLetters } from "@/components/ui/dancing-letters";
import { BrinkMark } from "@/components/ui/brink-mark";

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

const bandLabels = [
  "Market discovery · DreamDEX",
  "Somnia Shannon · Read-only",
  "Est. 2026"
];

export function SiteFooter() {
  return (
    <footer className="bg-press-black text-bone-white">
      <div className="page-shell grid gap-12 py-16 lg:grid-cols-[minmax(0,1fr)_repeat(3,180px)] lg:py-24">
        <Reveal from="up">
          <div className="flex items-center gap-3">
            <BrinkMark className="h-8 w-8 text-bone-white" />
            <p className="font-display text-[2.5rem] leading-[1.05] tracking-[-0.04em] text-bone-white">
              Brink Markets
            </p>
          </div>
          <p className="mt-5 max-w-[360px] text-body-sm text-muted-sage">
            A market-discovery and execution layer for DreamDEX event contracts.
            Read-only ranking, wallet-signed trading.
          </p>
          <GlassButton
            to="/dashboard"
            tone="dark"
            contentClassName="gap-2"
            className="mt-7"
          >
            Open the feed
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </GlassButton>
        </Reveal>

        {footerGroups.map((group, index) => (
          <Reveal key={group.title} from="up" delay={0.06 * (index + 1)}>
            <nav aria-label={group.title}>
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
          </Reveal>
        ))}
      </div>

      {/* Full-bleed accent band — the closing signature. The wordmark sits in a
          box with enough leading and bottom padding that no glyph is clipped. */}
      <div className="bg-highlighter-green text-press-black">
        <div className="page-shell py-14 lg:py-20">
          <div className="flex flex-col gap-4 border-b border-press-black/20 pb-6 sm:flex-row sm:items-center sm:justify-between">
            {bandLabels.map((label) => (
              <span key={label} className="eyebrow text-press-black">
                {label}
              </span>
            ))}
          </div>
          <DancingLetters
            text="Brink"
            className="mt-10 pb-[0.12em] font-display text-[clamp(5rem,17vw,15rem)] leading-[0.92] tracking-[-0.05em] text-press-black"
          />
        </div>
      </div>
    </footer>
  );
}
