import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Wallet, Users, Trophy, Radar, LayoutGrid } from "lucide-react";
import { fetchMarkets, DEMO_MARKETS, type ScoredMarket } from "@/lib/markets";
import { BrinkLoader } from "@/components/dashboard/brink-loader";
import { AppSidebar, type DashView } from "@/components/dashboard/app-sidebar";
import { AppTopbar } from "@/components/dashboard/app-topbar";
import { TradeView } from "@/components/dashboard/trade-view";
import { SettingsView } from "@/components/dashboard/settings-view";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  const [intro, setIntro] = useState(true);
  const [markets, setMarkets] = useState<ScoredMarket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [source, setSource] = useState<"live" | "demo">("demo");
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const [view, setView] = useState<DashView>("trade");
  const [collapsed, setCollapsed] = useState(() => readBool("brink.sidebar.collapsed", false));
  const [drawer, setDrawer] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const live = await fetchMarkets(24);
      const data = live.length > 0 ? live : DEMO_MARKETS;
      setMarkets(data);
      setSource(live.length > 0 ? "live" : "demo");
      setSelectedId((prev) => prev ?? data[0]?.marketId ?? null);
    } catch {
      setMarkets(DEMO_MARKETS);
      setSource("demo");
      setSelectedId((prev) => prev ?? DEMO_MARKETS[0]?.marketId ?? null);
    } finally {
      setElapsed(0);
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("brink.sidebar.collapsed", String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const ranked = useMemo(
    () => [...markets].sort((a, b) => b.score - a.score),
    [markets]
  );
  const selected = ranked.find((m) => m.marketId === selectedId) ?? ranked[0];

  function pick(view: DashView) {
    setView(view);
    setDrawer(false);
  }

  return (
    <div className="min-h-screen bg-[#0c0f0d] text-bone-white">
      {intro && <BrinkLoader onComplete={() => setIntro(false)} />}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-white/[0.06] lg:block",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        <AppSidebar view={view} onView={pick} collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[260px] border-r border-white/[0.06] lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
            >
              <button
                type="button"
                onClick={() => setDrawer(false)}
                className="absolute right-3 top-4 z-10 rounded-md p-1.5 text-muted-sage/60 hover:text-bone-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <AppSidebar view={view} onView={pick} collapsed={false} onToggleCollapse={() => {}} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[68px]" : "lg:pl-[240px]")}>
        <AppTopbar onOpenMenu={() => setDrawer(true)} source={source} loading={loading} onRefresh={() => void load()} />

        <main className="mx-auto max-w-[1400px] px-3 py-4 sm:px-5 sm:py-6">
          {view === "trade" && selected && !loading && (
            <TradeView markets={ranked} selected={selected} onSelect={(m) => setSelectedId(m.marketId)} elapsed={elapsed} />
          )}
          {view === "trade" && loading && <TradeSkeleton />}
          {view === "settings" && <SettingsView />}
          {view !== "trade" && view !== "settings" && <ComingSoon view={view} />}
        </main>
      </div>
    </div>
  );
}

function TradeSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-16 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.02]" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="h-80 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.02]" />
        <div className="h-80 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.02]" />
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.02]" />
    </div>
  );
}

const COMING = {
  markets: { icon: LayoutGrid, title: "Markets board", body: "A full grid of every ranked event contract lands here next." },
  scanner: { icon: Radar, title: "Scanner", body: "Set score, spread, and expiry filters to surface markets the moment they qualify." },
  leaderboard: { icon: Trophy, title: "Leaderboard", body: "Top discovery streaks and the sharpest scored calls, ranked." },
  wallet: { icon: Wallet, title: "Wallet", body: "Connect a Shannon wallet to sign orders — discovery stays read-only until you do." },
  referrals: { icon: Users, title: "Referrals", body: "Invite traders and track your referral rewards." },
  intelligence: { icon: Bot, title: "Brink AI", body: "Natural-language market discovery and score explanations, live soon." }
} as const;

function ComingSoon({ view }: { view: Exclude<DashView, "trade" | "settings"> }) {
  const meta = COMING[view];
  const Icon = meta.icon;
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <Icon className="h-6 w-6 text-highlighter-green" />
        </span>
        <h2 className="mt-6 font-display text-[2rem] leading-none tracking-[-0.03em]">{meta.title}</h2>
        <p className="mt-3 text-[14px] text-muted-sage/60">{meta.body}</p>
        <span className="mt-5 inline-flex rounded-full border border-white/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-sage/50">
          Coming soon
        </span>
      </div>
    </div>
  );
}

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "true";
  } catch {
    return fallback;
  }
}
