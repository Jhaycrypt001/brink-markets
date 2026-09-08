import type { BinaryMarket } from "../domain/market.js";
import { isBinaryMarket, type SomniaMarkets } from "@somnia-chain/markets-sdk";

/** OHLCV candle in ccxt shape: [openTimeMs, open, high, low, close, volume]. */
export type Candle = [number, number, number, number, number, number];

export interface MarketSource {
  listLiveBinaryMarkets(): Promise<BinaryMarket[]>;
  fetchOHLCV(symbol: string, timeframe: string, limit: number): Promise<Candle[]>;
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
}

export class EmptyMarketSource implements MarketSource {
  public async listLiveBinaryMarkets(): Promise<BinaryMarket[]> {
    return [];
  }

  public async fetchOHLCV(): Promise<Candle[]> {
    return [];
  }
}
