import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, Search, Bell, Wifi, WifiOff, RefreshCw, Wallet, Check, Trash2, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, shortAddress } from "@/components/dashboard/wallet";
import { useNotifications } from "@/components/dashboard/notifications";
import { useProfile, ProfileAvatar } from "@/components/dashboard/profile";
import { GlassButton } from "@/components/ui/glass-button";
import type { ScoredMarket } from "@/lib/markets";
import { cn } from "@/lib/utils";

export function AppTopbar({
  onOpenMenu,
  source,
  loading,
  onRefresh,
  markets = [],
  onSelectMarket
}: {
  onOpenMenu: () => void;
  source: "live" | "empty" | "offline";
  loading: boolean;
  onRefresh: () => void;
  markets?: ScoredMarket[];
  onSelectMarket?: (m: ScoredMarket) => void;
}) {
  const isLive = source === "live";
  const label = source === "live" ? "Live" : source === "empty" ? "No feed" : "Offline";
  const wallet = useWallet();
  const { displayName } = useProfile();
  const initials = wallet.address ? wallet.address.slice(2, 4).toUpperCase() : "··";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-press-black/90 px-3 backdrop-blur-md sm:px-5">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-lg p-2 text-muted-sage/70 hover:bg-white/[0.05] hover:text-bone-white lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <MarketSearch markets={markets} onSelectMarket={onSelectMarket} />
      {/* On phones the search is hidden; keep the actions pinned right. */}
      <div className="flex-1 sm:hidden" />

      <div className="ml-auto flex items-center gap-2">
        <span
          className={cn(
            "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider sm:inline-flex",
            isLive ? "bg-highlighter-green/12 text-highlighter-green" : "bg-white/[0.05] text-muted-sage/70"
          )}
        >
          {isLive ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {label}
        </span>

        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2 text-muted-sage/70 hover:text-bone-white"
          aria-label="Refresh"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>

        {/* Notifications are a per-wallet feature — no wallet, no bell. */}
        {wallet.ready && <NotificationBell />}

        {wallet.ready ? (
          <button
            type="button"
            onClick={wallet.open}
            className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] py-1.5 pl-2.5 pr-1.5 hover:bg-white/[0.06]"
          >
            <span className="hidden text-[12px] font-semibold tabular-nums text-bone-white sm:inline">
              {displayName || shortAddress(wallet.address ?? "")}
            </span>
            <ProfileAvatar
              fallback={initials}
              className="h-7 w-7 rounded-full bg-gradient-to-br from-highlighter-green to-[#12a52c] text-[11px] font-bold text-press-black"
            />
          </button>
        ) : (
          <GlassButton tone="green" size="sm" onClick={wallet.open} contentClassName="px-4 py-2.5">
            <Wallet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Connect wallet</span>
          </GlassButton>
        )}
      </div>
    </header>
  );
}

/**
 * MarketSearch — a live filter over the ranked feed. Typing matches on asset,
 * question or symbol; picking a result opens that market in the trade view.
 * Hidden on phones (the market header's dropdown covers switching there).
 */
function MarketSearch({ markets, onSelectMarket }: { markets: ScoredMarket[]; onSelectMarket?: (m: ScoredMarket) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return markets
      .filter(
        (m) =>
          m.asset.toLowerCase().includes(term) ||
          m.question.toLowerCase().includes(term) ||
          m.symbol.toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [q, markets]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(m: ScoredMarket) {
    onSelectMarket?.(m);
    setQ("");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative hidden min-w-0 max-w-md flex-1 sm:block">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-sage/40" />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) pick(results[0]);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search markets, assets…"
          className="h-10 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] pl-9 pr-3 text-[13px] text-bone-white placeholder:text-muted-sage/40 focus:border-white/[0.12] focus:outline-none"
        />
      </div>
      {open && q.trim() && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#121613] shadow-2xl">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-[12px] text-muted-sage/50">No markets match “{q.trim()}”.</p>
          ) : (
            <div className="max-h-[360px] overflow-y-auto py-1">
              {results.map((m) => (
                <button
                  key={m.marketId}
                  type="button"
                  onClick={() => pick(m)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-white/[0.04]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[10px] font-bold text-bone-white">
                    {m.asset.slice(0, 3)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium text-bone-white">{m.question}</span>
                    <span className="block text-[10px] text-muted-sage/50">
                      {m.asset} · {Math.round((m.bestAsk ?? 0.5) * 100)}¢ YES
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-semibold tabular-nums text-highlighter-green">{m.score.toFixed(1)}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-sage/40" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationBell() {
  const { notices, unread, markAllRead, clear } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function toggle() {
    setOpen((o) => {
      if (!o && unread > 0) markAllRead();
      return !o;
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="relative rounded-lg border border-white/[0.06] bg-white/[0.03] p-2 text-muted-sage/70 hover:text-bone-white"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-highlighter-green px-1 text-[9px] font-bold text-press-black">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-11 z-50 w-[min(320px,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-white/[0.08] bg-[#121613] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
              <span className="text-[13px] font-semibold text-bone-white">Notifications</span>
              {notices.length > 0 && (
                <button onClick={clear} className="inline-flex items-center gap-1 text-[11px] text-muted-sage/60 hover:text-bone-white">
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {notices.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Check className="h-5 w-5 text-muted-sage/40" />
                  <p className="text-[12px] text-muted-sage/50">You're all caught up.</p>
                  <p className="text-[11px] text-muted-sage/35">Alerts appear here as markets turn tradeable or near expiry.</p>
                </div>
              ) : (
                notices.map((n) => (
                  <div key={n.id} className="flex gap-3 border-b border-white/[0.04] px-4 py-3 last:border-0">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-highlighter-green" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-bone-white">{n.title}</p>
                      <p className="truncate text-[12px] text-muted-sage/70">{n.body}</p>
                      <p className="mt-0.5 text-[10px] text-muted-sage/40">{timeAgo(n.ts)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + "s ago";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  return h + "h ago";
}
