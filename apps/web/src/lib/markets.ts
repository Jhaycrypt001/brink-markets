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

/* ----------------------------- Leaderboard ----------------------------- */

export type LeaderEntry = {
  address: string;
  volume: number;
  fills: number;
  markets: number;
  lastActive: number;
};

export async function fetchLeaderboard(limit = 50): Promise<LeaderEntry[]> {
  const response = await fetch(apiBaseUrl + "/v1/leaderboard?limit=" + limit, {
    headers: { accept: "application/json" }
  });
  if (!response.ok) throw new Error("LEADERBOARD_UNAVAILABLE");
  const payload: { data?: LeaderEntry[] } = await response.json();
  return payload.data ?? [];
}

/* ------------------------------ Referrals ------------------------------ */

export type ReferralStats = {
  address: string;
  code: string;
  referred: number;
  referredBy: string | null;
  joinedAt: number;
};

export async function fetchReferralStats(address: string): Promise<ReferralStats> {
  const response = await fetch(apiBaseUrl + "/v1/referrals/" + address, {
    headers: { accept: "application/json" }
  });
  if (!response.ok) throw new Error("REFERRALS_UNAVAILABLE");
  const payload: { data: ReferralStats } = await response.json();
  return payload.data;
}

export type ClaimResult = { ok: boolean; referrer: string | null; reason?: string };

export async function claimReferral(address: string, code: string): Promise<ClaimResult> {
  const response = await fetch(apiBaseUrl + "/v1/referrals/claim", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ address, code })
  });
  if (!response.ok) throw new Error("CLAIM_FAILED");
  const payload: { data: ClaimResult } = await response.json();
  return payload.data;
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
