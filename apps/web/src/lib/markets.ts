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
