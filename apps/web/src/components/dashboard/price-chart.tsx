import { useMemo, useState } from "react";
import { Maximize2, Settings2 } from "lucide-react";
import type { ScoredMarket } from "@/lib/markets";
import { genCandles } from "./synth";
import { cn } from "@/lib/utils";

const TIMEFRAMES = ["5m", "15m", "1h", "4h"] as const;

/**
 * PriceChart — a compact candlestick view of a binary market's YES price (in
 * cents). Candles are drawn as SVG rects on a non-distorting percentage grid;
 * axis labels and the live price pill are crisp HTML overlays.
 */
export function PriceChart({ market }: { market: ScoredMarket }) {
  const [tf, setTf] = useState<(typeof TIMEFRAMES)[number]>("1h");
  const candles = useMemo(() => genCandles(market, tf), [market, tf]);

  const { lo, hi } = useMemo(() => {
    const highs = candles.map((c) => c.h);
    const lows = candles.map((c) => c.l);
    const rawHi = Math.max(...highs);
    const rawLo = Math.min(...lows);
    const pad = (rawHi - rawLo) * 0.12 + 1;
    return { hi: Math.min(100, rawHi + pad), lo: Math.max(0, rawLo - pad) };
  }, [candles]);

  const y = (price: number) => ((hi - price) / (hi - lo)) * 100;
  const last = candles[candles.length - 1].c;
  const slot = 100 / candles.length;
  const bodyW = slot * 0.6;
  const priceLabels = [hi, hi - (hi - lo) * 0.25, hi - (hi - lo) * 0.5, hi - (hi - lo) * 0.75, lo];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2">
        <div className="flex items-center gap-1 rounded-lg bg-white/[0.03] p-0.5">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTf(t)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                tf === t ? "bg-white/[0.08] text-bone-white" : "text-muted-sage/60 hover:text-bone-white"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="rounded-md p-1.5 text-muted-sage/50 hover:bg-white/[0.05] hover:text-bone-white" aria-label="Chart settings">
            <Settings2 className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-md p-1.5 text-muted-sage/50 hover:bg-white/[0.05] hover:text-bone-white" aria-label="Fullscreen">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative min-h-[240px] flex-1 pr-12">
        {/* grid */}
        <div className="absolute inset-0 pr-12">
          {[0, 25, 50, 75, 100].map((p) => (
            <div key={p} className="absolute left-0 right-0 border-t border-white/[0.04]" style={{ top: p + "%" }} />
          ))}
        </div>

        {/* candles */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full pr-12" style={{ paddingRight: 0 }}>
          {candles.map((c, i) => {
            const up = c.c >= c.o;
            const cx = i * slot + slot / 2;
            const bodyTop = y(Math.max(c.o, c.c));
            const bodyH = Math.max(0.4, Math.abs(y(c.o) - y(c.c)));
            const fill = up ? "var(--color-bone-white)" : "#3c463e";
            return (
              <g key={i}>
                <rect x={cx - 0.18} y={y(c.h)} width={0.36} height={Math.max(0.3, y(c.l) - y(c.h))} fill={fill} opacity={0.7} />
                <rect x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH} fill={fill} />
              </g>
            );
          })}
          {/* current price line */}
          <rect x={0} y={y(last)} width={100} height={0.28} fill="var(--color-highlighter-green)" opacity={0.9} />
        </svg>

        {/* price axis */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-12">
          {priceLabels.map((p, i) => (
            <span
              key={i}
              className="absolute right-1 -translate-y-1/2 text-[10px] tabular-nums text-muted-sage/45"
              style={{ top: y(p) + "%" }}
            >
              {Math.round(p)}¢
            </span>
          ))}
          <span
            className="absolute right-1 -translate-y-1/2 rounded bg-highlighter-green px-1 py-0.5 text-[10px] font-bold tabular-nums text-press-black"
            style={{ top: y(last) + "%" }}
          >
            {Math.round(last)}¢
          </span>
        </div>
      </div>

      {/* time axis */}
      <div className="flex justify-between border-t border-white/[0.06] px-3 py-1.5 text-[10px] tabular-nums text-muted-sage/40">
        {["06:00", "09:00", "12:00", "15:00", "18:00", "now"].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}
