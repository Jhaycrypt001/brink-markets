import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type SeriesMarker,
  type UTCTimestamp
} from "lightweight-charts";
import { Activity, CandlestickChart, Percent } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import type { ScoredMarket } from "@/lib/markets";
import { fetchOHLCV } from "@/lib/markets";
import { fetchMyFills, type Fill } from "@/lib/trade";
import { cn } from "@/lib/utils";

const TIMEFRAMES = ["5m", "15m", "1h", "4h"] as const;
type TF = (typeof TIMEFRAMES)[number];

const GREEN = "#2bee4b";
const RED = "#e08a8a";

type Mode = "price" | "odds";

/**
 * PriceChart — two honest views of one market:
 *  - "Price": the underlying asset (e.g. BTC) in real dollars, rendered by the
 *    embedded TradingView Advanced Chart (its own indicators/drawing/timeframes).
 *  - "Odds": THIS event contract's YES probability in cents, drawn from the API's
 *    real /v1/ohlcv (SDK fetchOHLCV) with TradingView Lightweight Charts.
 * The two are different numbers on purpose — one is the asset price, the other is
 * the market's implied probability — so each is labeled clearly.
 */
export function PriceChart({ market }: { market: ScoredMarket }) {
  const [mode, setMode] = useState<Mode>("price");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2">
        <div className="flex items-center gap-1 rounded-lg bg-white/[0.03] p-0.5">
          <ModeButton active={mode === "price"} onClick={() => setMode("price")} icon={<CandlestickChart className="h-3.5 w-3.5" />}>
            Price
          </ModeButton>
          <ModeButton active={mode === "odds"} onClick={() => setMode("odds")} icon={<Percent className="h-3.5 w-3.5" />}>
            Odds
          </ModeButton>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] text-muted-sage/45 sm:inline">
            {mode === "price" ? `${market.asset} · underlying (USD)` : "YES probability (¢)"}
          </span>
          <LiveTag />
        </div>
      </div>

      <div className="relative min-h-[300px] flex-1">
        {/* Both mount; only the active one is shown. Keeps each chart's internal
            state (TradingView toolbar, Lightweight zoom) intact across toggles. */}
        <div className={cn("absolute inset-0", mode === "price" ? "block" : "hidden")}>
          <TradingViewChart asset={market.asset} active={mode === "price"} />
        </div>
        <div className={cn("absolute inset-0", mode === "odds" ? "block" : "hidden")}>
          <OddsChart market={market} active={mode === "odds"} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Price — embedded TradingView Advanced Chart of the underlying asset */
/* ------------------------------------------------------------------ */

type TvWidgetCtor = new (config: Record<string, unknown>) => unknown;
interface TvGlobal {
  widget: TvWidgetCtor;
}
declare global {
  interface Window {
    TradingView?: TvGlobal;
  }
}

const TV_SCRIPT = "https://s3.tradingview.com/tv.js";
let tvScriptPromise: Promise<void> | null = null;

function loadTradingView(): Promise<void> {
  if (window.TradingView) return Promise.resolve();
  if (tvScriptPromise) return tvScriptPromise;
  tvScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TV_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("tv")));
      return;
    }
    const script = document.createElement("script");
    script.src = TV_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("tv"));
    document.head.appendChild(script);
  });
  return tvScriptPromise;
}

/**
 * Map a market asset ticker to a TradingView symbol. Majors resolve to their
 * deepest Binance spot pair; anything else falls back to a generic crypto index
 * symbol, and TradingView shows its own "invalid symbol" state if it can't map.
 */
function tvSymbol(asset: string): string {
  const a = asset.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const majors: Record<string, string> = {
    BTC: "BINANCE:BTCUSDT",
    ETH: "BINANCE:ETHUSDT",
    SOL: "BINANCE:SOLUSDT",
    BNB: "BINANCE:BNBUSDT",
    XRP: "BINANCE:XRPUSDT",
    DOGE: "BINANCE:DOGEUSDT",
    AVAX: "BINANCE:AVAXUSDT",
    LINK: "BINANCE:LINKUSDT",
    MATIC: "BINANCE:MATICUSDT",
    ARB: "BINANCE:ARBUSDT",
    OP: "BINANCE:OPUSDT",
    SUI: "BINANCE:SUIUSDT",
    SOMI: "CRYPTO:SOMIUSD"
  };
  return majors[a] ?? `CRYPTO:${a}USD`;
}

