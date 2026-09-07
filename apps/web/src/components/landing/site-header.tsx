import { ArrowUpRight, Activity, Gauge, ShieldCheck, Code2, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { NavBar, type NavItem } from "@/components/ui/tubelight-navbar";
import { GlassButton } from "@/components/ui/glass-button";
import { BrinkMark } from "@/components/ui/brink-mark";

const navItems: NavItem[] = [
  { name: "Markets", url: "/#markets", icon: Activity },
  { name: "Scoring", url: "/#scoring", icon: Gauge },
  { name: "Execution", url: "/#execution", icon: ShieldCheck },
  { name: "API", url: "/#api", icon: Code2 },
  { name: "Docs", url: "/docs", icon: BookOpen }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-press-black/15 bg-bone-white/85 backdrop-blur-md">
      <div className="page-shell flex min-h-[76px] items-center justify-between gap-4 py-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Brink — home">
          <BrinkMark className="h-6 w-6 text-press-black" />
          <span className="font-display text-[1.75rem] leading-none tracking-[-0.04em] text-press-black">
            Brink
          </span>
          <span className="eyebrow hidden text-newsprint-gray sm:block">Markets</span>
        </Link>

        <NavBar items={navItems} className="hidden lg:flex" />

        <GlassButton
          to="/dashboard"
          tone="green"
          contentClassName="gap-2"
          className="hidden sm:inline-flex"
        >
          Live feed
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </GlassButton>
      </div>

      {/* Compact nav for narrow screens — icons only, scrolls if needed. */}
      <div className="page-shell flex justify-center pb-3 lg:hidden">
        <div className="max-w-full overflow-x-auto">
          <NavBar items={navItems} />
        </div>
      </div>
    </header>
  );
}
