import { ArrowUpRight } from "lucide-react";
import { SlideTabs, type SlideTab } from "@/components/ui/slide-tabs";

const tabs: SlideTab[] = [
  { id: "markets", label: "Markets", href: "#markets" },
  { id: "scoring", label: "Scoring", href: "#scoring" },
  { id: "execution", label: "Execution", href: "#execution" },
  { id: "api", label: "API", href: "#api" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-press-black/15 bg-bone-white/90 backdrop-blur-md">
      <div className="page-shell flex min-h-[76px] flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-6">
          <a href="#top" className="flex items-baseline gap-2">
            <span className="font-display text-[1.75rem] leading-none tracking-[-0.04em] text-press-black">
              Brink
            </span>
            <span className="eyebrow hidden text-newsprint-gray sm:block">
              Markets
            </span>
          </a>
          <a
            href="#markets"
            className="inline-flex items-center gap-2 rounded-button bg-highlighter-green px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.11px] text-typesetter-ink shadow-brink transition hover:-translate-y-0.5 lg:hidden"
          >
            Live feed
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <nav className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:gap-7">
          <SlideTabs tabs={tabs} />
          <a
            href="#markets"
            className="hidden items-center gap-2 rounded-button bg-highlighter-green px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.11px] text-typesetter-ink shadow-brink transition hover:-translate-y-0.5 lg:inline-flex"
          >
            Live feed
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  );
}
