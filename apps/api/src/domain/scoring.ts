import type { BinaryMarket, ScoredMarket } from "./market.js";

export type ScoringOptions = {
  now?: number;
  minimumSecondsLeft?: number;
  maximumBookAgeMs?: number;
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function finite(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value);
}

export function scoreMarket(
  market: BinaryMarket,
  { now = Date.now(), minimumSecondsLeft = 300, maximumBookAgeMs = 15_000 }: ScoringOptions = {}
): ScoredMarket {
  const secondsLeft = market.expiry - now / 1_000;
  const book = market.orderBook;
  const bestBid = book?.bids[0]?.[0];
  const bestAsk = book?.asks[0]?.[0];
  const validBook = book !== undefined
    && finite(book.observedAt)
    && book.bids.every(([price, size]) => Number.isFinite(price) && price >= 0 && price <= 1 && Number.isFinite(size) && size > 0)
    && book.asks.every(([price, size]) => Number.isFinite(price) && price >= 0 && price <= 1 && Number.isFinite(size) && size > 0);
  const spread = finite(bestBid) && finite(bestAsk) && bestAsk >= bestBid ? bestAsk - bestBid : undefined;
  const bookFresh = validBook && now >= book.observedAt && now - book.observedAt <= maximumBookAgeMs;
  const reasons: string[] = [];
  let score = 0;

  if (market.status !== "Trading") reasons.push("Market is not trading on-chain");
  else score += 35;

  if (secondsLeft < minimumSecondsLeft) reasons.push("Too close to expiry");
  else score += 20;

  if (!book) reasons.push("No order book available");
  else if (!validBook) reasons.push("Order book contains invalid levels");
  else if (!bookFresh) reasons.push("Order book is stale");
  else score += 15;

  if (spread === undefined) reasons.push("No two-sided quote");
  else score += clamp(15 - spread * 100, 0, 15);

  score += clamp(Math.log10(Math.max(market.volume, 1)) * 3, 0, 10);
  score += clamp(Math.log10(Math.max(market.tradeCount, 1)) * 2, 0, 5);

  const tradeable = market.status === "Trading" && secondsLeft >= minimumSecondsLeft && bookFresh && bestAsk !== undefined;
  if (tradeable) reasons.unshift("Ready to trade");

  return {
    ...market,
    secondsLeft,
    bestBid,
    bestAsk,
    spread,
    score: Math.round(clamp(score) * 10) / 10,
    reasons,
    tradeable
  };
}

export function scoreMarkets(markets: BinaryMarket[], options?: ScoringOptions): ScoredMarket[] {
  return markets.map((market) => scoreMarket(market, options)).sort((a, b) => b.score - a.score);
}
