export type MarketStatus = "Trading" | "Locked" | "Resolved" | "Finalized" | "Unknown";

export type OrderBook = {
  bids: Array<[price: number, size: number]>;
  asks: Array<[price: number, size: number]>;
  observedAt: number;
};

export type BinaryMarket = {
  marketId: string;
  symbol: string;
  question: string;
  asset: string;
  intervalSec: number;
  expiry: number;
  status: MarketStatus;
  volume: number;
  tradeCount: number;
  orderBook?: OrderBook;
};

export type ScoredMarket = BinaryMarket & {
  secondsLeft: number;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  score: number;
  reasons: string[];
  tradeable: boolean;
};
