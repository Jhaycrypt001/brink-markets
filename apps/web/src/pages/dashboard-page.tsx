import { useEffect, useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, WifiOff, ServerCrash } from "lucide-react";
import type { ScoredMarket } from "@/lib/markets";
import { BrinkLoader } from "@/components/dashboard/brink-loader";
import { AppSidebar, type DashView } from "@/components/dashboard/app-sidebar";
import { AppTopbar } from "@/components/dashboard/app-topbar";
import { TradeView } from "@/components/dashboard/trade-view";
import { SettingsView } from "@/components/dashboard/settings-view";
import { WalletProvider } from "@/components/dashboard/wallet";
import { PreferencesProvider, usePrefs } from "@/components/dashboard/prefs";
import { NotificationsProvider } from "@/components/dashboard/notifications";
import { ProfileProvider } from "@/components/dashboard/profile";
import { useMarketFeed } from "@/components/dashboard/use-market-feed";
import { RequireWallet } from "@/components/dashboard/require-wallet";
import { MarketsView } from "@/components/dashboard/views/markets-view";
import { ScannerView } from "@/components/dashboard/views/scanner-view";
import { LeaderboardView } from "@/components/dashboard/views/leaderboard-view";
import { WalletView } from "@/components/dashboard/views/wallet-view";
import { ReferralsView } from "@/components/dashboard/views/referrals-view";
import { BrinkAiView } from "@/components/dashboard/views/brink-ai-view";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  return (
    // WalletProvider is outermost so Preferences and Notifications (both keyed
    // per connected wallet address) can read the active account.
    <WalletProvider>
      <PreferencesProvider>
        <NotificationsProvider>
          <ProfileProvider>
            <DashboardInner />
          </ProfileProvider>
        </NotificationsProvider>
      </PreferencesProvider>
    </WalletProvider>
  );
}

function DashboardInner() {
  const prefs = usePrefs();
  const feed = useMarketFeed();
  const [intro, setIntro] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<DashView>("trade");
  const [collapsed, setCollapsed] = useState(() => readBool("brink.sidebar.collapsed", false));
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (!selectedId && feed.ranked[0]) setSelectedId(feed.ranked[0].marketId);
  }, [feed.ranked, selectedId]);

  useEffect(() => {
    try {
      localStorage.setItem("brink.sidebar.collapsed", String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const selected = feed.ranked.find((m) => m.marketId === selectedId) ?? feed.ranked[0];

  function pick(v: DashView) {
    setView(v);
    setDrawer(false);
  }
  function openMarket(m: ScoredMarket) {
    setSelectedId(m.marketId);
    setView("trade");
    setDrawer(false);
    window.scrollTo(0, 0);
  }

  return (
    <div className="brink-dashboard min-h-screen bg-[#0c0f0d] text-bone-white">
      {intro && <BrinkLoader onComplete={() => setIntro(false)} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-white/[0.06] lg:block",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        <AppSidebar view={view} onView={pick} collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      </aside>

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

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[68px]" : "lg:pl-[240px]")}>
        <AppTopbar onOpenMenu={() => setDrawer(true)} source={feed.source} loading={feed.loading} onRefresh={() => void feed.refresh()} />

        <main
          className="mx-auto max-w-[1400px] px-3 py-4 sm:px-5 sm:py-6"
          style={{ zoom: prefs.compactDensity ? 0.92 : 1 } as unknown as CSSProperties}
        >
          {view === "trade" && (
            <RequireWallet title="the trade terminal">
              {feed.loading && feed.ranked.length === 0 ? (
                <TradeSkeleton />
              ) : selected ? (
                <TradeView
                  markets={feed.ranked}
                  selected={selected}
                  onSelect={(m) => setSelectedId(m.marketId)}
                  elapsed={feed.elapsed}
                />
              ) : (
                <FeedState source={feed.source} />
              )}
            </RequireWallet>
          )}
          {view === "markets" && (
            <RequireWallet title="Markets">
              {feed.ranked.length ? (
                <MarketsView markets={feed.ranked} elapsed={feed.elapsed} onOpen={openMarket} />
              ) : (
                <FeedState source={feed.source} />
              )}
            </RequireWallet>
          )}
          {view === "scanner" && (
            <RequireWallet title="the Scanner">
              {feed.ranked.length ? (
                <ScannerView markets={feed.ranked} elapsed={feed.elapsed} onOpen={openMarket} />
              ) : (
                <FeedState source={feed.source} />
              )}
            </RequireWallet>
          )}
          {view === "leaderboard" && (
            <RequireWallet title="the Leaderboard">
              <LeaderboardView />
            </RequireWallet>
          )}
          {view === "wallet" && <WalletView />}
          {view === "referrals" && (
            <RequireWallet title="Referrals">
              <ReferralsView />
            </RequireWallet>
          )}
          {view === "intelligence" && (
            <RequireWallet title="Brink AI">
              <BrinkAiView markets={feed.ranked} />
            </RequireWallet>
          )}
          {view === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

function FeedState({ source }: { source: "live" | "empty" | "offline" }) {
  const offline = source === "offline";
  const Icon = offline ? ServerCrash : WifiOff;
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <Icon className="h-6 w-6 text-muted-sage/50" />
        </span>
        <h2 className="mt-5 font-display text-[1.75rem] leading-none tracking-[-0.02em]">
          {offline ? "Feed unreachable" : "No live markets"}
        </h2>
        <p className="mt-3 text-[13px] text-muted-sage/60">
          {offline
            ? "The Brink API isn't responding. Start it with npm run dev:api, or set VITE_API_BASE_URL."
            : "The API is connected but no DreamDEX markets are live right now. New markets appear here automatically."}
        </p>
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

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "true";
  } catch {
    return fallback;
  }
}
