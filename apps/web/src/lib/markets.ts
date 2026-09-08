export type MarketStatus =
  | "Trading"
  | "Locked"
  | "Resolved"
  | "Finalized"
  | "Unknown";

export type OrderBook = {
  bids: Array<[price: number, size: number]>;
  asks: Array<[price: number, size: number]>;
  observedAt: number;
};

export type ScoredMarket = {
  marketId: string;
  symbol: string;
  question: string;
  asset: string;
  intervalSec: number;
  expiry: number;
  status: MarketStatus;
  volume: number;
  tradeCount: number;
  secondsLeft: number;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  score: number;
  reasons: string[];
  tradeable: boolean;
  orderBook?: OrderBook;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787";

export async function fetchLiveMarkets(): Promise<ScoredMarket[]> {
  const response = await fetch(
    apiBaseUrl + "/v1/markets?tradeableOnly=true&limit=3",
    { headers: { accept: "application/json" } }
  );

  if (!response.ok) {
    throw new Error("MARKET_SOURCE_UNAVAILABLE");
  }

  const payload: { data?: ScoredMarket[] } = await response.json();
  return payload.data ?? [];
}

export async function fetchMarkets(limit = 24): Promise<ScoredMarket[]> {
  const response = await fetch(apiBaseUrl + "/v1/markets?limit=" + limit, {
    headers: { accept: "application/json" }
  });
  if (!response.ok) throw new Error("MARKET_SOURCE_UNAVAILABLE");
  const payload: { data?: ScoredMarket[] } = await response.json();
  return payload.data ?? [];
}

/** OHLCV candle: [openTimeMs, open, high, low, close, volume]. */
export type Candle = [number, number, number, number, number, number];

export async function fetchOHLCV(
  symbol: string,
  timeframe = "1h",
  limit = 200
): Promise<Candle[]> {
  const url =
    apiBaseUrl +
    "/v1/ohlcv?symbol=" +
    encodeURIComponent(symbol) +
    "&tf=" +
    encodeURIComponent(timeframe) +
    "&limit=" +
    limit;
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error("MARKET_SOURCE_UNAVAILABLE");
  const payload: { data?: Candle[] } = await response.json();
  return payload.data ?? [];
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return s + "s";
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m + "m " + String(rem).padStart(2, "0") + "s";
}

export function formatPrice(price: number | undefined): string {
  return price === undefined ? "—" : Math.round(price * 100) + "¢";
}

export function formatSpread(spread: number | undefined): string {
  return spread === undefined ? "—" : Math.round(spread * 100) + " pts";
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "k";
  return String(Math.round(value));
}
