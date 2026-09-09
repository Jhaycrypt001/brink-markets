import type { BinaryMarket } from "../domain/market.js";
import { isBinaryMarket, type SomniaMarkets, type UnifiedTrade } from "@somnia-chain/markets-sdk";

/** OHLCV candle in ccxt shape: [openTimeMs, open, high, low, close, volume]. */
export type Candle = [number, number, number, number, number, number];

/** A ranked trader, aggregated from real on-chain fills. */
export type LeaderEntry = {
  address: string;
  volume: number;
  fills: number;
  markets: number;
  lastActive: number;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export interface MarketSource {
  listLiveBinaryMarkets(): Promise<BinaryMarket[]>;
  fetchOHLCV(symbol: string, timeframe: string, limit: number): Promise<Candle[]>;
  fetchLeaderboard(marketsLimit: number, tradesPerMarket: number, topN: number): Promise<LeaderEntry[]>;
}

/**
 * The API depends on this narrow port instead of importing SDK details into
 * HTTP handlers. The DreamDEX adapter can be swapped or contract-tested
 * without changing scoring, caching, or route behavior.
 */
export class DreamDexMarketSource implements MarketSource {
  public constructor(private readonly exchange: SomniaMarkets) {}

  public async listLiveBinaryMarkets(): Promise<BinaryMarket[]> {
    const now = Date.now();
    const unifiedMarkets = await this.exchange.loadMarkets(true);
    const markets: BinaryMarket[] = [];

    for (const unified of Object.values(unifiedMarkets)) {
      if (unified.type !== "binary" || !unified.active || !isBinaryMarket(unified.info)) continue;
      const market = unified.info;
      const onchain = await this.exchange.client.getMarketOnchain(market.marketId);
      const outcome = unified.outcomes?.[0];
      if (!outcome) continue;
      const book = await this.exchange.fetchOrderBook(outcome.symbol, 5);
      markets.push({
        marketId: market.marketId,
        symbol: outcome.symbol,
        question: market.question,
        asset: market.asset,
        intervalSec: Number(market.intervalSec ?? 0),
        expiry: Number(market.expiry),
        status: onchain.status === 1 ? "Trading" : "Locked",
        volume: Number(market.cumulativeQuoteVolume) / 10 ** market.quoteDecimals,
        tradeCount: Number(market.tradeCount),
        // Do not pass `book.info` through: the SDK keeps raw bigint levels
        // there for advanced callers, but API payloads must be JSON-safe.
        orderBook: { bids: book.bids, asks: book.asks, observedAt: now }
      });
    }
    return markets;
  }

  public async fetchOHLCV(symbol: string, timeframe: string, limit: number): Promise<Candle[]> {
    await this.exchange.loadMarkets();
    const rows = await this.exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
    return rows as Candle[];
  }

  /**
   * Aggregate a real trader leaderboard from on-chain fills. For each live
   * binary market we page its recent fill tape and credit every participating
   * address (maker and taker) with the notional it traded. Everything here is
   * real indexer data — there are no fabricated standings.
   */
  public async fetchLeaderboard(marketsLimit: number, tradesPerMarket: number, topN: number): Promise<LeaderEntry[]> {
    const unifiedMarkets = await this.exchange.loadMarkets(true);
    const symbols: string[] = [];
    for (const unified of Object.values(unifiedMarkets)) {
      if (unified.type !== "binary" || !isBinaryMarket(unified.info)) continue;
      const outcome = unified.outcomes?.[0];
      if (outcome) symbols.push(outcome.symbol);
    }

    const agg = new Map<string, { volume: number; fills: number; markets: Set<string>; lastActive: number }>();
    for (const symbol of symbols.slice(0, marketsLimit)) {
      let trades: UnifiedTrade[];
      try {
        trades = await this.exchange.fetchTrades(symbol, undefined, tradesPerMarket);
      } catch {
        continue; // a single market's tape failing must not sink the board
      }
      for (const trade of trades) {
        const info = trade.info as { maker?: string | null; taker?: string | null } | null | undefined;
        const parties = [info?.maker, info?.taker].filter(
          (a): a is string => typeof a === "string" && a.toLowerCase() !== ZERO_ADDRESS
        );
        for (const raw of parties) {
          const key = raw.toLowerCase();
          const entry = agg.get(key) ?? { volume: 0, fills: 0, markets: new Set<string>(), lastActive: 0 };
          entry.volume += Number.isFinite(trade.cost) ? trade.cost : 0;
          entry.fills += 1;
          entry.markets.add(symbol);
          entry.lastActive = Math.max(entry.lastActive, trade.timestamp);
          agg.set(key, entry);
        }
      }
    }

    return [...agg.entries()]
      .map(([address, e]) => ({ address, volume: e.volume, fills: e.fills, markets: e.markets.size, lastActive: e.lastActive }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, topN);
  }
}

export class EmptyMarketSource implements MarketSource {
  public async listLiveBinaryMarkets(): Promise<BinaryMarket[]> {
    return [];
  }

  public async fetchOHLCV(): Promise<Candle[]> {
    return [];
  }

  public async fetchLeaderboard(): Promise<LeaderEntry[]> {
    return [];
  }
}