function TradingViewChart({ asset, active }: { asset: string; active: boolean }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`tv_${Math.random().toString(36).slice(2, 9)}`);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const symbol = tvSymbol(asset);

  useEffect(() => {
    // Defer building the widget until this view is first shown, so the hidden
    // pane never pays for the iframe.
    if (!active && state === "loading") return;
    let disposed = false;
    const holder = holderRef.current;
    if (!holder) return;

    setState("loading");
    holder.innerHTML = `<div id="${idRef.current}" style="height:100%;width:100%"></div>`;

    loadTradingView()
      .then(() => {
        if (disposed || !window.TradingView) return;
        const isDark = !document
          .querySelector(":root")
          ?.matches('[data-theme="light"]');
        // eslint-disable-next-line no-new
        new window.TradingView.widget({
          symbol,
          interval: "5",
          container_id: idRef.current,
          autosize: true,
          timezone: "Etc/UTC",
          theme: isDark ? "dark" : "light",
          style: "1",
          locale: "en",
          toolbar_bg: "rgba(0,0,0,0)",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          allow_symbol_change: true,
          save_image: false,
          studies: [],
          backgroundColor: "rgba(0,0,0,0)",
          gridColor: "rgba(255,255,255,0.04)"
        });
        setState("ready");
      })
      .catch(() => {
        if (!disposed) setState("error");
      });

    return () => {
      disposed = true;
      if (holder) holder.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, active]);

  return (
    <div className="relative h-full w-full">
      <div ref={holderRef} className="h-full w-full" />
      {state !== "ready" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
          <Activity className="h-6 w-6 text-muted-sage/40" />
          <p className="text-[13px] text-muted-sage/55">
            {state === "loading" ? "Loading TradingView…" : "Live price chart is unavailable offline."}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Odds — this contract's YES probability from real /v1/ohlcv          */
/* ------------------------------------------------------------------ */

function OddsChart({ market, active }: { market: ScoredMarket; active: boolean }) {
  const [tf, setTf] = useState<TF>("1h");
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const priceLineRef = useRef<IPriceLine | null>(null);
  const entryLineRef = useRef<IPriceLine | null>(null);

  // This wallet's own fills on THIS market, drawn as buy/sell markers.
  const account = useActiveAccount();
  const [fills, setFills] = useState<Fill[]>([]);

  const yes = market.bestAsk ?? 0.5;

  useEffect(() => {
    if (!account) {
      setFills([]);
      return;
    }
    let cancelled = false;
    const run = () =>
      fetchMyFills(account)
        .then((all) => {
          if (!cancelled) setFills(all.filter((f) => f.symbol === market.symbol));
        })
        .catch(() => undefined);
    void run();
    const id = window.setInterval(run, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [account, market.symbol]);

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
    series.priceScale().applyOptions({ scaleMargins: { top: 0.06, bottom: 0.24 } });

    const volume = chart.addHistogramSeries({
      priceScaleId: "vol",
      priceFormat: { type: "volume" },
      lastValueVisible: false,
      priceLineVisible: false
    });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chartRef.current = chart;
    seriesRef.current = series;
    volumeRef.current = volume;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeRef.current = null;
      priceLineRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const candles = await fetchOHLCV(market.symbol, tf, 200);
        if (cancelled || !seriesRef.current) return;
        if (candles.length === 0) {
          seriesRef.current.setData([]);
          volumeRef.current?.setData([]);
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
        volumeRef.current?.setData(
          candles.map((c) => ({
            time: Math.floor(c[0] / 1000) as UTCTimestamp,
            value: c[5],
            color: c[4] >= c[1] ? "rgba(43,238,75,0.35)" : "rgba(224,138,138,0.35)"
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

  // Draw the wallet's fills as markers (buy = green ▲ below, sell = red ▼ above)
  // plus a dashed average-entry line — so the chart shows where you traded.
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || state !== "ready") return;

    const markers: SeriesMarker<UTCTimestamp>[] = [...fills]
      .filter((f) => f.timestamp)
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
      .map((f) => ({
        time: Math.floor((f.timestamp ?? Date.now()) / 1000) as UTCTimestamp,
        position: f.side === "buy" ? "belowBar" : "aboveBar",
        color: f.side === "buy" ? GREEN : RED,
        shape: f.side === "buy" ? "arrowUp" : "arrowDown",
        text: `${f.side === "buy" ? "Buy" : "Sell"} ${f.amount} @ ${Math.round(f.price * 100)}¢`
      }));
    series.setMarkers(markers);

    const buys = fills.filter((f) => f.side === "buy");
    const qty = buys.reduce((s, f) => s + f.amount, 0);
    const avg = qty > 0 ? buys.reduce((s, f) => s + f.price * f.amount, 0) / qty : null;
    if (entryLineRef.current) {
      series.removePriceLine(entryLineRef.current);
      entryLineRef.current = null;
    }
    if (avg !== null) {
      entryLineRef.current = series.createPriceLine({
        price: avg,
        color: "rgba(43,238,75,0.55)",
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: true,
        title: "avg"
      });
    }
  }, [fills, state]);

  // Lightweight Charts measures on mount; if it mounted while hidden it reads 0
  // width, so nudge a resize the first time this view becomes active.
  useEffect(() => {
    if (active) chartRef.current?.timeScale().fitContent();
  }, [active]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 px-3 py-2">
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
      </div>
      <div className="relative flex-1">
        <div ref={containerRef} className="absolute inset-0" />
        {state !== "ready" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <Activity className="h-6 w-6 text-muted-sage/40" />
            <p className="text-[13px] text-muted-sage/55">
              {state === "loading"
                ? "Loading odds…"
                : state === "empty"
                  ? "No trade history for this market yet."
                  : "Odds data is unavailable."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  children
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
        active ? "bg-white/[0.08] text-bone-white" : "text-muted-sage/60 hover:text-bone-white"
      )}
    >
      {icon}
      {children}
    </button>
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
