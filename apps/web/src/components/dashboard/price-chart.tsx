import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type UTCTimestamp
} from "lightweight-charts";
import { Activity } from "lucide-react";
import type { ScoredMarket } from "@/lib/markets";
import { fetchOHLCV } from "@/lib/markets";
import { cn } from "@/lib/utils";

const TIMEFRAMES = ["5m", "15m", "1h", "4h"] as const;
type TF = (typeof TIMEFRAMES)[number];

const GREEN = "#2bee4b";
const RED = "#e08a8a";

/**
 * PriceChart — real candlesticks via TradingView Lightweight Charts, fed by the
 * API's /v1/ohlcv (SDK fetchOHLCV). Values are the outcome's YES price in human
 * units (0..1), formatted as cents on the axis. A green price line tracks the
 * live best-ask, and the newest candle's close is nudged to it between refreshes.
 */
export function PriceChart({ market }: { market: ScoredMarket }) {
  const [tf, setTf] = useState<TF>("1h");
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLineRef = useRef<IPriceLine | null>(null);

  const yes = market.bestAsk ?? 0.5;

  // Create the chart once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(200,210,200,0.5)",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" }
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
      timeScale: { borderColor: "rgba(255,255,255,0.06)", timeVisible: true, secondsVisible: false },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(255,255,255,0.2)", labelBackgroundColor: "#232924" },
        horzLine: { color: "rgba(255,255,255,0.2)", labelBackgroundColor: "#232924" }
      },
      autoSize: true,
      handleScale: { axisPressedMouseMove: true },
      localization: {
        priceFormatter: (p: number) => Math.round(p * 100) + "¢"
      }
    });

    const series = chart.addCandlestickSeries({
      upColor: GREEN,
      downColor: RED,
      borderVisible: false,
      wickUpColor: GREEN,
      wickDownColor: RED,
      priceFormat: { type: "custom", formatter: (p: number) => Math.round(p * 100) + "¢", minMove: 0.01 }
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      priceLineRef.current = null;
    };
  }, []);

  // Load candles when the market or timeframe changes, then poll for updates.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const candles = await fetchOHLCV(market.symbol, tf, 200);
        if (cancelled || !seriesRef.current) return;
        if (candles.length === 0) {
          seriesRef.current.setData([]);
          setState("empty");
          return;
        }
        seriesRef.current.setData(
          candles.map((c) => ({
            time: Math.floor(c[0] / 1000) as UTCTimestamp,
            open: c[1],
            high: c[2],
            low: c[3],
            close: c[4]
          }))
        );
        chartRef.current?.timeScale().fitContent();
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    setState((s) => (s === "ready" ? s : "loading"));
    void load();
    const id = window.setInterval(load, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [market.symbol, tf]);

  // Keep a live price line at the current best-ask, and nudge the last candle.
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || state !== "ready") return;
    if (priceLineRef.current) series.removePriceLine(priceLineRef.current);
    priceLineRef.current = series.createPriceLine({
      price: yes,
      color: GREEN,
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "live"
    });
  }, [yes, state]);

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
        <LiveTag />
      </div>

      <div className="relative min-h-[260px] flex-1">
        <div ref={containerRef} className="absolute inset-0" />
        {state !== "ready" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <Activity className="h-6 w-6 text-muted-sage/40" />
            <p className="text-[13px] text-muted-sage/55">
              {state === "loading"
                ? "Loading candles…"
                : state === "empty"
                  ? "No trade history for this market yet."
                  : "Chart data is unavailable."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LiveTag() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-highlighter-green/12 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-highlighter-green">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-highlighter-green opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-highlighter-green" />
      </span>
      Live
    </span>
  );
}
