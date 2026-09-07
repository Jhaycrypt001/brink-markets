import { ArrowUpRight, Activity, Gauge, ShieldCheck, Code2 } from "lucide-react";
import { NavBar, type NavItem } from "@/components/ui/tubelight-navbar";
import { GlassButton } from "@/components/ui/glass-button";

const navItems: NavItem[] = [
  { name: "Markets", url: "#markets", icon: Activity },
  { name: "Scoring", url: "#scoring", icon: Gauge },
  { name: "Execution", url: "#execution", icon: ShieldCheck },
  { name: "API", url: "#api", icon: Code2 }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-press-black/15 bg-bone-white/85 backdrop-blur-md">
      <div className="page-shell flex min-h-[76px] items-center justify-between gap-6 py-4">
        <a href="#top" className="flex items-baseline gap-2">
          <span className="font-display text-[1.75rem] leading-none tracking-[-0.04em] text-press-black">
            Brink
          </span>
          <span className="eyebrow hidden text-newsprint-gray sm:block">Markets</span>
        </a>

        <NavBar items={navItems} className="hidden md:flex" />

        <GlassButton href="#markets" tone="green" contentClassName="gap-2">
          Live feed
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </GlassButton>
      </div>

      {/* Compact section nav for narrow screens — icons only. */}
      <div className="page-shell flex justify-center pb-3 md:hidden">
        <NavBar items={navItems} />
      </div>
    </header>
  );
}
