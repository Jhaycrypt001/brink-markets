export type MarketStatus =
  | "Trading"
  | "Locked"
  | "Resolved"
  | "Finalized"
  | "Unknown";

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

// -------------------------------------------------------------------------
// Demo feed — used when the Shannon API is not reachable from the browser, so
// the dashboard always renders a full, believable board. Values mirror the real
// scored-market shape returned by GET /v1/markets.
// -------------------------------------------------------------------------
function demoMarket(
  id: string,
  asset: string,
  question: string,
  minutes: number,
  score: number,
  bestBid: number,
  bestAsk: number,
  volume: number,
  tradeCount: number,
  tradeable: boolean,
  reasons: string[]
): ScoredMarket {
  return {
    marketId: id,
    symbol: asset + "-USD-BIN",
    question,
    asset,
    intervalSec: 300,
    expiry: Date.now() / 1000 + minutes * 60,
    status: tradeable ? "Trading" : "Locked",
    volume,
    tradeCount,
    secondsLeft: minutes * 60,
    bestBid,
    bestAsk,
    spread: Math.round((bestAsk - bestBid) * 1000) / 1000,
    score,
    reasons,
    tradeable
  };
}

export const DEMO_MARKETS: ScoredMarket[] = [
  demoMarket("0xbtc-9h", "BTC", "BTC above $72,000 at close?", 41, 92.4, 0.58, 0.6, 184320, 1290, true, ["Ready to trade", "Fresh two-sided book"]),
  demoMarket("0xeth-4a", "ETH", "ETH above $3,850 at close?", 27, 88.1, 0.44, 0.47, 98120, 870, true, ["Ready to trade", "Tight spread"]),
  demoMarket("0xsol-2c", "SOL", "SOL above $185 in 30m?", 12, 81.7, 0.62, 0.66, 54200, 640, true, ["Ready to trade", "High recent volume"]),
  demoMarket("0xbtc-1f", "BTC", "BTC below $70,500 in 15m?", 8, 74.3, 0.39, 0.45, 41100, 410, true, ["Ready to trade", "Two-sided quote"]),
  demoMarket("0xeth-7d", "ETH", "ETH range-bound this hour?", 52, 69.0, 0.5, 0.55, 22800, 250, false, ["Spread widening", "Volume thinning"]),
  demoMarket("0xsol-3e", "SOL", "SOL above $190 at close?", 4, 58.2, 0.71, 0.79, 12400, 130, false, ["Too close to expiry"]),
  demoMarket("0xdoge-8b", "DOGE", "DOGE above $0.16 in 30m?", 23, 63.9, 0.33, 0.4, 8600, 90, false, ["Wide spread", "Thin book"]),
  demoMarket("0xbtc-5k", "BTC", "BTC above $73,500 at close?", 3, 41.5, 0.18, 0.29, 5200, 40, false, ["Not trading on-chain", "Too close to expiry"])
];

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
