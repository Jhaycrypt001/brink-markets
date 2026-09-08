import { useMemo } from "react";
import { Activity } from "lucide-react";
import type { ScoredMarket } from "@/lib/markets";
import type { PricePoint } from "./use-market-feed";

/**
 * PriceChart — the live YES-price line for a market, drawn from real observed
 * quotes accumulated by the feed. No synthetic history: until at least two ticks
 * have arrived it shows a "building" state, then renders the real series with a
 * pulsing live point and a price axis in cents.
 */
export function PriceChart({ market, history }: { market: ScoredMarket; history: PricePoint[] }) {
  const yesPrice = Math.round((market.bestAsk ?? 0.5) * 100);

  const view = useMemo(() => {
    if (history.length < 2) return null;
    const prices = history.map((h) => h.p);
    const rawHi = Math.max(...prices);
    const rawLo = Math.min(...prices);
    const pad = Math.max(2, (rawHi - rawLo) * 0.25);
    const hi = Math.min(100, rawHi + pad);
    const lo = Math.max(0, rawLo - pad);
    const span = Math.max(1, hi - lo);
    const n = history.length;
    const pts = history.map((h, i) => {
      const x = (i / (n - 1)) * 100;
      const y = ((hi - h.p) / span) * 100;
      return { x, y };
    });
    const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
    const area = `0,100 ${line} 100,100`;
    const last = pts[pts.length - 1];
    const first = history[0].p;
    const changePct = first === 0 ? 0 : Math.round(((history[n - 1].p - first) / first) * 1000) / 10;
    return { line, area, last, hi, lo, changePct };
  }, [history]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-highlighter-green/12 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-highlighter-green">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-highlighter-green opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-highlighter-green" />
          </span>
          Live
        </span>
        {view && (
          <span className={"text-[12px] font-semibold tabular-nums " + (view.changePct >= 0 ? "text-highlighter-green" : "text-[#e08a8a]")}>
            {view.changePct >= 0 ? "+" : ""}{view.changePct}% session
          </span>
        )}
      </div>

      <div className="relative min-h-[240px] flex-1 pr-12">
        {!view ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-center">
            <Activity className="h-6 w-6 text-muted-sage/40" />
            <p className="text-[13px] text-muted-sage/55">Building the live chart from the feed…</p>
            <p className="text-[11px] text-muted-sage/35">Quotes plot here as they stream in.</p>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 pr-12">
              {[0, 25, 50, 75, 100].map((p) => (
                <div key={p} className="absolute left-0 right-0 border-t border-white/[0.04]" style={{ top: p + "%" }} />
              ))}
            </div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full pr-12">
              <defs>
                <linearGradient id="pc-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-highlighter-green)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--color-highlighter-green)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={view.area} fill="url(#pc-fill)" />
              <polyline points={view.line} fill="none" stroke="var(--color-highlighter-green)" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="pointer-events-none absolute right-0 top-0 h-full w-12">
              {[view.hi, (view.hi + view.lo) / 2, view.lo].map((p, i) => (
                <span key={i} className="absolute right-1 -translate-y-1/2 text-[10px] tabular-nums text-muted-sage/45" style={{ top: (i === 0 ? 2 : i === 1 ? 50 : 98) + "%" }}>
                  {Math.round(p)}¢
                </span>
              ))}
              <span className="absolute right-1 -translate-y-1/2 rounded bg-highlighter-green px-1 py-0.5 text-[10px] font-bold tabular-nums text-press-black" style={{ top: view.last.y + "%" }}>
                {yesPrice}¢
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
