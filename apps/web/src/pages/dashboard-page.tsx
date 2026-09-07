import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Activity, Wifi, WifiOff, TrendingUp } from "lucide-react";
import {
  fetchMarkets,
  DEMO_MARKETS,
  formatDuration,
  formatPrice,
  formatCompact,
  type ScoredMarket
} from "@/lib/markets";
import { BrinkMark } from "@/components/ui/brink-mark";
import { TiltCard } from "@/components/ui/tilt-card";
import { GlassToggle } from "@/components/ui/glass-toggle";
import { BrinkLoader } from "@/components/dashboard/brink-loader";

type Filter = "all" | "tradeable" | "top";
const GLASS =
  "rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_48px_-28px_rgba(0,0,0,0.85)]";

export function DashboardPage() {
  const [intro, setIntro] = useState(true);
  const [markets, setMarkets] = useState<ScoredMarket[]>([]);
  const [source, setSource] = useState<"live" | "demo">("demo");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [elapsed, setElapsed] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const live = await fetchMarkets(24);
      if (live.length > 0) {
        setMarkets(live);
        setSource("live");
      } else {
        setMarkets(DEMO_MARKETS);
        setSource("demo");
      }
    } catch {
      setMarkets(DEMO_MARKETS);
      setSource("demo");
    } finally {
      setElapsed(0);
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  // Shared clock so every countdown ticks together.
  useEffect(() => {
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const ranked = useMemo(
    () => [...markets].sort((a, b) => b.score - a.score),
    [markets]
  );

  const visible = useMemo(() => {
    if (filter === "tradeable") return ranked.filter((m) => m.tradeable);
    if (filter === "top") return ranked.filter((m) => m.score >= 80);
    return ranked;
  }, [ranked, filter]);

  const kpis = useMemo(() => {
    const tradeable = ranked.filter((m) => m.tradeable).length;
    const spreads = ranked
      .map((m) => m.spread)
      .filter((s): s is number => s !== undefined)
      .sort((a, b) => a - b);
    const median = spreads.length
      ? spreads[Math.floor(spreads.length / 2)]
      : undefined;
    const topScore = ranked.length ? ranked[0].score : 0;
    return { total: ranked.length, tradeable, median, topScore };
  }, [ranked]);

  return (
    <div className="min-h-screen bg-press-black text-bone-white">
      {intro && <BrinkLoader onComplete={() => setIntro(false)} />}

      {/* Ambient green glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 80% -10%, rgba(43,238,75,0.14), transparent 70%), radial-gradient(50% 40% at 0% 110%, rgba(16,94,29,0.18), transparent 70%)"
        }}
      />

      <div className="relative mx-auto max-w-[1400px] px-5 py-6 sm:px-8">
        <TopBar source={source} loading={loading} onRefresh={() => void load()} />

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-highlighter-green">
              Live feed
            </p>
            <h1 className="mt-2 font-display text-[clamp(2.5rem,5vw,4rem)] leading-[0.95] tracking-[-0.03em]">
              Market cockpit
            </h1>
          </div>
          <GlassToggle<Filter>
            options={[
              { value: "all", label: "All" },
              { value: "tradeable", label: "Tradeable" },
              { value: "top", label: "Top" }
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>

        {/* KPI row */}
        <div
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          style={{ perspective: "1200px" }}
        >
          <KpiTile label="Markets tracked" value={String(kpis.total)} hint="Live binary contracts" />
          <KpiTile
            label="Tradeable now"
            value={String(kpis.tradeable)}
            hint="Clear every safety gate"
            accent
          />
          <KpiTile
            label="Median spread"
            value={kpis.median === undefined ? "—" : Math.round(kpis.median * 100) + " pts"}
            hint="Across the board"
          />
          <KpiTile label="Top score" value={kpis.topScore.toFixed(1)} hint="Best-ranked market" />
        </div>

        {/* Market grid */}
        <div
          className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          style={{ perspective: "1400px" }}
        >
          {loading &&
            [0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`${GLASS} h-56 animate-pulse`} />
            ))}

          {!loading &&
            visible.map((market, index) => (
              <MarketTile key={market.marketId} market={market} elapsed={elapsed} index={index} />
            ))}

          {!loading && visible.length === 0 && (
            <div className={`${GLASS} p-8 md:col-span-2 xl:col-span-3`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-sage/70">
                Nothing here
              </p>
              <p className="mt-3 font-display text-[2rem] leading-tight tracking-[-0.02em]">
                No market matches this filter right now.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TopBar({
  source,
  loading,
  onRefresh
}: {
  source: "live" | "demo";
  loading: boolean;
  onRefresh: () => void;
}) {
  const isLive = source === "live";
  return (
    <div className={`${GLASS} flex items-center justify-between gap-4 px-4 py-3 sm:px-5`}>
      <div className="flex items-center gap-3">
        <BrinkMark className="h-6 w-6 text-bone-white" />
        <span className="font-display text-[1.35rem] leading-none tracking-[-0.04em]">Brink</span>
        <span
          className={`ml-2 hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.11px] sm:inline-flex ${
            isLive ? "bg-highlighter-green/15 text-highlighter-green" : "bg-white/10 text-muted-sage"
          }`}
        >
          {isLive ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isLive ? "Live" : "Demo feed"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.11px] text-muted-sage transition hover:text-bone-white"
        >
          <RefreshCw className={"h-3.5 w-3.5 " + (loading ? "animate-spin" : "")} aria-hidden="true" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.11px] text-muted-sage transition hover:text-bone-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Exit</span>
        </Link>
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  hint,
  accent
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <TiltCard className={`${GLASS} p-5`} intensity={8}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16px] text-muted-sage/70">
          {label}
        </span>
        <Activity
          className={"h-4 w-4 " + (accent ? "text-highlighter-green" : "text-muted-sage/50")}
          aria-hidden="true"
        />
      </div>
      <p
        className={
          "mt-4 font-display text-[3rem] leading-none tracking-[-0.04em] " +
          (accent ? "text-highlighter-green" : "text-bone-white")
        }
      >
        {value}
      </p>
      <p className="mt-2 text-[13px] text-muted-sage/60">{hint}</p>
    </TiltCard>
  );
}

function MarketTile({
  market,
  elapsed,
  index
}: {
  market: ScoredMarket;
  elapsed: number;
  index: number;
}) {
  const secondsLeft = Math.max(0, market.secondsLeft - elapsed);
  const spreadPts = market.spread === undefined ? undefined : Math.round(market.spread * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <TiltCard className={`${GLASS} overflow-hidden p-5`}>
        <Sparkline seed={market.marketId} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-[11px] font-bold text-bone-white">
              {market.asset.slice(0, 3)}
            </span>
            <div>
              <p className="text-[13px] font-semibold text-bone-white">{market.asset}</p>
              <StatusDot tradeable={market.tradeable} status={market.status} />
            </div>
          </div>
          <ScoreRing score={market.score} />
        </div>

        <h3 className="relative mt-4 text-[15px] font-medium leading-snug text-bone-white [text-wrap:balance]">
          {market.question}
        </h3>

        <div className="relative mt-5 grid grid-cols-3 gap-3">
          <Metric label="Best ask" value={formatPrice(market.bestAsk)} />
          <Metric label="Spread" value={spreadPts === undefined ? "—" : spreadPts + " pts"} />
          <Metric label="Time left" value={formatDuration(secondsLeft)} live={secondsLeft > 0} />
        </div>

        <SpreadBar pts={spreadPts} />

        <div className="relative mt-4 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="truncate text-[12px] text-muted-sage/70">
            {market.reasons[0] ?? "—"}
          </span>
          <span className="flex items-center gap-1 text-[12px] text-muted-sage/60">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            {formatCompact(market.volume)}
          </span>
        </div>
      </TiltCard>
    </motion.div>
  );
}

function Metric({ label, value, live }: { label: string; value: string; live?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12px] text-muted-sage/60">
        {label}
      </p>
      <p
        className={
          "mt-1 font-display text-[1.5rem] leading-none tracking-[-0.02em] " +
          (live ? "text-bone-white" : "text-bone-white/90")
        }
      >
        {value}
      </p>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 48 48" className="h-14 w-14 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="var(--color-highlighter-green)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-bone-white">
        {Math.round(score)}
      </span>
    </div>
  );
}

function SpreadBar({ pts }: { pts?: number }) {
  const width = pts === undefined ? 0 : Math.max(4, Math.min(100, 100 - pts * 4));
  return (
    <div className="relative mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-highlighter-green/80"
        style={{ width: width + "%" }}
      />
    </div>
  );
}

function StatusDot({ tradeable, status }: { tradeable: boolean; status: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-muted-sage/70">
      <span
        className={
          "h-1.5 w-1.5 rounded-full " +
          (tradeable ? "bg-highlighter-green shadow-[0_0_8px_rgba(43,238,75,0.8)]" : "bg-newsprint-gray")
        }
      />
      {tradeable ? "Tradeable" : status}
    </span>
  );
}

/** Deterministic decorative sparkline generated from the market id. */
function Sparkline({ seed }: { seed: string }) {
  const points = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
    const values = Array.from({ length: 16 }, (_, i) => {
      h = (h * 41 + 7) % 997;
      return 20 + (h % 60) + Math.sin(i / 2) * 8;
    });
    return values
      .map((v, i) => `${(i / 15) * 100},${100 - v}`)
      .join(" ");
  }, [seed]);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full opacity-[0.16]"
      aria-hidden="true"
    >
      <polyline points={points} fill="none" stroke="var(--color-highlighter-green)" strokeWidth="1.5" />
    </svg>
  );
}
