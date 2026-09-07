import type { ScoredMarket } from "@/lib/markets";

/**
 * Deterministic synthetic series for the terminal. Binary event contracts don't
 * ship price history or a full book to the browser, so we generate a stable,
 * believable candle series and order-book ladder seeded from the market id. Real
 * `orderBook` data is preferred when the API provides it.
 */

function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Candle = { o: number; h: number; l: number; c: number };

/** YES-price candles in cents (1..99), seeded per market + timeframe. */
export function genCandles(market: ScoredMarket, timeframe: string, count = 48): Candle[] {
  const rng = mulberry32(hashSeed(market.marketId + timeframe));
  const target = Math.round((market.bestAsk ?? 0.5) * 100);
  let price = Math.max(6, Math.min(94, target - 14 + rng() * 10));
  const candles: Candle[] = [];
  for (let i = 0; i < count; i++) {
    const drift = (target - price) * 0.06;
    const o = price;
    const c = Math.max(3, Math.min(97, o + drift + (rng() - 0.5) * 6));
    const h = Math.max(o, c) + rng() * 3;
    const l = Math.min(o, c) - rng() * 3;
    candles.push({ o, h: Math.min(99, h), l: Math.max(1, l), c });
    price = c;
  }
  // Land the last close on the current YES price.
  candles[candles.length - 1].c = target;
  return candles;
}

export type Level = { price: number; size: number };
export type Book = { asks: Level[]; bids: Level[] };

/** Order-book ladder in cents, seeded per market from the best bid/ask. */
export function genBook(market: ScoredMarket, depth = 9): Book {
  const rng = mulberry32(hashSeed(market.marketId + "book"));
  const ask0 = Math.round((market.bestAsk ?? 0.55) * 100);
  const bid0 = Math.round((market.bestBid ?? 0.5) * 100);
  const asks: Level[] = [];
  const bids: Level[] = [];
  for (let i = 0; i < depth; i++) {
    asks.push({ price: Math.min(99, ask0 + i), size: Math.round((rng() * 40 + 6) * (1 + i * 0.2)) * 100 });
    bids.push({ price: Math.max(1, bid0 - i), size: Math.round((rng() * 40 + 6) * (1 + i * 0.2)) * 100 });
  }
  return { asks: asks.reverse(), bids };
}

/** 24h derived stats from the YES price + volume, seeded for stability. */
export function genStats(market: ScoredMarket): { high: number; low: number; changePct: number; openInterest: number } {
  const rng = mulberry32(hashSeed(market.marketId + "stats"));
  const c = Math.round((market.bestAsk ?? 0.5) * 100);
  const high = Math.min(99, c + Math.round(rng() * 8 + 2));
  const low = Math.max(1, c - Math.round(rng() * 8 + 2));
  const changePct = Math.round((rng() * 12 - 5) * 10) / 10;
  const openInterest = Math.round(market.volume * (1.4 + rng()));
  return { high, low, changePct, openInterest };
}
